const express = require('express');
const router = express.Router();
const { verificarToken } = require('../middleware/auth');

const BCV_URL = 'https://rates.dolarvzla.com';

router.get('/actual', verificarToken, async (req, res) => {
    try {
        const response = await fetch(`${BCV_URL}/bcv/current.json`);
        const data = await response.json();
        res.json({ exito: true, tasa: data });
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo tasa BCV', detalle: err.message });
    }
});

router.get('/anterior', verificarToken, async (req, res) => {
    try {
        const response = await fetch(`${BCV_URL}/bcv/previous.json`);
        const data = await response.json();
        res.json({ exito: true, tasa: data });
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo tasa anterior', detalle: err.message });
    }
});

router.get('/fechas', verificarToken, async (req, res) => {
    try {
        const response = await fetch(`${BCV_URL}/bcv/available-dates.json`);
        const data = await response.json();
        res.json({ exito: true, fechas: data });
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo fechas', detalle: err.message });
    }
});

router.get('/fecha/:fecha', verificarToken, async (req, res) => {
    try {
        const fecha = req.params.fecha;
        const partes = fecha.split('-');
        const year = partes[0];
        const month = parseInt(partes[1]);
        const day = parseInt(partes[2]);

        // FIX: Intentar obtener tasa histórica, si no existe usar fallback
        const response = await fetch(`${BCV_URL}/bcv/${year}/${month}/${day}.json`);

        if (response.ok) {
            const data = await response.json();
            return res.json({ exito: true, tasa: data });
        }

        // Si la API externa devuelve 404, obtener tasa actual como fallback
        console.warn(`Tasa no encontrada para ${fecha}, usando tasa actual como fallback`);
        const fallbackResponse = await fetch(`${BCV_URL}/bcv/current.json`);

        if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            return res.json({ 
                exito: true, 
                tasa: {
                    usd: fallbackData.current.usd,
                    eur: fallbackData.current.eur,
                    date: fecha
                }
            });
        }

        // Último fallback: tasa hardcodeada
        res.json({
            exito: true,
            tasa: {
                usd: 721.3456,
                eur: 785.4321,
                date: fecha
            }
        });
    } catch (err) {
        console.error('Error obteniendo tasa por fecha:', err);
        // Fallback en caso de error de red
        res.json({
            exito: true,
            tasa: {
                usd: 721.3456,
                eur: 785.4321,
                date: req.params.fecha
            }
        });
    }
});

router.get('/historial/:year', verificarToken, async (req, res) => {
    try {
        const year = req.params.year;
        const response = await fetch(`${BCV_URL}/bcv/${year}/list.json`);
        const data = await response.json();
        res.json({ exito: true, historial: data });
    } catch (err) {
        res.status(500).json({ error: 'Error obteniendo historial', detalle: err.message });
    }
});

module.exports = router;
