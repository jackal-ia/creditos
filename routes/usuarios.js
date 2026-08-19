const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const { toUpperCaseFields } = require('../utils/uppercase');

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
// ============================================================
router.get('/:id', verificarToken, async (req, res) => {
    try {
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
    body('rol').isIn(['administrador', 'operador']).withMessage('Rol inválido')
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
        const result = await pool.query(
            `INSERT INTO usuarios (nombre, email, password, rol, ip_asignada, tienda, token_version, activo)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id, nombre, email, rol, activo, ip_asignada, tienda, created_at`,
            [nombre, email.toLowerCase(), hashedPassword, rol.toLowerCase(), ip_asignada || null, tienda || null, 1, true]
        );

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
        const { nombre, email, rol, activo, ip_asignada, tienda } = datos;

        let query = 'UPDATE usuarios SET ';
        const sets = [];
        const valores = [];
        let paramIndex = 1;

        if (nombre !== undefined) { sets.push(`nombre = $${paramIndex++}`); valores.push(nombre); }
        if (email !== undefined) { sets.push(`email = $${paramIndex++}`); valores.push(email.toLowerCase()); }
        if (esAdmin && rol !== undefined) { sets.push(`rol = $${paramIndex++}`); valores.push(rol.toLowerCase()); }
        if (esAdmin && activo !== undefined) { sets.push(`activo = $${paramIndex++}`); valores.push(activo); }
        if (esAdmin && ip_asignada !== undefined) { sets.push(`ip_asignada = $${paramIndex++}`); valores.push(ip_asignada); }
        if (esAdmin && tienda !== undefined) { sets.push(`tienda = $${paramIndex++}`); valores.push(tienda); }

        if (sets.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        // Si cambia rol, estado o IP → revocar sesiones (incrementar token_version)
        const cambiaRol = esAdmin && rol !== undefined && rol.toLowerCase() !== usuario.rol;
        const cambiaActivo = esAdmin && activo !== undefined && activo !== usuario.activo;
        const cambiaIP = esAdmin && ip_asignada !== undefined && ip_asignada !== usuario.ip_asignada;
        if (cambiaRol || cambiaActivo || cambiaIP) {
            sets.push(`token_version = token_version + 1`);
        }

        sets.push(`updated_at = CURRENT_TIMESTAMP`);
        query += sets.join(', ') + ` WHERE id = $${paramIndex}`;
        valores.push(id);

        const result = await pool.query(query, valores);
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
        res.json({ message: 'Usuario desactivado', usuario: result.rows[0] });
    } catch (err) {
        console.error('Error eliminando usuario:', err);
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
        res.json({ message: 'Usuario reactivado', usuario: result.rows[0] });
    } catch (err) {
        console.error('Error reactivando usuario:', err);
        res.status(500).json({ error: 'Error al reactivar usuario' });
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

        const usuario = await pool.query('SELECT id FROM usuarios WHERE email = $1 AND activo = true', [email.toLowerCase()]);
        if (usuario.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const token = require('crypto').randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

        await pool.query(
            'INSERT INTO reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
            [usuario.rows[0].id, token, expiresAt]
        );

        console.log(`Token de recuperación generado para ${email}: ${token}`);
        res.json({ message: 'Si el email existe, se ha enviado instrucciones (ver logs del servidor).' });
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
            'SELECT id, nombre, email, rol, activo, ip_asignada, tienda, created_at, updated_at FROM usuarios WHERE id = $1',
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
            `SELECT a.*, u.nombre as usuario_nombre 
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
