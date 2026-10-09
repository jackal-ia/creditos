// ============================================================
// RESPALDO Y RESTAURACIÓN DE BASE DE DATOS (solo administrador)
//   GET  /api/respaldo/exportar  → descarga la BD completa (.sql)
//   POST /api/respaldo/importar  → restaura desde .sql o .dump
// ⚠️ La importación REEMPLAZA toda la base de datos actual.
//    Antes de importar se guarda un respaldo automático en:
//    respaldos_automaticos/ (junto a server.js)
//
// Compatibilidad:
//   - Linux (producción): ejecuta psql/pg_dump/pg_restore como el
//     usuario de sistema "postgres" vía sudo (sin clave).
//   - Windows (local): los ejecuta directamente; el acceso a la BD
//     es por TCP con PGPASSWORD (requiere psql en el PATH; si usas
//     pgAdmin, agrega la carpeta bin de PostgreSQL al PATH).
// ============================================================
const express = require('express');
const router = express.Router();
const { execFile, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const { verificarToken } = require('../middleware/auth');

const ES_WINDOWS = process.platform === 'win32';

// Ruta EXPLICITA a la carpeta bin de PostgreSQL (opcional pero recomendada
// en Windows para no depender del PATH). En tu .env local agrega:
//   PGBIN=C:\Program Files\PostgreSQL\18\bin
// En Linux (VPS) no hace falta: psql/pg_dump/pg_restore están en /usr/bin.
const PGBIN = process.env.PGBIN || '';

// ── Credenciales de la BD ──
// Fuente principal: config/database.js (la MISMA configuración que ya
// usa la app, así no hay que adivinar nombres de variables del .env).
// Respaldo: variables de entorno DB_HOST/DB_PORT/DB_USER/DB_PASSWORD/DB_NAME.
const DB = {
    host:     process.env.DB_HOST     || 'localhost',
    port:     process.env.DB_PORT     || 5432,
    user:     process.env.DB_USER     || 'creditos_user',
    password: process.env.DB_PASSWORD || '',
    name:     process.env.DB_NAME     || process.env.DB_DATABASE || 'creditos'
};
try {
    const pool = require('../config/database');
    if (pool && pool.options) {
        DB.host     = pool.options.host     || DB.host;
        DB.port     = pool.options.port     || DB.port;
        DB.user     = pool.options.user     || DB.user;
        DB.password = pool.options.password || DB.password;
        DB.name     = pool.options.database || DB.name;
    }
} catch (e) {
    console.warn('[RESPALDO] No se pudo leer config/database.js; se usan variables de entorno.');
}

const DIR_RESPALDOS_AUTO = path.join(__dirname, '..', 'respaldos_automaticos');

// ---------- Solo administradores ----------
function esAdmin(req, res, next) {
    const rol = req.usuario && (req.usuario.rol || req.usuario.role);
    if (rol !== 'administrador') {
        return res.status(403).json({ error: 'Solo el administrador puede gestionar respaldos' });
    }
    next();
}

function pgEnv() {
    return Object.assign({}, process.env, { PGPASSWORD: DB.password });
}

// Construye la línea de comando según el sistema operativo.
// Si PGBIN está definida, usa la ruta completa al ejecutable (sin depender del PATH).
function cmdFull(cmd) {
    if (!PGBIN) return cmd;
    return path.join(PGBIN, cmd + (ES_WINDOWS ? '.exe' : ''));
}

function wrapPg(cmd, args) {
    if (ES_WINDOWS) return { bin: cmdFull(cmd), args: args };
    return { bin: 'sudo', args: ['-u', 'postgres', cmdFull(cmd)].concat(args) };
}

// Argumentos de conexión:
//  - Linux: NINGUNO de host/puerto/usuario → socket Unix local con
//    autenticación PEER como el usuario de sistema "postgres" (sin
//    contraseña). Es EXACTAMENTE lo que se hizo manualmente en este
//    servidor y funcionó. TCP (-h localhost) exigiría scram-sha-256 y
//    psql quedaría esperando la clave en silencio (por eso se colgaba).
//  - Windows: TCP a localhost con PGPASSWORD (o PGBIN en el .env).
function connArgs() {
    if (ES_WINDOWS) return ['-h', DB.host, '-p', String(DB.port), '-U', DB.user];
    return [];
}

// Ejecuta un comando PostgreSQL y resuelve con {stdout, stderr}
function runPg(cmd, args) {
    return new Promise((resolve, reject) => {
        const w = wrapPg(cmd, args);
        execFile(w.bin, w.args, { env: pgEnv(), maxBuffer: 64 * 1024 * 1024, timeout: 9 * 60 * 1000 }, (err, stdout, stderr) => {
            if (err) { err.stdout = stdout; err.stderr = stderr; return reject(err); }
            resolve({ stdout, stderr });
        });
    });
}

// ============================================================
// GET /api/respaldo/exportar  → descarga respaldo_creditos_YYYY-MM-DD.sql
// SQL plano con DROP IF EXISTS incluido (re-restaurable con psql -f).
// ============================================================
router.get('/exportar', verificarToken, esAdmin, (req, res) => {
    const fecha = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const filename = 'respaldo_creditos_' + fecha + '.sql';

    res.setHeader('Content-Type', 'application/sql; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="' + filename + '"');

    const args = ['--no-owner', '--clean', '--if-exists'].concat(connArgs(), [DB.name]);
    const w = wrapPg('pg_dump', args);
    const dump = spawn(w.bin, w.args, { env: pgEnv() });

    let errBuf = '';
    dump.stderr.on('data', (d) => { errBuf += d.toString(); });
    dump.stdout.pipe(res);
    dump.on('error', (e) => {
        console.error('[RESPALDO] pg_dump error:', e.message);
        if (!res.headersSent) {
            res.status(500).json({ error: 'pg_dump no disponible o no está en el PATH: ' + e.message });
        } else { res.end(); }
    });
    dump.on('exit', (code) => {
        if (code !== 0) console.error('[RESPALDO] pg_dump salió con código', code, errBuf);
        res.end();
    });
});

// ============================================================
// POST /api/respaldo/importar
// Body: .sql (texto) o .dump (custom, empieza con PGDMP)
// Pasos: 1) respaldo automático  2) DROP SCHEMA  3) restaurar
//        4) re-aplicar permisos
// ============================================================
router.post('/importar', verificarToken, esAdmin, express.raw({ type: () => true, limit: '200mb' }), async (req, res) => {
    const buf = req.body;
    if (!buf || !Buffer.isBuffer(buf) || buf.length === 0) {
        return res.status(400).json({ error: 'No se recibió ningún archivo' });
    }

    const esDump = buf.slice(0, 5).toString('latin1') === 'PGDMP';
    if (!esDump) {
        // FIX v9.1.1: pg_dump plain empieza con comentarios ("-- PostgreSQL
        // database dump") antes de cualquier sentencia; se escanean más
        // caracteres y se acepta también la firma "PostgreSQL".
        const head = buf.slice(0, 4000).toString('utf8');
        if (!/CREATE|INSERT|DROP|ALTER|PostgreSQL/i.test(head)) {
            return res.status(400).json({ error: 'El archivo no parece un respaldo de PostgreSQL (.sql o .dump)' });
        }
    }

    const tmp = path.join(require('os').tmpdir(), 'respaldo_import_' + Date.now() + (esDump ? '.dump' : '.sql'));
    fs.writeFileSync(tmp, buf);

    const baseArgs = connArgs().concat(['-d', DB.name]);
    const resultado = { auto: null, advertencias: [] };

    try {
        // 1) Respaldo automático de seguridad antes de reemplazar nada
        try {
            fs.mkdirSync(DIR_RESPALDOS_AUTO, { recursive: true });
            const autoFile = path.join(DIR_RESPALDOS_AUTO, 'auto_antes_import_' + new Date().toISOString().replace(/[:.]/g, '-') + '.dump');
            await runPg('pg_dump', ['-Fc', '-f', autoFile].concat(connArgs(), [DB.name]));
            resultado.auto = autoFile;
        } catch (e) {
            resultado.advertencias.push('No se pudo crear el respaldo automático previo: ' + (e.stderr || e.message));
        }

        // 2) Vaciar el esquema. NOTA: NO se usa pg_terminate_backend aquí —
        //    matar las conexiones del pool de la app hace que node-postgres
        //    emita un 'error' sin manejar y CRASHEE todo Node. El lock_timeout
        //    de 15s es suficiente: espera a que terminen transacciones en
        //    curso y nunca se cuelga (las conexiones idle no bloquean).
        await runPg('psql', baseArgs.concat(['-c', "SET lock_timeout = '15s'; DROP SCHEMA public CASCADE; CREATE SCHEMA public;"]));

        // 3) Restaurar según formato
        if (esDump) {
            await runPg('pg_restore', ['--no-owner'].concat(baseArgs, [tmp]));
        } else {
            // psql continúa ante errores puntuales (dumps con objetos duplicados)
            await runPg('psql', baseArgs.concat(['-v', 'ON_ERROR_STOP=0', '-f', tmp]));
        }

        // 4) Re-aplicar permisos al usuario de la app
        try {
            await runPg('psql', baseArgs.concat(['-c',
                'GRANT ALL ON SCHEMA public TO ' + DB.user + ';' +
                'GRANT ALL ON ALL TABLES IN SCHEMA public TO ' + DB.user + ';' +
                'GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO ' + DB.user + ';' +
                'GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO ' + DB.user + ';'
            ]));
        } catch (e) {
            resultado.advertencias.push('No se pudieron re-aplicar permisos (Linux: ignorable, el dueño es postgres): ' + (e.stderr || e.message));
        }

        return res.json({
            exito: true,
            mensaje: 'Base de datos restaurada correctamente desde ' + (esDump ? 'dump' : 'SQL') + '. Recarga el navegador (F5).',
            respaldoAutomatico: resultado.auto,
            advertencias: resultado.advertencias
        });
    } catch (e) {
        console.error('[RESPALDO] Error al importar:', e.stderr || e.message);
        return res.status(500).json({
            error: 'Falló la restauración. La base de datos puede quedar parcialmente cargada; vuelve a intentarlo con el mismo archivo.',
            detalle: String(e.stderr || e.message).slice(0, 2000),
            respaldoAutomatico: resultado.auto
        });
    } finally {
        try { fs.unlinkSync(tmp); } catch (_) { /* ya borrado */ }
    }
});

module.exports = router;
