const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');

// Helper para obtener IP real del cliente
function obtenerIpCliente(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
        return forwarded.split(',')[0].trim();
    }
    const realIp = req.headers['x-real-ip'];
    if (realIp) {
        return realIp;
    }
    return req.socket.remoteAddress || req.ip || '0.0.0.0';
}

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const ipCliente = obtenerIpCliente(req);

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        const usuario = result.rows[0];

        // ========== VALIDACION DE IP - OPCION C ==========
        // Operadores DEBEN tener IP asignada y coincidir
        // Administradores pueden tener IP libre (null o vacio)

        if (usuario.rol === 'operador') {
            // Verificar que tenga IP asignada
            if (!usuario.ip_asignada || usuario.ip_asignada === '') {
                // Registrar intento fallido
                try {
                    await pool.query(
                        `INSERT INTO auditoria_usuarios 
                         (usuario_id, usuario_accion_id, accion, datos_nuevos, ip_address)
                         VALUES ($1, $1, 'INTENTO_SIN_IP_ASIGNADA', $2, $3)`,
                        [
                            usuario.id,
                            JSON.stringify({ 
                                ip_intento: ipCliente, 
                                mensaje: 'Operador sin IP asignada configurada',
                                fecha: new Date().toISOString()
                            }),
                            ipCliente
                        ]
                    );
                } catch (auditErr) {
                    console.error('Error registrando auditoria:', auditErr.message);
                }

                return res.status(403).json({ 
                    exito: false,
                    error: 'Acceso denegado: configuracion incompleta',
                    detalle: 'Su cuenta no tiene una IP asignada. Contacte al administrador para configurar su estacion de trabajo.',
                    ip_detectada: ipCliente
                });
            }

            // Verificar que la IP coincida
            if (usuario.ip_asignada !== ipCliente) {
                try {
                    await pool.query(
                        `INSERT INTO auditoria_usuarios 
                         (usuario_id, usuario_accion_id, accion, datos_nuevos, ip_address)
                         VALUES ($1, $1, 'INTENTO_IP_NO_AUTORIZADA', $2, $3)`,
                        [
                            usuario.id,
                            JSON.stringify({ 
                                ip_intento: ipCliente, 
                                ip_asignada: usuario.ip_asignada,
                                fecha: new Date().toISOString(),
                                mensaje: 'Acceso denegado: IP no autorizada'
                            }),
                            ipCliente
                        ]
                    );
                } catch (auditErr) {
                    console.error('Error registrando auditoria:', auditErr.message);
                }

                return res.status(403).json({ 
                    exito: false,
                    error: 'Acceso denegado desde esta ubicacion',
                    detalle: 'Su cuenta esta restringida a una direccion IP especifica. Contacte al administrador si necesita cambiarla.',
                    ip_detectada: ipCliente
                });
            }
        }

        // Administradores: si tienen IP, validarla; si no, permitir
        if (usuario.rol === 'administrador' && usuario.ip_asignada && usuario.ip_asignada !== '') {
            if (usuario.ip_asignada !== ipCliente) {
                try {
                    await pool.query(
                        `INSERT INTO auditoria_usuarios 
                         (usuario_id, usuario_accion_id, accion, datos_nuevos, ip_address)
                         VALUES ($1, $1, 'INTENTO_IP_NO_AUTORIZADA_ADMIN', $2, $3)`,
                        [
                            usuario.id,
                            JSON.stringify({ 
                                ip_intento: ipCliente, 
                                ip_asignada: usuario.ip_asignada,
                                fecha: new Date().toISOString(),
                                mensaje: 'Admin intento desde IP no autorizada'
                            }),
                            ipCliente
                        ]
                    );
                } catch (auditErr) {
                    console.error('Error registrando auditoria:', auditErr.message);
                }

                return res.status(403).json({ 
                    exito: false,
                    error: 'Acceso denegado desde esta ubicacion',
                    detalle: 'Su cuenta de administrador esta restringida a una direccion IP especifica.',
                    ip_detectada: ipCliente
                });
            }
        }
        // ================================================

        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ error: 'Credenciales invalidas' });
        }

        const token = jwt.sign(
            { id: usuario.id, email: usuario.email, nombre: usuario.nombre, rol: usuario.rol },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN }
        );

        res.json({
            exito: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor', detalle: err.message });
    }
});

module.exports = router;
