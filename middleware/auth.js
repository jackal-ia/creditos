const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// ============================================================
// Middleware de autenticación (refactor seguridad v6.1)
// - Verifica firma y expiración del JWT
// - Verifica en BD que el usuario exista y siga ACTIVO
// - Verifica token_version: si el usuario cerró sesión, cambió
//   su contraseña o fue desactivado, los tokens viejos mueren
//   (fix "token perdido/robado": ahora son revocables)
// - Expone req.usuario con tienda FRESCA desde la BD (no la del
//   JWT, que puede estar desactualizada)
// ============================================================
const verificarToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Consulta con token_version; si la columna aún no existe
        // (migración pendiente), se hace fallback sin romper nada.
        let result;
        try {
            result = await pool.query(
                'SELECT id, nombre, email, rol, activo, tienda, token_version FROM usuarios WHERE id = $1',
                [decoded.id]
            );
        } catch (e) {
            result = await pool.query(
                'SELECT id, nombre, email, rol, activo, tienda FROM usuarios WHERE id = $1',
                [decoded.id]
            );
        }

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado' });
        }

        const usuarioDb = result.rows[0];

        if (!usuarioDb.activo) {
            return res.status(401).json({ error: 'Usuario inactivo. Contacte al administrador.' });
        }

        // Revocación: token_version del JWT debe coincidir con la BD
        if (usuarioDb.token_version !== undefined) {
            const tvToken = (decoded.tv === undefined) ? -1 : decoded.tv;
            if ((usuarioDb.token_version || 0) !== tvToken) {
                return res.status(401).json({ error: 'Sesion invalidada. Inicie sesion nuevamente.' });
            }
        }

        req.usuario = { ...decoded, tienda: usuarioDb.tienda, activo: usuarioDb.activo };
        next();
    } catch (err) {
        return res.status(401).json({ error: 'Token invalido o expirado' });
    }
};

const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Acceso restringido. Solo administradores.' });
    }
    next();
};

// Restricción de tienda para operadores: un operador solo puede
// acceder a SU tienda (forzado en servidor, nunca desde el cliente).
const soloSuTienda = (tiendaDelRequest) => (req, res, next) => {
    if (req.usuario.rol === 'operador' && req.usuario.tienda && tiendaDelRequest !== req.usuario.tienda) {
        return res.status(403).json({ error: 'No tiene acceso a esta tienda.' });
    }
    next();
};

const registrarAuditoria = async (client, usuarioId, usuarioAccionId, accion, datosAnteriores, datosNuevos, ipAddress, userAgent) => {
    try {
        await client.query(
            `INSERT INTO auditoria_usuarios 
             (usuario_id, usuario_accion_id, accion, datos_anteriores, datos_nuevos, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [
                usuarioId,
                usuarioAccionId,
                accion,
                datosAnteriores ? JSON.stringify(datosAnteriores) : null,
                datosNuevos ? JSON.stringify(datosNuevos) : null,
                ipAddress || null,
                userAgent || null
            ]
        );
    } catch (err) {
        console.error('Error en auditoria:', err.message);
    }
};

module.exports = { verificarToken, soloAdmin, soloSuTienda, registrarAuditoria };
