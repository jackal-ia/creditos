require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// v9.2: cuando Caddy (proxy local) sea la puerta de entrada, Express debe
// tomar la IP real del header X-Forwarded-For — pero SOLO de conexiones
// locales (loopback), para que un cliente de internet no pueda falsificarla.
// Hoy, sin proxy activo, el comportamiento es idéntico al de siempre.
app.set('trust proxy', 'loopback');

// FIX (v6.1): el pool de este archivo ya no se usa (las rutas usan
// config/database.js). Se elimina para tener UNA sola configuración
// de conexión en todo el sistema.

// ============================================================
// CORS RESTRINGIDO (v6.1)
// Antes: cors() abierto a cualquier origen.
// Ahora: solo mismo origen (sin header Origin) + lista blanca
// opcional por .env (ALLOWED_ORIGINS, separada por comas).
// ============================================================
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);

app.use(cors({
    origin: (origin, callback) => {
        // Requests sin header Origin (mismo origen, curl, servidor) → permitir
        if (!origin) return callback(null, true);
        if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('Origen no permitido por CORS'));
    }
}));

app.use(express.json());
app.use(require('cookie-parser')());  // v9.6 — parsea cookies (fase 1 httpOnly)

// v9.5 — CABECERAS DE SEGURIDAD (CSP + HSTS + anti-MitM/hardening)
app.use((req, res, next) => {
    // v9.6 — CSP endurecida: se elimina 'unsafe-eval' (cierra la puerta de
    // eval()/Function constructor). Se mantiene 'unsafe-inline' en script/style
    // porque el código actual usa handlers onclick en línea (migrarlos a
    // addEventListener es parte del proyecto v10). Extras: bloqueo de
    // plugins (object), <base> hijacking y framing.
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' https://cdnjs.cloudflare.com; " +
        "connect-src 'self' http://localhost:* https://localhost:* https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "object-src 'none'; " +
        "base-uri 'self'; " +
        "frame-ancestors 'none'; " +
        "form-action 'self';"
    );
    // Fuerza HTTPS por 1 año (solo se aplica bajo HTTPS; seguro con Caddy)
    res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('X-Frame-Options', 'DENY');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
});

app.use(express.static('public'));

// Rutas existentes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bcv', require('./routes/bcv'));
app.use('/api/usuarios', require('./routes/usuarios'));

// NOTA (v6.1): se eliminó la ruta inline abierta GET /api/bcv/fecha/:fecha.
// Estaba duplicada y SIN token; la versión correcta (protegida) ya existe
// en routes/bcv.js y tiene prioridad al estar montada antes.

// NUEVA RUTA: Estadísticas
app.use('/api/estadisticas', require('./routes/estadisticas'));

// RUTA: Actividades Pendientes
app.use('/api/actividades', require('./routes/actividades'));
// v7.5: bandeja de incidencias del administrador (inicial > monto, etc.)
app.use('/api/incidencias', require('./routes/incidencias'));

// v9.1: respaldo y restauración de la base de datos (solo administrador)
app.use('/api/respaldo', require('./routes/respaldo'));

// v8.0: Fase Vendedores (solo Caracas) — clientes, inventario,
// cotizaciones y notas de entrega. Roles: administrador y vendedor.
app.use('/api/vendedores', require('./routes/vendedores').router);

// ============================================================
// NUEVA RUTA: API de Reportes Dinámicos v1.0
// IMPORTANTE: debe ir ANTES de /api/reportes (legacy) porque
// Express resuelve rutas en orden. Si va después, /api/reportes/v1
// sería capturado por el router legacy como tienda="v1".
// ============================================================
app.use('/api/reportes/v1', require('./routes/reportes-dinamicos'));

// RUTA: Reportes por tienda (genérico: /api/reportes/:tienda)
app.use('/api/reportes', require('./routes/reportes'));

// ============================================================
// RUTAS API DE TIENDAS — MÓDULO GENÉRICO (refactor v6)
// ============================================================
// Antes: 3 bloques inline duplicados (~540 líneas), uno por tienda.
// Ahora: un solo router paramétrico + aliases legacy para que las
// URLs anteriores sigan funcionando sin cambios en el frontend.
// ============================================================
const { router: tiendasRouter, createLegacyRouter } = require('./routes/tiendas');

// Endpoint genérico nuevo: /api/tiendas/:tienda (caracas|maracay|maracaibo)
app.use('/api/tiendas', tiendasRouter);

// Aliases legacy (compatibilidad total con lo que existía):
app.use('/api/tienda-caracas', createLegacyRouter('caracas'));
app.use('/api/tienda-maracay', createLegacyRouter('maracay'));
app.use('/api/tienda-maracaibo', createLegacyRouter('maracaibo'));

// ============================================================
// RUTAS DE PÁGINAS
// ============================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

// v9.0: vista móvil del vendedor (PWA "Ventas en Campo")
app.get('/movil', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'movil.html'));
});

// v9.7 — LIMPIEZA: se eliminaron las rutas /tienda-caracas y /estadisticas.
// Eran páginas sueltas de una versión anterior; nadie las enlaza (grep 2026-10-06)
// y con el token en cookie httpOnly quedaron rotas. La funcionalidad vive
// completa dentro de /panel (secciones de tienda y estadísticas).
// Los archivos .html/.js quedan en disco sin ruta que los sirva (inaccesibles).

// ============================================================
// MANEJO DE ERRORES
// ============================================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Servidor corriendo en:');
    console.log('   → Local:   http://localhost:' + PORT);
    console.log('   → Red:     http://' + require('os').networkInterfaces().eth0?.[0]?.address || require('os').networkInterfaces()['Wi-Fi']?.[0]?.address || 'IP_NO_DISPONIBLE' + ':' + PORT);
    console.log('   → Todas:   http://0.0.0.0:' + PORT);
    console.log('📁 API Tiendas (genérica): http://localhost:' + PORT + '/api/tiendas/caracas');
    console.log('📁 Aliases legacy activos: /api/tienda-caracas, /api/tienda-maracay, /api/tienda-maracaibo');
    console.log('📊 API Reportes Dinámicos v1.0: http://localhost:' + PORT + '/api/reportes/v1/generar');
});
