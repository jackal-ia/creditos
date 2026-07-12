const jwt = require('jsonwebtoken');
const pool = require('../config/database');

const verificarToken = async (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }
    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        const result = await pool.query(
            'SELECT id, nombre, email, rol, activo FROM usuarios WHERE id = $1 AND activo = true',
            [decoded.id]
        );
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Usuario no encontrado o inactivo' });
        }
        req.usuario = decoded;
        next();
    } catch (err) {
        res.status(401).json({ error: 'Token invalido o expirado' });
    }
};

const soloAdmin = (req, res, next) => {
    if (req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Acceso restringido. Solo administradores.' });
    }
    next();
};

const registrarAuditoria = async (client, usuarioId, usuarioAccionId, accion, datosAnteriores, datosNuevos) => {
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
                null,
                null
            ]
        );
    } catch (err) {
        console.error('Error en auditoria:', err.message);
    }
};

module.exports = { verificarToken, soloAdmin, registrarAuditoria };
