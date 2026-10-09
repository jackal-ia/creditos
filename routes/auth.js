const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
const speakeasy = require('speakeasy');  // TOTP (window=1 tolera ±30 s de deriva de hora)
const { enviarCorreo } = require('../config/mailer');
const { toUpperCaseFields } = require('../utils/uppercase'); // ← Opción A: Helper reutilizable

// ============================================================
// RATE LIMITING: Login (v6.1)
// ============================================================
const loginLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutos
    max: 10, // 10 intentos
    message: { error: 'Demasiados intentos de login. Intente en 15 minutos.' },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true // No contar logins exitosos
});

// v9.6 — convierte JWT_EXPIRES_IN ("4h"/"30m"/"1d") a milisegundos
// para sincronizar la duración de la cookie httpOnly con la del JWT.
function duracionMs(exp) {
    const m = String(exp || '8h').trim().match(/^(\d+)([smhd]?)$/i);
    if (!m) return 8 * 3600 * 1000;
    const n = parseInt(m[1], 10);
    const u = m[2].toLowerCase();
    return n * (u === 's' ? 1000 : u === 'm' ? 60000 : u === 'd' ? 86400000 : 3600000);
}

// ============================================================
// v9.5 — Emisión de sesión compartida (login normal y mfa-verify):
// sesión única por vitalidad + JWT + registro en sesiones.
// ============================================================
async function emitirSesion(res, usuario, clientIP, dispositivo) {
    const MINUTOS_VIDA = 3;
    const sesionesActivas = await pool.query(
        `SELECT token FROM sesiones
         WHERE usuario_id = $1 AND activa = true AND expires_at > NOW()
           AND COALESCE(ultima_actividad, created_at) > NOW() - ($2 || ' minutes')::interval`,
        [usuario.id, String(MINUTOS_VIDA)]
    );
    for (const s of sesionesActivas.rows) {
        try {
            const d = jwt.decode(s.token);
            if (d && d.tv === usuario.token_version) {
                return res.status(409).json({
                    error: `Ya tienes una sesión abierta en otro dispositivo (menos de ${MINUTOS_VIDA} min). Cierra sesión allí, o espera a que se libere e intenta de nuevo.`
                });
            }
        } catch (e) { /* token ilegible: no bloquea */ }
    }
    await pool.query('UPDATE sesiones SET activa = false WHERE usuario_id = $1', [usuario.id]);

    const token = jwt.sign(
        {
            id: usuario.id,
            email: usuario.email,
            nombre: usuario.nombre,
            rol: usuario.rol,
            tienda: usuario.tienda,
            tv: usuario.token_version
        },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRES_IN || '8h' }
    );
    const ins = await pool.query(
        `INSERT INTO sesiones (usuario_id, token, dispositivo, ip_address, expires_at, activa)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        // v9.8 — FIX BUG-07: la fila de sesión expira con la MISMA duración
        // que el JWT y la cookie (antes eran 8h fijas aunque JWT_EXPIRES_IN
        // dijera otra cosa, y la lógica de sesión activa se desincronizaba).
        [usuario.id, token, dispositivo || 'Navegador Web', clientIP, new Date(Date.now() + duracionMs(process.env.JWT_EXPIRES_IN)), true]
    );

    // v9.8 — ALERTA DE NUEVO DISPOSITIVO/IP: si la IP difiere de la sesión
    // anterior, se notifica al usuario por correo (fire-and-forget: nunca
    // retrasa ni rompe el login).
    (async () => {
        try {
            const ultima = await pool.query(
                `SELECT ip_address FROM sesiones
                 WHERE usuario_id = $1 AND id <> $2 AND ip_address IS NOT NULL
                 ORDER BY created_at DESC LIMIT 1`,
                [usuario.id, ins.rows[0].id]
            );
            const ipAnterior = ultima.rows.length ? ultima.rows[0].ip_address : null;
            if (ipAnterior !== clientIP) {
                const hora = new Date().toLocaleString('es-VE', { timeZone: 'America/Caracas' });
                await enviarCorreo(
                    usuario.email,
                    'Nuevo inicio de sesión — Sistema de Créditos IPSFA',
                    'Nuevo inicio de sesión detectado',
                    '<p>Hola <strong>' + usuario.nombre + '</strong>,</p>' +
                    '<p>Se acaba de iniciar sesión en tu cuenta:</p>' +
                    '<ul style="background:#f7fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;">' +
                    '<li><strong>Fecha:</strong> ' + hora + '</li>' +
                    '<li><strong>IP:</strong> ' + clientIP + '</li>' +
                    '<li><strong>Dispositivo:</strong> ' + (dispositivo || 'Navegador Web') + '</li></ul>' +
                    '<p>Si fuiste tú, ignora este correo. Si <strong>no</strong> fuiste tú, cambia tu ' +
                    'contraseña de inmediato desde Mi Perfil y avisa al administrador.</p>'
                );
            }
        } catch (e) {
            console.warn('[mailer] alerta de nuevo dispositivo falló:', e.message);
        }
    })();
    // v9.6 — FASE 1: el mismo token también viaja como cookie httpOnly.
    // El frontend actual sigue usando el JSON (Bearer en localStorage);
    // la cookie queda lista para la FASE 2 (el navegador la envía solo).
    // Secure funciona porque Caddy proxy-HTTPS + trust proxy 'loopback'.
    res.cookie('token', token, {
        httpOnly: true,   // invisible para JavaScript (anti-XSS)
        secure: true,     // solo por HTTPS
        sameSite: 'lax',  // mitiga CSRF en peticiones cruzadas
        maxAge: duracionMs(process.env.JWT_EXPIRES_IN),
        path: '/'
    });
    return res.json({
        token,
        usuario: { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, tienda: usuario.tienda }
    });
}

// ============================================================
// LOGIN
// ============================================================
router.post('/login', loginLimiter, async (req, res) => {
    try {
        const { email, password, dispositivo } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y password son obligatorios' });
        }

        const result = await pool.query('SELECT * FROM usuarios WHERE email = $1', [email.toLowerCase()]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        const usuario = result.rows[0];

        if (!usuario.activo) {
            return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
        }

        // Validar IP asignada para operadores (y admins con IP configurada).
        // v9.2.4 — FIX ANTI-SPOOFING: se usa req.ip (Express toma X-Forwarded-For
        // SOLO cuando la conexión viene del proxy local Caddy — trust proxy
        // 'loopback' —; de lo contrario usa la IP real del socket). Antes se
        // leía el header crudo y cualquiera podía falsificarlo para burlar
        // la restricción de IP.
        const clientIP = req.ip;
        // v9.2.8 — soporta VARIAS IPs separadas por coma (ISPs dinámicos/sedes)
        if (usuario.ip_asignada) {
            const permitidas = String(usuario.ip_asignada).split(',').map(s => s.trim()).filter(Boolean);
            if (!permitidas.includes(clientIP)) {
            console.warn(`IP bloqueada: ${clientIP} vs asignada: ${usuario.ip_asignada} para usuario ${usuario.email}`);
            return res.status(403).json({ 
                error: 'Acceso no permitido desde esta ubicación',
                ip_detectada: clientIP,
                ip_asignada: usuario.ip_asignada
                });
            }
        }

        const valido = await bcrypt.compare(password, usuario.password);
        if (!valido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // ← Opción A: Convertir dispositivo a MAYÚSCULAS antes de guardar en sesiones
        const upperFields = ['dispositivo'];
        const datos = toUpperCaseFields({ dispositivo: dispositivo || 'Navegador Web' }, upperFields);

        // v9.2.7 — SESIÓN ÚNICA (MODO BLOQUEO, como el sistema original):
        // si la cuenta YA tiene una sesión activa y vigente, se RECHAZA el
        // nuevo login con aviso (no se expulsa a la sesión existente).
        // Una sesión solo cuenta como "abierta" si su token_version sigue
        // vigente: las sesiones muertas/expulsadas/expiradas NO bloquean.
        // v9.5 — MFA: si el usuario tiene 2FA activado, NO se emite sesión
        // todavía. Se entrega un preauth (JWT de 5 min, propósito 'mfa') y
        // el frontend pedirá el código TOTP para completar el login.
        if (usuario.mfa_enabled && usuario.mfa_secret) {
            const preauth = jwt.sign(
                { id: usuario.id, purpose: 'mfa', tv: usuario.token_version },
                process.env.JWT_SECRET,
                { expiresIn: '5m' }
            );
            return res.json({ mfa_requerido: true, preauth });
        }

        return emitirSesion(res, usuario, clientIP, datos.dispositivo);
    } catch (err) {
        console.error('Error en login:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================================
// MFA-VERIFY — fase 2 del login (preauth + código TOTP)
// ============================================================
router.post('/mfa-verify', async (req, res) => {
    try {
        const { preauth, codigo } = req.body;
        if (!preauth || !codigo) {
            return res.status(400).json({ error: 'Datos incompletos' });
        }
        let decoded;
        try {
            decoded = jwt.verify(preauth, process.env.JWT_SECRET);
        } catch (e) {
            return res.status(401).json({ error: 'El tiempo para verificar expiró. Inicia sesión de nuevo.' });
        }
        if (decoded.purpose !== 'mfa') {
            return res.status(401).json({ error: 'Token inválido' });
        }
        const result = await pool.query('SELECT * FROM usuarios WHERE id = $1', [decoded.id]);
        if (result.rows.length === 0) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }
        const usuario = result.rows[0];
        if (!usuario.activo) {
            return res.status(403).json({ error: 'Usuario inactivo. Contacte al administrador.' });
        }
        if (decoded.tv !== usuario.token_version) {
            return res.status(401).json({ error: 'La sesión ya no es válida. Inicia sesión de nuevo.' });
        }
        if (!usuario.mfa_enabled || !usuario.mfa_secret) {
            return res.status(400).json({ error: 'El 2FA no está activado para esta cuenta' });
        }
        const codigoLimpio = String(codigo).trim().replace(/\s/g, '');
        if (!/^\d{6}$/.test(codigoLimpio)) {
            return res.status(400).json({ error: 'El código son 6 dígitos' });
        }
        const okMfa = speakeasy.totp.verify({
            token: codigoLimpio,
            secret: usuario.mfa_secret,
            encoding: 'base32',
            window: 1
        });
        if (!okMfa) {
            return res.status(401).json({ error: 'Código incorrecto. Verifica la hora de tu teléfono y reintenta.' });
        }
        return emitirSesion(res, usuario, req.ip, 'Navegador Web (2FA)');
    } catch (err) {
        console.error('Error en mfa-verify:', err);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================================
// LOGOUT
// ============================================================
router.post('/logout', async (req, res) => {
    try {
        // v9.7 — el token puede venir del header O de la cookie httpOnly
        const token = req.headers.authorization?.split(' ')[1] || (req.cookies && req.cookies.token);
        if (token) {
            // Invalidar la sesión (row)
            await pool.query('UPDATE sesiones SET activa = false WHERE token = $1', [token]);

            const decoded = jwt.decode(token);
            if (decoded?.id) {
                // v9.2.6 — Solo revocar TODAS las sesiones (token_version) cuando
                // el token que se cierra TODAVÍA era válido. Si el token ya era
                // viejo (p. ej. esta sesión murió porque la misma cuenta entró
                // desde otro equipo y el 401 disparó este logout automático),
                // subir token_version MATARÍA también la sesión nueva. Con la
                // condición, la sesión vigente sobrevive.
                const u = await pool.query('SELECT token_version FROM usuarios WHERE id = $1', [decoded.id]);
                if (u.rows.length > 0 && u.rows[0].token_version === decoded.tv) {
                    await pool.query('UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1', [decoded.id]);
                }
            }
        }
        // v9.6 — limpiar la cookie httpOnly si existe
        res.clearCookie('token', { path: '/' });
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
        console.error('Error en logout:', err);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
});

// ============================================================
// PING — heartbeat de sesión (v9.3)
// El frontend llama a este endpoint cada 60 s para declarar "sigo vivo".
// Así el login sabe si una sesión previa sigue activa o fue abandonada
// (navegador cerrado sin "Cerrar sesión").
// ============================================================
const { verificarToken, soloAdmin } = require('../middleware/auth');
router.post('/ping', verificarToken, async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            await pool.query('UPDATE sesiones SET ultima_actividad = NOW() WHERE token = $1', [token]);
        }
        res.json({ ok: true });
    } catch (e) {
        res.json({ ok: false });
    }
});

// ============================================================
// DEBUG IP (solo admin autenticado — v9.2.4: antes estaba ABIERTO)
// ============================================================
router.get('/debug/ip', verificarToken, soloAdmin, async (req, res) => {
    const clientIP = req.ip;
    res.json({ ip: clientIP });
});

module.exports = router;
