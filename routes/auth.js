const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// Rate limiting compatible con express-rate-limit v6/v7
const rateLimitModule = require('express-rate-limit');
const rateLimit = rateLimitModule.rateLimit || rateLimitModule;

// ============================================
// HELPERS DE IP
// ============================================

/**
 * Normaliza una IP quitando prefijos IPv6 y espacios
 * Ej: "::ffff:192.168.1.100" → "192.168.1.100"
 */
function normalizarIP(ip) {
    if (!ip || typeof ip !== 'string') return '0.0.0.0';

    ip = ip.trim();
    if (ip === '' || ip === 'undefined' || ip === 'null') return '0.0.0.0';

    if (ip.startsWith('::ffff:')) {
        ip = ip.substring(7);
    }

    if (ip.startsWith('[') && ip.endsWith(']')) {
        ip = ip.slice(1, -1);
    }

    return ip;
}

/**
 * Obtiene la IP real del cliente.
 * FIX SEGURIDAD (v6.1): la fuente principal es la CONEXIÓN TCP real
 * (req.socket.remoteAddress). Los headers X-Forwarded-For / X-Real-Ip
 * solo se respetan si hay un proxy confiable configurado
 * (app.set('trust proxy', ...)); de lo contrario el cliente podría
 * falsear su IP enviando el header manualmente.
 */
function obtenerIpCliente(req) {
    const trustProxy = req.app.get('trust proxy');
    let ipDetectada = null;

    if (trustProxy) {
        // Solo con proxy real: revisar headers de proxy
        const forwarded = req.headers['x-forwarded-for'];
        if (forwarded && typeof forwarded === 'string' && forwarded.trim() !== '') {
            const primeraIp = forwarded.split(',')[0].trim();
            if (primeraIp && primeraIp !== 'undefined' && primeraIp !== 'null') {
                ipDetectada = primeraIp;
            }
        }
        if (!ipDetectada) {
            const realIp = req.headers['x-real-ip'];
            if (realIp && typeof realIp === 'string' && realIp.trim() !== '') {
                ipDetectada = realIp.trim();
            }
        }
    }

    // Conexión TCP real (siempre disponible, no falseable por el cliente)
    if (!ipDetectada) {
        ipDetectada = req.socket?.remoteAddress || req.connection?.remoteAddress || '0.0.0.0';
    }

    return normalizarIP(ipDetectada);
}

/**
 * Compara dos IPs considerando variaciones de formato
 */
function ipsCoinciden(ip1, ip2) {
    const n1 = normalizarIP(ip1);
    const n2 = normalizarIP(ip2);

    if (n1 === n2) return true;

    const localhosts = ['127.0.0.1', '::1', '::ffff:127.0.0.1', '0:0:0:0:0:0:0:1'];
    if (localhosts.includes(n1) && localhosts.includes(n2)) return true;

    return false;
}

/** Registra en auditoría un intento de acceso bloqueado por IP */
async function auditarBloqueoIp(usuarioId, accion, ipCliente, ipAsignada, mensaje) {
    try {
        await pool.query(
            `INSERT INTO auditoria_usuarios 
             (usuario_id, usuario_accion_id, accion, datos_nuevos, ip_address)
             VALUES ($1, $1, $2, $3, $4)`,
            [
                usuarioId,
                accion,
                JSON.stringify({
                    ip_intento: ipCliente,
                    ip_asignada: ipAsignada || null,
                    mensaje: mensaje,
                    fecha: new Date().toISOString()
                }),
                ipCliente
            ]
        );
    } catch (auditErr) {
        console.error('Error registrando auditoria:', auditErr.message);
    }
}

// ============================================
// RATE LIMIT EN LOGIN (anti fuerza bruta)
// Máx. 10 intentos fallidos cada 15 min por IP;
// los logins exitosos no consumen el contador.
// ============================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    skipSuccessfulRequests: true,
    standardHeaders: true,
    legacyHeaders: false,
    message: { exito: false, error: 'Demasiados intentos de inicio de sesion. Espere 15 minutos.' }
});

// ============================================
// LOGIN
// ============================================
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ exito: false, error: 'Email y contrasena son obligatorios' });
        }

        const ipCliente = obtenerIpCliente(req);

        const result = await pool.query(
            'SELECT * FROM usuarios WHERE email = $1 AND activo = true',
            [email]
        );

        if (result.rows.length === 0) {
            return res.status(401).json({ exito: false, error: 'Credenciales invalidas' });
        }

        const usuario = result.rows[0];

        // ========== VALIDACION DE IP ==========
        if (usuario.rol === 'operador') {
            if (!usuario.ip_asignada || usuario.ip_asignada === '') {
                await auditarBloqueoIp(usuario.id, 'INTENTO_SIN_IP_ASIGNADA', ipCliente, null,
                    'Operador sin IP asignada configurada');

                return res.status(403).json({
                    exito: false,
                    error: 'Acceso denegado: configuracion incompleta',
                    detalle: 'Su cuenta no tiene una IP asignada. Contacte al administrador para configurar su estacion de trabajo.',
                    ip_detectada: ipCliente
                });
            }

            if (!ipsCoinciden(usuario.ip_asignada, ipCliente)) {
                await auditarBloqueoIp(usuario.id, 'INTENTO_IP_NO_AUTORIZADA', ipCliente,
                    usuario.ip_asignada, 'Acceso denegado: IP no autorizada');

                return res.status(403).json({
                    exito: false,
                    error: 'Acceso denegado desde esta ubicacion',
                    detalle: `Su cuenta esta restringida a la IP: ${normalizarIP(usuario.ip_asignada)}. IP detectada: ${ipCliente}`,
                    ip_esperada: normalizarIP(usuario.ip_asignada),
                    ip_detectada: ipCliente
                });
            }
        }

        // Administradores: si tienen IP asignada, validarla
        if (usuario.rol === 'administrador' && usuario.ip_asignada && usuario.ip_asignada !== '') {
            if (!ipsCoinciden(usuario.ip_asignada, ipCliente)) {
                await auditarBloqueoIp(usuario.id, 'INTENTO_IP_NO_AUTORIZADA_ADMIN', ipCliente,
                    usuario.ip_asignada, 'Admin intento desde IP no autorizada');

                return res.status(403).json({
                    exito: false,
                    error: 'Acceso denegado desde esta ubicacion',
                    detalle: `Su cuenta de administrador esta restringida a la IP: ${normalizarIP(usuario.ip_asignada)}`,
                    ip_esperada: normalizarIP(usuario.ip_asignada),
                    ip_detectada: ipCliente
                });
            }
        }

        const validPassword = await bcrypt.compare(password, usuario.password);
        if (!validPassword) {
            return res.status(401).json({ exito: false, error: 'Credenciales invalidas' });
        }

        // Token con token_version (tv): permite revocar sesiones
        const token = jwt.sign(
            {
                id: usuario.id,
                email: usuario.email,
                nombre: usuario.nombre,
                rol: usuario.rol,
                tienda: usuario.tienda,
                tv: usuario.token_version || 0
            },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
        );

        console.log(`✅ Login exitoso (usuario ID ${usuario.id}, rol ${usuario.rol}) desde ${ipCliente}`);

        res.json({
            exito: true,
            token,
            usuario: {
                id: usuario.id,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                tienda: usuario.tienda
            }
        });
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ exito: false, error: 'Error interno del servidor' });
    }
});

// ============================================
// LOGOUT REAL: invalida el token en servidor
// (incrementa token_version → el JWT actual muere)
// ============================================
router.post('/logout', verificarToken, async (req, res) => {
    try {
        await pool.query(
            'UPDATE usuarios SET token_version = COALESCE(token_version, 0) + 1 WHERE id = $1',
            [req.usuario.id]
        );
        res.json({ exito: true, mensaje: 'Sesion cerrada en el servidor' });
    } catch (err) {
        console.error('Error en logout:', err.message);
        res.status(500).json({ exito: false, error: 'No se pudo invalidar la sesion en el servidor' });
    }
});

// ============================================
// ENDPOINT DE DIAGNOSTICO DE IP
// FIX: ahora requiere token de ADMINISTRADOR
// (antes era público y revelaba info de la red)
// ============================================
router.get('/debug/ip', verificarToken, soloAdmin, (req, res) => {
    const ipCliente = obtenerIpCliente(req);

    res.json({
        exito: true,
        diagnostico: {
            ip_detectada: ipCliente,
            ip_por_socket: req.socket?.remoteAddress || 'no disponible',
            trust_proxy_configurado: !!req.app.get('trust proxy'),
            headers: {
                'x-forwarded-for': req.headers['x-forwarded-for'] || 'no presente',
                'x-real-ip': req.headers['x-real-ip'] || 'no presente'
            },
            user_agent: req.headers['user-agent'] || 'no presente',
            recomendacion: 'Configure esta IP (conexión real del socket) en ip_asignada del usuario.'
        }
    });
});

module.exports = router;
