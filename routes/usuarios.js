const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const pool = require('../config/database');
const { verificarToken, soloAdmin, registrarAuditoria } = require('../middleware/auth');

// ============================================
// HELPERS
// ============================================

async function logAuditoria(client, usuarioId, usuarioAccionId, accion, datosAnteriores, datosNuevos, ipAddress) {
    try {
        await client.query(
            `INSERT INTO auditoria_usuarios 
             (usuario_id, usuario_accion_id, accion, datos_anteriores, datos_nuevos, ip_address)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [
                usuarioId, 
                usuarioAccionId, 
                accion, 
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos ? JSON.stringify(datosNuevos) : null,
                ipAddress || null
            ]
        );
    } catch (err) {
        console.error('Error en auditoria:', err.message);
    }
}

// ============================================
// 1. LISTAR TODOS LOS USUARIOS (Admin)
// ============================================
router.get('/', verificarToken, soloAdmin, async (req, res) => {
    try {
        const { busqueda, rol, activo, ordenar_por = 'created_at', orden = 'DESC' } = req.query;

        let query = `
            SELECT id, nombre, email, rol, activo, ip_asignada,
                   TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as fecha_creacion,
                   TO_CHAR(updated_at, 'DD/MM/YYYY HH24:MI') as fecha_actualizacion
            FROM usuarios 
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (busqueda) {
            paramCount++;
            query += ` AND (nombre ILIKE $${paramCount} OR email ILIKE $${paramCount})`;
            params.push(`%${busqueda}%`);
        }

        if (rol) {
            paramCount++;
            query += ` AND rol = $${paramCount}`;
            params.push(rol);
        }

        if (activo !== undefined && activo !== '') {
            paramCount++;
            query += ` AND activo = $${paramCount}`;
            params.push(activo === 'true');
        }

        const columnasPermitidas = ['nombre', 'email', 'rol', 'created_at', 'updated_at'];
        const columnaOrden = columnasPermitidas.includes(ordenar_por) ? ordenar_por : 'created_at';
        const ordenDir = orden.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

        query += ` ORDER BY ${columnaOrden} ${ordenDir}`;

        const result = await pool.query(query, params);

        res.json({
            exito: true,
            total: result.rows.length,
            usuarios: result.rows
        });
    } catch (err) {
        console.error('Error listando usuarios:', err);
        res.status(500).json({ error: 'Error al obtener usuarios', detalle: err.message });
    }
});

// ============================================
// 2. OBTENER UN USUARIO POR ID
// ============================================
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;

        if (req.usuario.rol !== 'administrador' && parseInt(req.usuario.id) !== parseInt(id)) {
            return res.status(403).json({ error: 'No tienes permiso para ver este usuario' });
        }

        const result = await pool.query(
            `SELECT id, nombre, email, rol, activo, ip_asignada,
                    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as fecha_creacion,
                    TO_CHAR(updated_at, 'DD/MM/YYYY HH24:MI') as fecha_actualizacion
             FROM usuarios WHERE id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ exito: true, usuario: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener usuario', detalle: err.message });
    }
});

// ============================================
// 3. CREAR NUEVO USUARIO (Admin) - IP OBLIGATORIA PARA OPERADORES
// ============================================
router.post('/',
    verificarToken,
    soloAdmin,
    [
        body('nombre').trim().notEmpty().withMessage('El nombre es obligatorio').isLength({ max: 100 }),
        body('email').trim().isEmail().withMessage('Email invalido').normalizeEmail(),
        body('password').isLength({ min: 6 }).withMessage('La contrasena debe tener minimo 6 caracteres'),
        body('rol').isIn(['administrador', 'operador']).withMessage('Rol invalido'),
        body('ip_asignada')
            .custom((value, { req }) => {
                // Si es operador, la IP es obligatoria
                if (req.body.rol === 'operador') {
                    if (!value || value.trim() === '') {
                        throw new Error('La IP asignada es obligatoria para operadores');
                    }
                }
                return true;
            })
            .optional({ checkFalsy: true })
            .trim()
            .isIP()
            .withMessage('La IP debe ser valida (IPv4 o IPv6)')
    ],
    async (req, res) => {
        const client = await pool.connect();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ exito: false, errores: errors.array() });
            }

            await client.query('BEGIN');

            const { nombre, email, password, rol = 'operador', ip_asignada } = req.body;

            const existe = await client.query('SELECT id FROM usuarios WHERE email = $1', [email]);
            if (existe.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ exito: false, error: 'El email ya esta registrado' });
            }

            const hashedPassword = await bcrypt.hash(password, 12);

            // Si es operador, forzar IP (ya validado arriba, pero doble seguridad)
            const ipFinal = (rol === 'operador') ? ip_asignada : (ip_asignada || null);

            const result = await client.query(
                `INSERT INTO usuarios (nombre, email, password, rol, activo, ip_asignada) 
                 VALUES ($1, $2, $3, $4, true, $5) 
                 RETURNING id, nombre, email, rol, activo, ip_asignada,
                           TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as fecha_creacion`,
                [nombre, email, hashedPassword, rol, ipFinal]
            );

            await logAuditoria(client, result.rows[0].id, req.usuario.id, 'CREAR', null, result.rows[0], null);

            await client.query('COMMIT');

            res.status(201).json({
                exito: true,
                mensaje: 'Usuario creado correctamente',
                usuario: result.rows[0]
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error creando usuario:', err);
            res.status(500).json({ exito: false, error: 'Error al crear usuario', detalle: err.message });
        } finally {
            client.release();
        }
    }
);

// ============================================
// 4. ACTUALIZAR USUARIO - IP OBLIGATORIA PARA OPERADORES
// ============================================
router.put('/:id',
    verificarToken,
    [
        body('nombre').optional().trim().isLength({ min: 1, max: 100 }),
        body('email').optional().trim().isEmail().normalizeEmail(),
        body('rol').optional().isIn(['administrador', 'operador']),
        body('activo').optional().isBoolean(),
        body('ip_asignada')
            .custom((value, { req }) => {
                // Si se está cambiando a operador o ya es operador, validar IP
                const rolFinal = req.body.rol || req.usuario?.rol;
                if (rolFinal === 'operador') {
                    if (value === '' || value === null || value === undefined) {
                        throw new Error('La IP asignada es obligatoria para operadores');
                    }
                }
                return true;
            })
            .optional({ checkFalsy: true })
            .trim()
            .isIP()
            .withMessage('La IP debe ser valida (IPv4 o IPv6)')
    ],
    async (req, res) => {
        const client = await pool.connect();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ exito: false, errores: errors.array() });
            }

            const { id } = req.params;
            const usuarioActual = req.usuario;

            const esAdmin = usuarioActual.rol === 'administrador';
            const esMismoUsuario = parseInt(usuarioActual.id) === parseInt(id);

            if (!esAdmin && !esMismoUsuario) {
                return res.status(403).json({ error: 'No tienes permiso para editar este usuario' });
            }

            if (!esAdmin && (req.body.rol !== undefined || req.body.activo !== undefined || req.body.ip_asignada !== undefined)) {
                return res.status(403).json({ error: 'No puedes cambiar tu rol, estado o IP asignada' });
            }

            if (esAdmin && esMismoUsuario && req.body.rol && req.body.rol !== 'administrador') {
                return res.status(400).json({ error: 'No puedes quitarte el rol de administrador' });
            }

            await client.query('BEGIN');

            const usuarioActualBD = await client.query('SELECT * FROM usuarios WHERE id = $1', [id]);
            if (usuarioActualBD.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const datosAnteriores = { ...usuarioActualBD.rows[0] };
            delete datosAnteriores.password;

            const { nombre, email, rol, activo, ip_asignada } = req.body;

            // Validación: si el rol final es operador, IP es obligatoria
            const rolFinal = rol || usuarioActualBD.rows[0].rol;
            if (rolFinal === 'operador') {
                const ipFinal = ip_asignada !== undefined ? ip_asignada : usuarioActualBD.rows[0].ip_asignada;
                if (!ipFinal || ipFinal === '') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ 
                        exito: false, 
                        error: 'Los operadores deben tener una IP asignada' 
                    });
                }
            }

            if (email && email !== usuarioActualBD.rows[0].email) {
                const existe = await client.query('SELECT id FROM usuarios WHERE email = $1 AND id != $2', [email, id]);
                if (existe.rows.length > 0) {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'El email ya esta en uso por otro usuario' });
                }
            }

            const updates = [];
            const params = [];
            let paramCount = 0;

            if (nombre !== undefined) { paramCount++; updates.push(`nombre = $${paramCount}`); params.push(nombre); }
            if (email !== undefined) { paramCount++; updates.push(`email = $${paramCount}`); params.push(email); }
            if (rol !== undefined && esAdmin) { paramCount++; updates.push(`rol = $${paramCount}`); params.push(rol); }
            if (activo !== undefined && esAdmin) { paramCount++; updates.push(`activo = $${paramCount}`); params.push(activo); }
            if (ip_asignada !== undefined && esAdmin) { 
                paramCount++; 
                updates.push(`ip_asignada = $${paramCount}`); 
                params.push(ip_asignada || null); 
            }

            paramCount++;
            updates.push(`updated_at = NOW()`);
            params.push(id);

            const query = `UPDATE usuarios SET ${updates.join(', ')} WHERE id = $${paramCount} 
                          RETURNING id, nombre, email, rol, activo, ip_asignada,
                                    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as fecha_creacion,
                                    TO_CHAR(updated_at, 'DD/MM/YYYY HH24:MI') as fecha_actualizacion`;

            const result = await client.query(query, params);

            await logAuditoria(client, id, usuarioActual.id, 'ACTUALIZAR', datosAnteriores, result.rows[0], null);

            await client.query('COMMIT');

            res.json({
                exito: true,
                mensaje: 'Usuario actualizado correctamente',
                usuario: result.rows[0]
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error actualizando usuario:', err);
            res.status(500).json({ error: 'Error al actualizar usuario', detalle: err.message });
        } finally {
            client.release();
        }
    }
);

// ============================================
// 5. ELIMINAR USUARIO (Admin - soft delete)
// ============================================
router.delete('/:id', verificarToken, soloAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        if (parseInt(req.usuario.id) === parseInt(id)) {
            return res.status(400).json({ error: 'No puedes eliminar tu propio usuario' });
        }

        await client.query('BEGIN');

        const usuarioActual = await client.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (usuarioActual.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        const datosAnteriores = { ...usuarioActual.rows[0] };
        delete datosAnteriores.password;

        const result = await client.query(
            `UPDATE usuarios SET activo = false, updated_at = NOW() 
             WHERE id = $1 
             RETURNING id, nombre, email, rol, activo, ip_asignada`,
            [id]
        );

        await logAuditoria(client, id, req.usuario.id, 'ELIMINAR', datosAnteriores, result.rows[0], null);

        await client.query('UPDATE sesiones SET activa = false WHERE usuario_id = $1', [id]);

        await client.query('COMMIT');

        res.json({
            exito: true,
            mensaje: 'Usuario desactivado correctamente',
            usuario: result.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error eliminando usuario:', err);
        res.status(500).json({ error: 'Error al eliminar usuario', detalle: err.message });
    } finally {
        client.release();
    }
});

// ============================================
// 6. REACTIVAR USUARIO (Admin)
// ============================================
router.patch('/:id/reactivar', verificarToken, soloAdmin, async (req, res) => {
    const client = await pool.connect();

    try {
        const { id } = req.params;

        await client.query('BEGIN');

        const usuarioActual = await client.query('SELECT * FROM usuarios WHERE id = $1', [id]);
        if (usuarioActual.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        // Validar que operadores reactivados tengan IP
        if (usuarioActual.rows[0].rol === 'operador' && (!usuarioActual.rows[0].ip_asignada || usuarioActual.rows[0].ip_asignada === '')) {
            await client.query('ROLLBACK');
            return res.status(400).json({ 
                error: 'No se puede reactivar: el operador no tiene IP asignada. Edite primero el usuario para asignarle una IP.' 
            });
        }

        const datosAnteriores = { ...usuarioActual.rows[0] };
        delete datosAnteriores.password;

        const result = await client.query(
            `UPDATE usuarios SET activo = true, updated_at = NOW() 
             WHERE id = $1 
             RETURNING id, nombre, email, rol, activo, ip_asignada,
                       TO_CHAR(updated_at, 'DD/MM/YYYY HH24:MI') as fecha_actualizacion`,
            [id]
        );

        await logAuditoria(client, id, req.usuario.id, 'REACTIVAR', datosAnteriores, result.rows[0], null);

        await client.query('COMMIT');

        res.json({
            exito: true,
            mensaje: 'Usuario reactivado correctamente',
            usuario: result.rows[0]
        });

    } catch (err) {
        await client.query('ROLLBACK');
        res.status(500).json({ error: 'Error al reactivar usuario', detalle: err.message });
    } finally {
        client.release();
    }
});

// ============================================
// 7. CAMBIAR PASSWORD
// ============================================
router.put('/:id/password',
    verificarToken,
    [
        body('passwordActual').notEmpty().withMessage('La contrasena actual es obligatoria'),
        body('passwordNuevo').isLength({ min: 6 }).withMessage('La nueva contrasena debe tener minimo 6 caracteres')
    ],
    async (req, res) => {
        const client = await pool.connect();

        try {
            const errors = validationResult(req);
            if (!errors.isEmpty()) {
                return res.status(400).json({ exito: false, errores: errors.array() });
            }

            const { id } = req.params;
            const { passwordActual, passwordNuevo } = req.body;

            const esAdmin = req.usuario.rol === 'administrador';
            const esMismoUsuario = parseInt(req.usuario.id) === parseInt(id);

            if (!esAdmin && !esMismoUsuario) {
                return res.status(403).json({ error: 'Solo puedes cambiar tu propia contrasena' });
            }

            await client.query('BEGIN');

            const result = await client.query('SELECT id, password, nombre, email FROM usuarios WHERE id = $1', [id]);
            if (result.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }

            const usuario = result.rows[0];

            if (!esAdmin) {
                const validPassword = await bcrypt.compare(passwordActual, usuario.password);
                if (!validPassword) {
                    await client.query('ROLLBACK');
                    return res.status(401).json({ error: 'Contrasena actual incorrecta' });
                }
            }

            const hashedPassword = await bcrypt.hash(passwordNuevo, 12);

            await client.query(
                'UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2',
                [hashedPassword, id]
            );

            await logAuditoria(client, id, req.usuario.id, 'CAMBIO_PASSWORD', 
                { email: usuario.email }, 
                { email: usuario.email, mensaje: 'Password actualizada' },
                null
            );

            if (esMismoUsuario) {
                await client.query(
                    'UPDATE sesiones SET activa = false WHERE usuario_id = $1 AND token != $2',
                    [id, req.headers.authorization?.replace('Bearer ', '') || '']
                );
            }

            await client.query('COMMIT');

            res.json({
                exito: true,
                mensaje: 'Contrasena actualizada correctamente'
            });

        } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error cambiando password:', err);
            res.status(500).json({ error: 'Error al cambiar contrasena', detalle: err.message });
        } finally {
            client.release();
        }
    }
);

// ============================================
// 8. RECUPERAR PASSWORD
// ============================================
router.post('/recuperar-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email es obligatorio' });
        }

        const result = await pool.query('SELECT id, nombre, email FROM usuarios WHERE email = $1 AND activo = true', [email]);

        if (result.rows.length === 0) {
            return res.json({
                exito: true,
                mensaje: 'Si el email existe, recibiras instrucciones para recuperar tu contrasena'
            });
        }

        const usuario = result.rows[0];

        const crypto = require('crypto');
        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 1);

        await pool.query(
            'INSERT INTO reset_tokens (usuario_id, token, expires_at) VALUES ($1, $2, $3)',
            [usuario.id, token, expiresAt]
        );

        res.json({
            exito: true,
            mensaje: 'Si el email existe, recibiras instrucciones para recuperar tu contrasena',
            token_desarrollo: token,
            usuario: usuario.nombre
        });

    } catch (err) {
        console.error('Error en recuperacion:', err);
        res.status(500).json({ error: 'Error al procesar solicitud', detalle: err.message });
    }
});

// ============================================
// 9. RESTABLECER PASSWORD
// ============================================
router.post('/restablecer-password', async (req, res) => {
    const client = await pool.connect();

    try {
        const { token, passwordNuevo } = req.body;

        if (!token || !passwordNuevo) {
            return res.status(400).json({ error: 'Token y nueva contrasena son obligatorios' });
        }

        if (passwordNuevo.length < 6) {
            return res.status(400).json({ error: 'La contrasena debe tener minimo 6 caracteres' });
        }

        await client.query('BEGIN');

        const tokenResult = await client.query(
            `SELECT rt.*, u.email, u.nombre, u.rol 
             FROM reset_tokens rt
             JOIN usuarios u ON rt.usuario_id = u.id
             WHERE rt.token = $1 AND rt.used = false AND rt.expires_at > NOW()`,
            [token]
        );

        if (tokenResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(400).json({ error: 'Token invalido o expirado' });
        }

        const resetToken = tokenResult.rows[0];

        const hashedPassword = await bcrypt.hash(passwordNuevo, 12);

        await client.query(
            'UPDATE usuarios SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, resetToken.usuario_id]
        );

        await client.query('UPDATE reset_tokens SET used = true WHERE id = $1', [resetToken.id]);

        await logAuditoria(client, resetToken.usuario_id, null, 'RESTABLECER_PASSWORD',
            { email: resetToken.email },
            { email: resetToken.email, mensaje: 'Password restablecida via token' },
            null
        );

        await client.query('UPDATE sesiones SET activa = false WHERE usuario_id = $1', [resetToken.usuario_id]);

        await client.query('COMMIT');

        res.json({
            exito: true,
            mensaje: 'Contrasena restablecida correctamente. Inicia sesion con tu nueva contrasena.'
        });

    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error restableciendo password:', err);
        res.status(500).json({ error: 'Error al restablecer contrasena', detalle: err.message });
    } finally {
        client.release();
    }
});

// ============================================
// 10. OBTENER PERFIL
// ============================================
router.get('/perfil/me', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            `SELECT id, nombre, email, rol, activo, ip_asignada,
                    TO_CHAR(created_at, 'DD/MM/YYYY HH24:MI') as fecha_creacion,
                    TO_CHAR(updated_at, 'DD/MM/YYYY HH24:MI') as fecha_actualizacion
             FROM usuarios WHERE id = $1`,
            [req.usuario.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Usuario no encontrado' });
        }

        res.json({ exito: true, perfil: result.rows[0] });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener perfil', detalle: err.message });
    }
});

// ============================================
// 11. AUDITORIA
// ============================================
router.get('/auditoria/:usuarioId', verificarToken, soloAdmin, async (req, res) => {
    try {
        const { usuarioId } = req.params;
        const { limite = 50, pagina = 1 } = req.query;

        const offset = (parseInt(pagina) - 1) * parseInt(limite);

        const result = await pool.query(
            `SELECT a.*, 
                    u1.nombre as usuario_nombre,
                    u2.nombre as usuario_accion_nombre
             FROM auditoria_usuarios a
             LEFT JOIN usuarios u1 ON a.usuario_id = u1.id
             LEFT JOIN usuarios u2 ON a.usuario_accion_id = u2.id
             WHERE a.usuario_id = $1
             ORDER BY a.created_at DESC
             LIMIT $2 OFFSET $3`,
            [usuarioId, limite, offset]
        );

        const countResult = await pool.query(
            'SELECT COUNT(*) as total FROM auditoria_usuarios WHERE usuario_id = $1',
            [usuarioId]
        );

        res.json({
            exito: true,
            total: parseInt(countResult.rows[0].total),
            pagina: parseInt(pagina),
            limite: parseInt(limite),
            auditoria: result.rows
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener auditoria', detalle: err.message });
    }
});

// ============================================
// 12. ESTADISTICAS
// ============================================
router.get('/estadisticas/resumen', verificarToken, soloAdmin, async (req, res) => {
    try {
        const total = await pool.query('SELECT COUNT(*) as total FROM usuarios');
        const activos = await pool.query('SELECT COUNT(*) as activos FROM usuarios WHERE activo = true');
        const inactivos = await pool.query('SELECT COUNT(*) as inactivos FROM usuarios WHERE activo = false');
        const admins = await pool.query('SELECT COUNT(*) as admins FROM usuarios WHERE rol = $1', ['administrador']);
        const operadores = await pool.query('SELECT COUNT(*) as operadores FROM usuarios WHERE rol = $1', ['operador']);

        const recientes = await pool.query(
            `SELECT COUNT(*) as recientes FROM usuarios 
             WHERE created_at >= NOW() - INTERVAL '7 days'`
        );

        const conIp = await pool.query(`SELECT COUNT(*) as con_ip FROM usuarios WHERE ip_asignada IS NOT NULL AND ip_asignada != ''`);
        const sinIp = await pool.query(`SELECT COUNT(*) as sin_ip FROM usuarios WHERE (ip_asignada IS NULL OR ip_asignada = '') AND rol = $1`, ['operador']);

        res.json({
            exito: true,
            estadisticas: {
                total: parseInt(total.rows[0].total),
                activos: parseInt(activos.rows[0].activos),
                inactivos: parseInt(inactivos.rows[0].inactivos),
                administradores: parseInt(admins.rows[0].admins),
                operadores: parseInt(operadores.rows[0].operadores),
                creados_ultima_semana: parseInt(recientes.rows[0].recientes),
                con_ip_restringida: parseInt(conIp.rows[0].con_ip),
                operadores_sin_ip: parseInt(sinIp.rows[0].sin_ip) // Alerta: operadores sin IP
            }
        });
    } catch (err) {
        res.status(500).json({ error: 'Error al obtener estadisticas', detalle: err.message });
    }
});

module.exports = router;
