const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { toUpperCaseFields } = require('../utils/uppercase');
const speakeasy = require('speakeasy');
const { enviarCorreo } = require('../config/mailer');
const QRCode = require('qrcode');


// v9.5 — Auditoría persistente de gestión de usuarios (reemplaza al trigger
// eliminado). Tolerante a fallos: nunca rompe la operación principal.
async function auditar(req, accion, usuarioIdObjetivo, datos) {
    try {
        const actor = req.usuario ? req.usuario.id : null;
        await pool.query(
            'INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_nuevos) VALUES ($1, $2, $3, $4::jsonb)',
            [usuarioIdObjetivo || null, actor, accion, JSON.stringify(datos || {})]
        );
    } catch (e) {
        console.warn('[auditoria] no se pudo registrar', accion, ':', e.message);
    }
}

// ============================================================
// LISTAR USUARIOS
// ============================================================
router.get('/', verificarToken, soloAdmin, async (req, res) => {
    try {
        const { busqueda, rol, activo, ordenar_por = 'created_at', orden = 'DESC' } = req.query;
        let query = 'SELECT id, nombre, email, rol, activo, ip_asignada, tienda, created_at, updated_at FROM usuarios WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (busqueda) {
            query += ` AND (nombre ILIKE $${paramIndex} OR email ILIKE $${paramIndex})`;
            params.push(`%${busqueda}%`);
            paramIndex++;
        }
        if (rol) {
            query += ` AND rol = $${paramIndex}`;
            params.push(rol);
            paramIndex++;
        }
        if (activo !== undefined) {
            query += ` AND activo = $${paramIndex}`;
            params.push(activo === 'true');
            paramIndex++;
        }

        query += ` ORDER BY ${ordenar_por} ${orden === 'ASC' ? 'ASC' : 'DESC'}`;
        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error listando usuarios:', err);
        res.status(500).json({ error: 'Error al listar usuarios' });
    }
});

// ============================================================
// OBTENER USUARIO POR ID
// FIX (v9.2): antes cualquier usuario autenticado (incluso un
// vendedor) podía leer los datos de OTRO usuario por ID. Ahora:
// solo administrador, o el propio usuario consultándose a sí mismo.
// ============================================================
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const idSolicitado = parseInt(req.params.id, 10);
        if (req.usuario.rol !== 'administrador' && req.usuario.id !== idSolicitado) {
            return res.status(403).json({ error: 'No tienes permiso para ver este usuario' });
        }
        const result = await pool.query(
            'SELECT id, nombre, email, rol, activo, ip_asignada, tienda, token_version, created_at, updated_at FROM usuarios WHERE id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo usuario:', err);
        res.status(500).json({ error: 'Error al obtener usuario' });
    }
});

// ============================================================
// CREAR USUARIO (POST)
// ============================================================
router.post('/', verificarToken, soloAdmin, [
    body('nombre').notEmpty().withMessage('Nombre es obligatorio'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('Password mínimo 8 caracteres'),
    body('rol').isIn(['administrador', 'operador', 'vendedor']).withMessage('Rol inválido')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        // FIX: No convertir 'rol' a mayúsculas — el constraint de BD solo acepta minúsculas
        const upperFields = ['nombre', 'ip_asignada'];
        const datos = toUpperCaseFields(req.body, upperFields);
        const { nombre, email, password, rol, ip_asignada, tienda } = datos;

        // Verificar email único
        const existe = await pool.query('SELECT id FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        if (existe.rows.length > 0) {
            return res.status(409).json({ error: 'Email ya registrado' });
        }

        const hashedPassword = await bcrypt.hash(password, 12);
        // v8.1: el rol vendedor nunca lleva IP ni tienda (como administración)
        const esVendedor = rol.toLowerCase() === 'vendedor';
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, password, rol, ip_asignada, tienda, token_version, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre, email, rol, activo, ip_asignada, tienda, created_at`,
            [nombre, email.toLowerCase(), hashedPassword, rol.toLowerCase(),
             esVendedor ? null : (ip_asignada || null), esVendedor ? null : (tienda || null), 1, true]
        );

        await auditar(req, 'CREAR_USUARIO', result.rows[0].id, { email: email.toLowerCase(), rol: rol.toLowerCase() });
        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creando usuario:', err);
        res.status(500).json({ error: 'Error al crear usuario' });
    }
});

// ============================================================
// ACTUALIZAR USUARIO (PUT)
// ============================================================
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const usuarioActual = await pool.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (usuarioActual.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const usuario = usuarioActual.rows[0];
        const esAdmin = req.usuario.rol === 'administrador';
        const esSelf = req.usuario.id === parseInt(id);

        if (!esAdmin && !esSelf) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        // FIX: No convertir 'rol' a mayúsculas
        const upperFields = ['nombre', 'ip_asignada'];
        const datos = toUpperCaseFields(req.body, upperFields);
        const { nombre, email, rol, activo, ip_asignada, tienda, password } = datos;

        let query = 'UPDATE usuarios SET ';
        const sets = [];
        const valores = [];
        let paramIndex = 1;

        // v8.1: si el rol (nuevo o actual) es vendedor, IP y tienda quedan en NULL
        const rolFinal = (rol !== undefined) ? rol.toLowerCase() : usuario.rol;
        const forzarSinIpTienda = esAdmin && rolFinal === 'vendedor';

        if (nombre !== undefined) { sets.push(`nombre = $${paramIndex++}`); valores.push(nombre); }
        if (email !== undefined) { sets.push(`email = $${paramIndex++}`); valores.push(email.toLowerCase()); }
        if (esAdmin && rol !== undefined) { sets.push(`rol = $${paramIndex++}`); valores.push(rol.toLowerCase()); }
        if (esAdmin && activo !== undefined) { sets.push(`activo = $${paramIndex++}`); valores.push(activo); }
        if (forzarSinIpTienda) {
            sets.push(`ip_asignada = $${paramIndex++}`); valores.push(null);
            sets.push(`tienda = $${paramIndex++}`); valores.push(null);
        } else {
            if (esAdmin && ip_asignada !== undefined) { sets.push(`ip_asignada = $${paramIndex++}`); valores.push(ip_asignada); }
            if (esAdmin && tienda !== undefined) { sets.push(`tienda = $${paramIndex++}`); valores.push(tienda); }
        }

        if (sets.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        // v9.3.1 — El ADMIN puede cambiarle la contraseña a cualquier usuario
        // (desde el modal de editar; campo opcional, en blanco = no cambia).
        const cambiaPassword = esAdmin && password && String(password).length >= 8;
        if (esAdmin && password && String(password).length < 8) {
            return res.status(400).json({ error: 'La contraseña debe tener mínimo 8 caracteres' });
        }
        if (cambiaPassword) {
            const hashed = await bcrypt.hash(String(password), 12);
            sets.push(`password = $${paramIndex++}`); valores.push(hashed);
        }

        // Si cambia rol, estado, IP o contraseña → revocar sesiones (token_version)
        const cambiaRol = esAdmin && rol !== undefined && rol.toLowerCase() !== usuario.rol;
        const cambiaActivo = esAdmin && activo !== undefined && activo !== usuario.activo;
        const cambiaIP = esAdmin && ip_asignada !== undefined && ip_asignada !== usuario.ip_asignada;
        if (cambiaRol || cambiaActivo || cambiaIP || cambiaPassword) {
            sets.push(`token_version = token_version + 1`);
        }

        sets.push(`updated_at = CURRENT_TIMESTAMP`);
        query += sets.join(', ') + ` WHERE id = $${paramIndex}`;
        valores.push(id);

        const result = await pool.query(query, valores);
        await auditar(req, 'ACTUALIZAR_USUARIO', parseInt(id), { campos: sets.map(s => s.split(' ')[0]) });
        res.json({ message: 'Usuario actualizado', usuario: result.rows[0] });
    } catch (err) {
        console.error('Error actualizando usuario:', err);
        res.status(500).json({ error: 'Error al actualizar usuario' });
    }
});

// ============================================================
// ELIMINAR USUARIO (Soft Delete)
// ============================================================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({ error: 'No puedes eliminarte a ti mismo' });
        }

        const result = await pool.query(
            'UPDATE usuarios SET activo = false, token_version = token_version + 1 WHERE id = $1 RETURNING id, nombre, email, activo',
            [id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        await auditar(req, 'DESACTIVAR_USUARIO', parseInt(id), {});
        res.json({ message: 'Usuario desactivado', usuario: result.rows[0] });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ============================================================
// ELIMINAR USUARIO PERMANENTEMENTE (v9.3.1)
// Borrado físico de la fila. Protecciones: no a sí mismo, no al
// último administrador activo, y mensaje claro si hay registros
// vinculados (auditoría) que lo impidan (mejor desactivar).
// ============================================================
router.delete('/:id/permanente', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = req.params.id;
        if (parseInt(id) === req.usuario.id) {
            return res.status(400).json({ error: 'No puedes eliminar tu propia cuenta' });
        }

        const obj = await pool.query('SELECT rol, nombre FROM usuarios WHERE id = $1', [id]);
        if (obj.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        if (obj.rows[0].rol === 'administrador') {
            const admins = await pool.query(
                "SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador' AND activo = true"
            );
            if (parseInt(admins.rows[0].count) <= 1) {
                return res.status(400).json({ error: 'No se puede eliminar al último administrador activo' });
            }
        }

        // v9.3.7 — BORRADO TOTAL sin rastro del usuario:
        // 1) Tablas PROPIAS del usuario: se eliminan sus filas.
        // 2) Tablas COMPARTIDAS (actividades, notificaciones, resúmenes...): se
        //    quita su firma (FK a NULL) para no borrar datos del equipo.
        // Cada limpieza es tolerante a fallos (si una tabla/columna difiere,
        // se registra y se continúa).
        const limpiar = async (sql) => {
            try { await pool.query(sql, [id]); }
            catch (e) { console.warn('[eliminar-usuario] limpieza parcial:', e.message); }
        };
        await limpiar('DELETE FROM reset_tokens WHERE usuario_id = $1');
        await limpiar('DELETE FROM auditoria_usuarios WHERE usuario_id = $1 OR usuario_accion_id = $1');
        await limpiar('DELETE FROM sesiones WHERE usuario_id = $1');
        await limpiar('UPDATE actividades SET creado_por = NULL WHERE creado_por = $1');
        await limpiar('UPDATE actividades SET completado_por = NULL WHERE completado_por = $1');
        await limpiar('UPDATE alertas_config SET usuario_id = NULL WHERE usuario_id = $1');
        await limpiar('UPDATE conversaciones_asistente SET usuario_id = NULL WHERE usuario_id = $1');
        await limpiar('UPDATE notificaciones SET usuario_id = NULL WHERE usuario_id = $1');
        await limpiar('UPDATE resumenes_diarios SET usuario_id = NULL WHERE usuario_id = $1');

        // Borrado físico del usuario (la auditoría ya fue eliminada arriba)
        await pool.query('DELETE FROM usuarios WHERE id = $1', [id]);
        await auditar(req, 'ELIMINAR_PERMANENTE', null, { usuario_eliminado_id: parseInt(id), nombre: obj.rows[0].nombre });
        res.json({ message: 'Usuario y todos sus registros eliminados permanentemente' });
    } catch (err) {
        // v9.3.8 — SIEMPRE registrar el detalle del bloqueo (tabla y constraint)
        // para que sea diagnóstico en el journal, no un 409 mudo.
        if (err.code === '23503') {
            console.error('[eliminar-usuario] FK bloqueante → tabla:', err.table,
                '| constraint:', err.constraint, '| detalle:', err.detail);
            return res.status(409).json({
                error: 'No se puede eliminar: el usuario tiene registros vinculados (' +
                    (err.table || 'tabla desconocida') + '). Desactívelo en su lugar.'
            });
        }
        console.error('Error eliminando usuario permanentemente:', err);
        res.status(500).json({ error: 'Error al eliminar usuario' });
    }
});

// ============================================================
// REACTIVAR USUARIO
// ============================================================
router.patch('/:id/reactivar', verificarToken, soloAdmin, async (req, res) => {
    try {
        const result = await pool.query(
            'UPDATE usuarios SET activo = true, token_version = token_version + 1 WHERE id = $1 RETURNING id, nombre, email, activo',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        await auditar(req, 'REACTIVAR_USUARIO', parseInt(id), {});
        res.json({ message: 'Usuario reactivado', usuario: result.rows[0] });
    } catch (err) {
        console.error('Error reactivando usuario:', err);
        res.status(500).json({ error: 'Error al reactivar usuario' });
    }
});

// ============================================================
// MFA (2FA) — TOTP con app authenticator (v9.5)
// Cada usuario gestiona su propio 2FA desde Mi Perfil.
// ============================================================

// Paso 1: genera secreto temporal y devuelve QR
router.post('/mfa/setup', verificarToken, async (req, res) => {
    try {
        const gen = speakeasy.generateSecret({ length: 20 });
        const secreto = gen.base32;
        await pool.query('UPDATE usuarios SET mfa_temp_secret = $1 WHERE id = $2', [secreto, req.usuario.id]);
        const otpauth = speakeasy.otpauthURL({ secret: secreto, label: req.usuario.email, issuer: 'IPSFA Creditos', encoding: 'base32' });
        const qr = await QRCode.toDataURL(otpauth, { width: 220 });
        res.json({ secreto, qr });
    } catch (err) {
        console.error('Error generando setup MFA:', err);
        res.status(500).json({ error: 'Error al generar el código QR' });
    }
});

// Paso 2: verifica el primer código y activa el 2FA
router.post('/mfa/verify', verificarToken, async (req, res) => {
    try {
        const codigo = String(req.body.codigo || '').trim().replace(/\s/g, '');
        if (!/^\d{6}$/.test(codigo)) {
            return res.status(400).json({ error: 'El código son 6 dígitos' });
        }
        const u = await pool.query('SELECT mfa_temp_secret FROM usuarios WHERE id = $1', [req.usuario.id]);
        if (u.rows.length === 0 || !u.rows[0].mfa_temp_secret) {
            return res.status(400).json({ error: 'Primero solicita el código QR (Activar 2FA)' });
        }
        const okMfa = speakeasy.totp.verify({
            token: codigo,
            secret: u.rows[0].mfa_temp_secret,
            encoding: 'base32',
            window: 1
        });
        if (!okMfa) {
            return res.status(400).json({ error: 'Código incorrecto. Reintenta con el código actual de la app.' });
        }
        await pool.query(
            'UPDATE usuarios SET mfa_secret = mfa_temp_secret, mfa_enabled = true, mfa_temp_secret = NULL WHERE id = $1',
            [req.usuario.id]
        );
        await auditar(req, 'MFA_ACTIVAR', req.usuario.id, {});
        res.json({ exito: true, mensaje: 'Doble factor activado correctamente' });
    } catch (err) {
        console.error('Error verificando MFA:', err);
        res.status(500).json({ error: 'Error al verificar el código' });
    }
});

// Desactivar 2FA (confirma con contraseña y mata las sesiones)
router.post('/mfa/disable', verificarToken, async (req, res) => {
    try {
        const password = String(req.body.password || '');
        if (!password) {
            return res.status(400).json({ error: 'Debes confirmar tu contraseña' });
        }
        const u = await pool.query('SELECT password FROM usuarios WHERE id = $1', [req.usuario.id]);
        if (u.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        const valido = await bcrypt.compare(password, u.rows[0].password);
        if (!valido) {
            return res.status(400).json({ error: 'Contraseña incorrecta' });
        }
        await pool.query(
            'UPDATE usuarios SET mfa_enabled = false, mfa_secret = NULL, mfa_temp_secret = NULL, token_version = token_version + 1 WHERE id = $1',
            [req.usuario.id]
        );
        await auditar(req, 'MFA_DESACTIVAR', req.usuario.id, {});
        res.json({ exito: true, mensaje: 'Doble factor desactivado. Inicia sesión nuevamente.' });
    } catch (err) {
        console.error('Error desactivando MFA:', err);
        res.status(500).json({ error: 'Error al desactivar 2FA' });
    }
});

// ============================================================
// CAMBIAR PASSWORD
// ============================================================
router.put('/:id/password', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const esAdmin = req.usuario.rol === 'administrador';
        const esSelf = req.usuario.id === parseInt(id);

        if (!esAdmin && !esSelf) {
            return res.status(403).json({ error: 'No autorizado' });
        }

        const { password_actual, password_nuevo } = req.body;
        if (!password_nuevo || password_nuevo.length < 8) {
            return res.status(400).json({ error: 'Password nuevo mínimo 8 caracteres' });
        }

        const usuario = await pool.query('SELECT password, token_version FROM usuarios WHERE id = $1', [id]);
        if (usuario.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        if (esSelf) {
            const valido = await bcrypt.compare(password_actual, usuario.rows[0].password);
            if (!valido) {
                return res.status(400).json({ error: 'Password actual incorrecto' });
            }
        }

        const hashed = await bcrypt.hash(password_nuevo, 12);
        await pool.query(
            'UPDATE usuarios SET password = $1, token_version = token_version + 1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
            [hashed, id]
        );

        res.json({ message: 'Password actualizado. Inicie sesión nuevamente.' });
    } catch (err) {
        console.error('Error cambiando password:', err);
        res.status(500).json({ error: 'Error al cambiar password' });
    }
});

// ============================================================
// RECUPERAR PASSWORD
// ============================================================
router.post('/recuperar-password', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ error: 'Email requerido' });
        }

        // v9.5 — Respuesta GENÉRICA: no revelar si el email está registrado
        // (evita enumeración de cuentas). El token solo se genera si existe.
        const usuario = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND activo = true', [email.toLowerCase()]);
        if (usuario.rows.length === 0) {
            return res.json({ message: 'Si el email existe, se han enviado instrucciones (ver logs del servidor).' });
        }

        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await pool.query(
            'INSERT INTO reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
            [usuario.rows[0].id, token, expiresAt]
        );

        // v9.8 — envío REAL del correo con enlace de restablecimiento
        const url = (process.env.APP_URL || 'https://ventasinversora.com') + '/reset.html?token=' + token;
        await enviarCorreo(
            email.toLowerCase(),
            'Recuperación de contraseña — Sistema de Créditos IPSFA',
            'Restablece tu contraseña',
            '<p>Hola,</p>' +
            '<p>Recibimos una solicitud para restablecer la contraseña de tu cuenta. ' +
            'El enlace es válido por <strong>1 hora</strong>.</p>' +
            '<p style="text-align:center;margin:24px 0;">' +
            '<a href="' + url + '" style="background:#2c5282;color:#fff;padding:12px 28px;' +
            'border-radius:8px;text-decoration:none;font-weight:700;">Restablecer contraseña</a></p>' +
            '<p style="font-size:12px;color:#718096;">Si el botón no funciona, copia este enlace:<br>' + url + '</p>' +
            '<p>Si no solicitaste este cambio, ignora este correo y tu contraseña seguirá igual.</p>'
        );
        // Respuesta GENÉRICA (no revela si el email existe)
        res.json({ message: 'Si el email existe, se han enviado instrucciones para restablecer la contraseña.' });
    } catch (err) {
        console.error('Error recuperando password:', err);
        res.status(500).json({ error: 'Error al procesar solicitud' });
    }
});

// ============================================================
// RESTABLECER PASSWORD
// ============================================================
router.post('/restablecer-password', async (req, res) => {
    try {
        const { token, password_nuevo } = req.body;
        if (!token || !password_nuevo || password_nuevo.length < 8) {
            return res.status(400).json({ error: 'Token y password nuevo (mín 8 chars) requeridos' });
        }

        const resetToken = await pool.query(
            'SELECT usuario_id FROM reset_tokens WHERE token = $1 AND expires_at > NOW() AND used = false',
            [token]
        );
        if (resetToken.rows.length === 0) {
            return res.status(400).json({ error: 'Token inválido o expirado' });
        }

        const hashed = await bcrypt.hash(password_nuevo, 12);
        await pool.query('BEGIN');
        await pool.query('UPDATE usuarios SET password = $1, token_version = token_version + 1 WHERE id = $2', [hashed, resetToken.rows[0].usuario_id]);
        await pool.query('UPDATE reset_tokens SET used = true WHERE token = $1', [token]);
        await pool.query('COMMIT');

        res.json({ message: 'Password restablecido exitosamente' });
    } catch (err) {
        await pool.query('ROLLBACK');
        console.error('Error restableciendo password:', err);
        res.status(500).json({ error: 'Error al restablecer password' });
    }
});

// ============================================================
// PERFIL DEL USUARIO AUTENTICADO
// ============================================================
router.get('/perfil/me', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT id, nombre, email, rol, activo, ip_asignada, tienda, mfa_enabled, created_at, updated_at FROM usuarios WHERE id = $1',
            [req.usuario.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo perfil:', err);
        res.status(500).json({ error: 'Error al obtener perfil' });
    }
});

// ============================================================
// AUDITORÍA DE USUARIO
// ============================================================
router.get('/auditoria/:usuarioId', verificarToken, soloAdmin, async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const result = await pool.query(
            `SELECT a.*, COALESCE(u.nombre, a.usuario_nombre) as usuario_nombre
             FROM auditoria_usuarios a
             LEFT JOIN usuarios u ON a.usuario_accion_id = u.id
             WHERE a.usuario_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            [req.params.usuarioId, parseInt(limit), offset]
        );

        const count = await pool.query('SELECT COUNT(*) FROM auditoria_usuarios WHERE usuario_id = $1', [req.params.usuarioId]);

        res.json({
            auditoria: result.rows,
            total: parseInt(count.rows[0].count),
            page: parseInt(page),
            pages: Math.ceil(parseInt(count.rows[0].count) / parseInt(limit))
        });
    } catch (err) {
        console.error('Error obteniendo auditoría:', err);
        res.status(500).json({ error: 'Error al obtener auditoría' });
    }
});

// ============================================================
// ESTADÍSTICAS DE USUARIOS
// ============================================================
router.get('/estadisticas/resumen', verificarToken, soloAdmin, async (req, res) => {
    try {
        const total = await pool.query('SELECT COUNT(*) FROM usuarios');
        const activos = await pool.query('SELECT COUNT(*) FROM usuarios WHERE activo = true');
        const inactivos = await pool.query('SELECT COUNT(*) FROM usuarios WHERE activo = false');
        const admins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'administrador'");
        const operadores = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'operador'");
        const conIP = await pool.query('SELECT COUNT(*) FROM usuarios WHERE ip_asignada IS NOT NULL');
        const sinIP = await pool.query('SELECT COUNT(*) FROM usuarios WHERE ip_asignada IS NULL');

        res.json({
            total: parseInt(total.rows[0].count),
            activos: parseInt(activos.rows[0].count),
            inactivos: parseInt(inactivos.rows[0].count),
            administradores: parseInt(admins.rows[0].count),
            operadores: parseInt(operadores.rows[0].count),
            con_ip: parseInt(conIP.rows[0].count),
            sin_ip: parseInt(sinIP.rows[0].count)
        });
    } catch (err) {
        console.error('Error obteniendo estadísticas:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
