const express = require('express');
const router = express.Router();
// FIX (v6.1): pool COMPARTIDO. Antes creaba su propio pool con una cadena
// de conexión hardcodeada con credenciales por defecto (postgres:postgres).
const pool = require('../config/database');
// FIX (v6.1): autenticación REAL. Antes había un middleware "señuelo"
// (solo verificaba que existiera un token, sin validarlo) y ni siquiera
// se aplicaba a las rutas: los 5 endpoints estaban abiertos sin token.
const { verificarToken } = require('../middleware/auth');

// Si es operador, la tienda se fuerza desde su usuario (BD), nunca del query
function tiendaEfectiva(req, tiendaQuery) {
    if (req.usuario && req.usuario.rol === 'operador' && req.usuario.tienda) {
        return req.usuario.tienda;
    }
    return tiendaQuery;
}

// ============================================================
// GET /api/estadisticas - KPIs principales
// ============================================================
router.get('/', verificarToken, async (req, res) => {
    try {
        const { mes, anio } = req.query;
        const tienda = tiendaEfectiva(req, req.query.tienda);

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();

        // v6.2: se pasa la tienda efectiva a la función (NULL = todas)
        const result = await pool.query(
            'SELECT * FROM f_estadisticas_periodo($1, $2, $3)',
            [mesActual, anioActual, tienda || null]
        );

        res.json({
            exito: true,
            datos: result.rows[0],
            tienda: tienda || 'todas'
        });
    } catch (error) {
        console.error('Error en estadísticas:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al obtener estadísticas'
        });
    }
});

// ============================================================
// GET /api/estadisticas/deudores - Lista de deudores
// ============================================================
router.get('/deudores', verificarToken, async (req, res) => {
    try {
        const { mes, anio, busqueda } = req.query;
        // v6.2: operador queda limitado a su tienda también aquí
        const tienda = tiendaEfectiva(req, req.query.tienda);

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();

        let query = `
            SELECT * FROM f_deudores_mes($1, $2, $3)
            WHERE 1=1
        `;
        const params = [mesActual, anioActual, tienda || null];

        if (busqueda) {
            query += ` AND (nombre_apellido ILIKE $4 OR cedula ILIKE $4)`;
            params.push(`%${busqueda}%`);
        }

        query += ` ORDER BY deuda DESC`;

        const result = await pool.query(query, params);

        res.json({
            exito: true,
            datos: result.rows
        });
    } catch (error) {
        console.error('Error en deudores:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al obtener deudores'
        });
    }
});

// ============================================================
// GET /api/estadisticas/evolucion - Evolución mensual
// ============================================================
router.get('/evolucion', verificarToken, async (req, res) => {
    try {
        const { anio } = req.query;
        const anioActual = anio || new Date().getFullYear();
        // v6.2: tienda efectiva (operador = su tienda)
        const tienda = tiendaEfectiva(req, req.query.tienda);

        const result = await pool.query(
            'SELECT * FROM f_evolucion_pagos($1, $2)',
            [anioActual, tienda || null]
        );

        res.json({
            exito: true,
            datos: result.rows
        });
    } catch (error) {
        console.error('Error en evolución:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al obtener evolución'
        });
    }
});

// ============================================================
// GET /api/estadisticas/distribucion - Distribución de pagos
// ============================================================
router.get('/distribucion', verificarToken, async (req, res) => {
    try {
        const { mes, anio } = req.query;

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();
        // v6.2: tienda efectiva (operador = su tienda)
        const tienda = tiendaEfectiva(req, req.query.tienda);

        const result = await pool.query(
            'SELECT * FROM f_distribucion_pagos($1, $2, $3)',
            [mesActual, anioActual, tienda || null]
        );

        res.json({
            exito: true,
            datos: result.rows
        });
    } catch (error) {
        console.error('Error en distribución:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al obtener distribución'
        });
    }
});

// ============================================================
// GET /api/estadisticas/exportar - Exportar a PDF/Excel
// ============================================================
router.get('/exportar', verificarToken, async (req, res) => {
    try {
        const { mes, anio, formato } = req.query;
        // v6.2: valores por defecto (antes llegaban undefined a la función)
        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();
        const tienda = tiendaEfectiva(req, req.query.tienda);

        const result = await pool.query(
            'SELECT * FROM f_estadisticas_periodo($1, $2, $3)',
            [mesActual, anioActual, tienda || null]
        );

        res.json({
            exito: true,
            mensaje: `Exportación en formato ${formato} - En desarrollo`,
            datos: result.rows[0]
        });
    } catch (error) {
        console.error('Error en exportar:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al exportar'
        });
    }
});

module.exports = router;
