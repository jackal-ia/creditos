// ============================================================
// INCIDENCIAS — Bandeja de entrada del administrador (v7.5)
// Lee la tabla `notificaciones` (existente en BD).
// Todos los endpoints: SOLO ADMINISTRADOR.
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// GET /api/incidencias — lista las incidencias (más recientes primero)
// Query opcional: ?solo_no_leidas=1
router.get('/', verificarToken, soloAdmin, async (req, res) => {
    try {
        const soloNoLeidas = req.query.solo_no_leidas === '1';
        const result = await pool.query(`
            SELECT id, tipo, mensaje, datos, leida, created_at
            FROM notificaciones
            WHERE tipo = 'incidencia_inicial_excedida'
            ${soloNoLeidas ? 'AND leida = false' : ''}
            ORDER BY leida ASC, created_at DESC
            LIMIT 200
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error listando incidencias:', error);
        res.status(500).json({ error: 'Error al obtener incidencias' });
    }
});

// GET /api/incidencias/sin-leer — conteo para el badge del menú
router.get('/sin-leer', verificarToken, soloAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT COUNT(*)::int AS total
            FROM notificaciones
            WHERE tipo = 'incidencia_inicial_excedida' AND leida = false
        `);
        res.json({ total: result.rows[0].total });
    } catch (error) {
        console.error('Error contando incidencias:', error);
        res.status(500).json({ error: 'Error al contar incidencias' });
    }
});

// PUT /api/incidencias/leer-todas — marcar todas como leídas
// (definida ANTES de /:id/leida para que no la sombree)
router.put('/leer-todas', verificarToken, soloAdmin, async (req, res) => {
    try {
        const result = await pool.query(`
            UPDATE notificaciones SET leida = true
            WHERE tipo = 'incidencia_inicial_excedida' AND leida = false
        `);
        res.json({ success: true, marcadas: result.rowCount });
    } catch (error) {
        console.error('Error marcando incidencias:', error);
        res.status(500).json({ error: 'Error al marcar incidencias' });
    }
});

// PUT /api/incidencias/:id/leida — marcar una como leída
router.put('/:id/leida', verificarToken, soloAdmin, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        if (isNaN(id)) return res.status(400).json({ error: 'ID inválido' });
        const result = await pool.query(`
            UPDATE notificaciones SET leida = true
            WHERE id = $1 AND tipo = 'incidencia_inicial_excedida'
        `, [id]);
        if (result.rowCount === 0) return res.status(404).json({ error: 'Incidencia no encontrada' });
        res.json({ success: true });
    } catch (error) {
        console.error('Error marcando incidencia:', error);
        res.status(500).json({ error: 'Error al marcar incidencia' });
    }
});

module.exports = router;
