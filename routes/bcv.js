// ============================================================
// RUTAS BCV — API directa (sin base de datos)
// ============================================================
// Flujo: 1) API externa real → 2) Buscar hacia atrás hasta 10 días
//          → 3) Fallback a tasa actual real → 4) Error controlado
// Formato respuesta SIEMPRE plano: { exito: true, tasa: { date, usd, eur } }
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

const BCV_URL = 'https://rates.dolarvzla.com';

// Helper: fetch con timeout manual (compatible con Node.js < 18)
async function fetchWithTimeout(url, options = {}, timeout = 10000) {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);
    try {
        const response = await fetch(url, { ...options, signal: controller.signal });
        clearTimeout(id);
        return response;
    } catch (error) {
        clearTimeout(id);
        throw error;
    }
}

// Helper: obtener tasa actual real (formato plano normalizado)
async function obtenerTasaActualReal() {
    const response = await fetchWithTimeout(`${BCV_URL}/bcv/current.json`);
    if (!response.ok) throw new Error('current no disponible');
    const data = await response.json();
    // Normalizar a formato plano
    if (data.current) {
        const tasa = {
            date: data.current.date,
            usd: parseFloat(data.current.usd),
            eur: parseFloat(data.current.eur)
        };
        // Incluir tasa anterior y variación (la API externa sí las provee)
        if (data.previous && data.previous.usd !== undefined) {
            tasa.previousDate = data.previous.date;
            tasa.previousUsd = parseFloat(data.previous.usd);
            if (data.previous.eur !== undefined) {
                tasa.previousEur = parseFloat(data.previous.eur);
            }
        }
        if (data.changePercentage && data.changePercentage.usd !== undefined) {
            tasa.changePctUsd = parseFloat(data.changePercentage.usd);
            if (data.changePercentage.eur !== undefined) {
                tasa.changePctEur = parseFloat(data.changePercentage.eur);
            }
        }
        return tasa;
    }
    if (data.usd !== undefined) {
        return {
            date: data.date,
            usd: parseFloat(data.usd),
            eur: parseFloat(data.eur)
        };
    }
    throw new Error('Formato current inesperado');
}

// Helper: buscar tasa histórica exacta; si no existe, buscar hacia atrás
// hasta 10 días para encontrar la última tasa publicada por el BCV
async function buscarTasaHistorica(year, month, day) {
    let intentos = 0;
    const maxIntentos = 10; // máximo 10 días hacia atrás

    while (intentos < maxIntentos) {
        const url = `${BCV_URL}/bcv/${year}/${month}/${day}.json`;
        try {
            const response = await fetchWithTimeout(url);
            if (response.ok) {
                const data = await response.json();
                // Normalizar a formato plano
                return {
                    date: data.date || `${year}-${String(month).padStart(2,'0')}-${String(day).padStart(2,'0')}`,
                    usd: parseFloat(data.usd),
                    eur: parseFloat(data.eur),
                    _fuente: 'historico'
                };
            }
        } catch (e) {
            // 404 u otro error: seguir buscando hacia atrás
        }

        // Retroceder un día
        const d = new Date(year, month - 1, day);
        d.setDate(d.getDate() - 1);
        year = d.getFullYear();
        month = d.getMonth() + 1;
        day = d.getDate();
        intentos++;
    }

    return null;
}

router.get('/actual', verificarToken, async (req, res) => {
    try {
        const tasa = await obtenerTasaActualReal();
        res.json({ exito: true, tasa });
    } catch (err) {
        console.error('[BCV] Error API /actual:', err.message);
        res.status(500).json({ exito: false, error: 'Error obteniendo tasa actual' });
    }
});

router.get('/anterior', verificarToken, async (req, res) => {
    try {
        const response = await fetchWithTimeout(`${BCV_URL}/bcv/previous.json`);
        const data = await response.json();
        res.json({ exito: true, tasa: data });
    } catch (err) {
        console.error('[BCV] Error API /anterior:', err.message);
        res.status(500).json({ exito: false, error: 'Error obteniendo tasa anterior' });
    }
});

router.get('/fechas', verificarToken, async (req, res) => {
    try {
        const response = await fetchWithTimeout(`${BCV_URL}/bcv/available-dates.json`);
        const data = await response.json();
        res.json({ exito: true, fechas: data });
    } catch (err) {
        console.error('[BCV] Error API /fechas:', err.message);
        res.status(500).json({ exito: false, error: 'Error obteniendo fechas' });
    }
});

router.get('/fecha/:fecha', verificarToken, async (req, res) => {
    try {
        const fecha = req.params.fecha; // YYYY-MM-DD
        if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            return res.status(400).json({
                exito: false,
                error: 'Formato de fecha inválido. Use YYYY-MM-DD'
            });
        }
        const partes = fecha.split('-');
        const year = parseInt(partes[0]);
        const month = parseInt(partes[1]);
        const day = parseInt(partes[2]);

        // 1) Buscar histórica exacta o la más cercana anterior (hasta 10 días atrás)
        const historica = await buscarTasaHistorica(year, month, day);
        if (historica) {
            return res.json({
                exito: true,
                tasa: historica,
                nota: historica.date !== fecha
                    ? `Tasa del ${historica.date} (última publicada antes del ${fecha})`
                    : undefined
            });
        }

        // 2) Si no hay histórica reciente, usar tasa actual real
        console.warn(`[BCV] No se encontró histórico reciente para ${fecha}, usando tasa actual`);
        const actual = await obtenerTasaActualReal();
        res.json({
            exito: true,
            tasa: actual,
            fallback: true,
            nota: 'No hay tasa histórica disponible para esa fecha. Mostrando tasa actual.'
        });

    } catch (err) {
        console.error('[BCV] Error fatal /fecha/:fecha:', err.message);
        res.status(500).json({
            exito: false,
            error: 'Error de red consultando la tasa'
        });
    }
});

router.get('/historial/:year', verificarToken, async (req, res) => {
    try {
        const year = req.params.year;
        const response = await fetchWithTimeout(`${BCV_URL}/bcv/${year}/list.json`);
        const data = await response.json();
        res.json({ exito: true, historial: data });
    } catch (err) {
        console.error('[BCV] Error API /historial:', err.message);
        res.status(500).json({ exito: false, error: 'Error obteniendo historial' });
    }
});

module.exports = router;
