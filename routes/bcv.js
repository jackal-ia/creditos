// ============================================================
// RUTAS BCV — API directa (sin base de datos)
// ============================================================
// Flujo: 1) API externa real → 2) Fallback realista
// Formato respuesta: { exito: true, tasa: data }
// donde 'data' es la respuesta cruda de rates.dolarvzla.com
// ============================================================

const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

const BCV_URL = 'https://rates.dolarvzla.com';

// Fallback realista para julio 2026 (AJUSTA si es necesario)
const TASA_FALLBACK_USD = 76.85;
const TASA_FALLBACK_EUR = 82.40;

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

router.get('/actual', verificarToken, async (req, res) => {
    try {
        const response = await fetchWithTimeout(`${BCV_URL}/bcv/current.json`);
        const data = await response.json();
        res.json({ exito: true, tasa: data });
    } catch (err) {
        console.error('[BCV] Error API /actual:', err.message);
        res.json({
            exito: true,
            tasa: {
                current: {
                    usd: TASA_FALLBACK_USD,
                    eur: TASA_FALLBACK_EUR,
                    date: new Date().toISOString().split('T')[0]
                }
            },
            fallback: true,
            nota: 'API externa no disponible. Usando tasa de respaldo.'
        });
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
        const fecha = req.params.fecha;
        const partes = fecha.split('-');
        const year = partes[0];
        const month = parseInt(partes[1]);
        const day = parseInt(partes[2]);

        // 1) Intentar tasa histórica exacta
        try {
            const response = await fetchWithTimeout(
                `${BCV_URL}/bcv/${year}/${month}/${day}.json`
            );
            if (response.ok) {
                const data = await response.json();
                return res.json({ exito: true, tasa: data });
            }
        } catch (e) {
            console.warn(`[BCV] Histórica ${fecha} no disponible:`, e.message);
        }

        // 2) Fallback: tasa actual
        console.warn(`[BCV] Tasa histórica ${fecha} no encontrada, usando tasa actual como fallback`);
        const fallbackResponse = await fetchWithTimeout(`${BCV_URL}/bcv/current.json`);
        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return res.json({
                exito: true,
                tasa: {
                    current: {
                        usd: fallbackData.current.usd,
                        eur: fallbackData.current.eur,
                        date: fecha
                    }
                },
                fallback: true,
                nota: 'Tasa histórica no disponible. Usando tasa actual como referencia.'
            });
        }

        // 3) Último fallback: tasa hardcodeada realista
        res.json({
            exito: true,
            tasa: {
                current: {
                    usd: TASA_FALLBACK_USD,
                    eur: TASA_FALLBACK_EUR,
                    date: fecha
                }
            },
            fallback: true,
            nota: 'API externa no disponible. Usando tasa de respaldo.'
        });
    } catch (err) {
        console.error('[BCV] Error fatal /fecha/:fecha:', err.message);
        res.json({
            exito: true,
            tasa: {
                current: {
                    usd: TASA_FALLBACK_USD,
                    eur: TASA_FALLBACK_EUR,
                    date: req.params.fecha
                }
            },
            fallback: true,
            nota: 'Error de red. Usando tasa de respaldo.'
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
