require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

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

// FIX: Content Security Policy
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy',
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' https://cdnjs.cloudflare.com; " +
        "connect-src 'self' http://localhost:* https://localhost:* https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;"
    );
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

app.get('/tienda-caracas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tienda-caracas.html'));
});

app.get('/estadisticas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'estadisticas.html'));
});

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
});
