const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const rateLimit = require('express-rate-limit');
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

        // Validar IP asignada para operadores (y admins con IP configurada)
        const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
        if (usuario.ip_asignada && clientIP !== usuario.ip_asignada) {
            console.warn(`IP bloqueada: ${clientIP} vs asignada: ${usuario.ip_asignada} para usuario ${usuario.email}`);
            return res.status(403).json({ 
                error: 'Acceso no permitido desde esta ubicación',
                ip_detectada: clientIP,
                ip_asignada: usuario.ip_asignada
            });
        }

        const valido = await bcrypt.compare(password, usuario.password);
        if (!valido) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // ← Opción A: Convertir dispositivo a MAYÚSCULAS antes de guardar en sesiones
        const upperFields = ['dispositivo'];
        const datos = toUpperCaseFields({ dispositivo: dispositivo || 'Navegador Web' }, upperFields);

        // Generar JWT
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

        // Registrar sesión
        await pool.query(
            `INSERT INTO sesiones (usuario_id, token, dispositivo, ip_address, expires_at, activa)
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [usuario.id, token, datos.dispositivo, clientIP, new Date(Date.now() + 8 * 60 * 60 * 1000), true]
        );

        res.json({
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
        res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// ============================================================
// LOGOUT
// ============================================================
router.post('/logout', async (req, res) => {
    try {
        const token = req.headers.authorization?.split(' ')[1];
        if (token) {
            // Invalidar sesión
            await pool.query('UPDATE sesiones SET activa = false WHERE token = $1', [token]);

            // Incrementar token_version para revocar JWT
            const decoded = jwt.decode(token);
            if (decoded?.id) {
                await pool.query('UPDATE usuarios SET token_version = token_version + 1 WHERE id = $1', [decoded.id]);
            }
        }
        res.json({ message: 'Sesión cerrada exitosamente' });
    } catch (err) {
        console.error('Error en logout:', err);
        res.status(500).json({ error: 'Error al cerrar sesión' });
    }
});

// ============================================================
// DEBUG IP (Admin only)
// ============================================================
router.get('/debug/ip', async (req, res) => {
    // Nota: En producción, agregar middleware de autenticación admin
    const clientIP = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket.remoteAddress;
    res.json({ ip: clientIP, headers: req.headers });
});

module.exports = router;
