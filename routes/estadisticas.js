const express = require('express');
const router = express.Router();
const { Pool } = require('pg');

// Conexión a PostgreSQL (misma configuración que tu database.js)
const pool = new Pool({
    connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/creditos'
});

// Middleware para verificar autenticación (si tienes uno)
const verificarAuth = (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'No autorizado' });
    }
    // Aquí tu lógica de verificación de token
    next();
};

// ============================================================
// GET /api/estadisticas - KPIs principales
// ============================================================
router.get('/', async (req, res) => {
    try {
        const { mes, anio, tienda } = req.query;

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();

        const result = await pool.query(
            'SELECT * FROM f_estadisticas_periodo($1, $2)',
            [mesActual, anioActual]
        );

        res.json({
            exito: true,
            datos: result.rows[0]
        });
    } catch (error) {
        console.error('Error en estadísticas:', error);
        res.status(500).json({ 
            exito: false, 
            error: 'Error al obtener estadísticas',
            detalle: error.message 
        });
    }
});

// ============================================================
// GET /api/estadisticas/deudores - Lista de deudores
// ============================================================
router.get('/deudores', async (req, res) => {
    try {
        const { mes, anio, busqueda } = req.query;

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();

        let query = `
            SELECT * FROM f_deudores_mes($1, $2)
            WHERE 1=1
        `;
        const params = [mesActual, anioActual];

        if (busqueda) {
            query += ` AND (nombre_apellido ILIKE $3 OR cedula ILIKE $3)`;
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
            error: 'Error al obtener deudores',
            detalle: error.message 
        });
    }
});

// ============================================================
// GET /api/estadisticas/evolucion - Evolución mensual
// ============================================================
router.get('/evolucion', async (req, res) => {
    try {
        const { anio } = req.query;
        const anioActual = anio || new Date().getFullYear();

        const result = await pool.query(
            'SELECT * FROM f_evolucion_pagos($1)',
            [anioActual]
        );

        res.json({
            exito: true,
            datos: result.rows
        });
    } catch (error) {
        console.error('Error en evolución:', error);
        res.status(500).json({ 
            exito: false, 
            error: 'Error al obtener evolución',
            detalle: error.message 
        });
    }
});

// ============================================================
// GET /api/estadisticas/distribucion - Distribución de pagos
// ============================================================
router.get('/distribucion', async (req, res) => {
    try {
        const { mes, anio } = req.query;

        const mesActual = mes || new Date().getMonth() + 1;
        const anioActual = anio || new Date().getFullYear();

        const result = await pool.query(
            'SELECT * FROM f_distribucion_pagos($1, $2)',
            [mesActual, anioActual]
        );

        res.json({
            exito: true,
            datos: result.rows
        });
    } catch (error) {
        console.error('Error en distribución:', error);
        res.status(500).json({ 
            exito: false, 
            error: 'Error al obtener distribución',
            detalle: error.message 
        });
    }
});

// ============================================================
// GET /api/estadisticas/exportar - Exportar a PDF/Excel
// ============================================================
router.get('/exportar', async (req, res) => {
    try {
        const { mes, anio, formato } = req.query;

        // Aquí implementarías la lógica de exportación
        // Por ahora devuelve los datos crudos

        const result = await pool.query(
            'SELECT * FROM f_estadisticas_periodo($1, $2)',
            [mes, anio]
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
            error: 'Error al exportar',
            detalle: error.message 
        });
    }
});

module.exports = router;
