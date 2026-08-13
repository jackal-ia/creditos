const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');
const { toUpperCaseFields } = require('../utils/uppercase'); // ← Opción A: Helper reutilizable

// ============================================================
// LISTAR ACTIVIDADES
// ============================================================
router.get('/', verificarToken, async (req, res) => {
    try {
        const { fecha, tienda, estado, page = 1, limit = 20 } = req.query;
        const esAdmin = req.usuario.rol === 'administrador';
        const offset = (parseInt(page) - 1) * parseInt(limit);

        let query = 'SELECT a.*, u.nombre as creado_por_nombre FROM actividades a LEFT JOIN usuarios u ON a.creado_por = u.id WHERE 1=1';
        const params = [];
        let paramIndex = 1;

        if (fecha) {
            query += ` AND a.fecha = $${paramIndex++}`;
            params.push(fecha);
        }
        if (!esAdmin && req.usuario.tienda) {
            query += ` AND a.tienda = $${paramIndex++}`;
            params.push(req.usuario.tienda);
        } else if (tienda) {
            query += ` AND a.tienda = $${paramIndex++}`;
            params.push(tienda);
        }
        if (estado) {
            query += ` AND a.estado = $${paramIndex++}`;
            params.push(estado);
        }

        query += ` ORDER BY a.fecha DESC, a.hora DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
        params.push(parseInt(limit), offset);

        const result = await pool.query(query, params);
        res.json(result.rows);
    } catch (err) {
        console.error('Error listando actividades:', err);
        res.status(500).json({ error: 'Error al listar actividades' });
    }
});

// ============================================================
// OBTENER ACTIVIDAD POR ID
// ============================================================
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT a.*, u.nombre as creado_por_nombre FROM actividades a LEFT JOIN usuarios u ON a.creado_por = u.id WHERE a.id = $1',
            [req.params.id]
        );
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo actividad:', err);
        res.status(500).json({ error: 'Error al obtener actividad' });
    }
});

// ============================================================
// CREAR ACTIVIDAD (POST)
// ============================================================
router.post('/', verificarToken, async (req, res) => {
    try {
        const esAdmin = req.usuario.rol === 'administrador';

        // ← Opción A: Convertir campos de texto a MAYÚSCULAS antes de guardar
        const upperFields = ['descripcion', 'descripcion_extra', 'prioridad', 'tienda', 'estado'];
        const datos = toUpperCaseFields(req.body, upperFields);

        let { descripcion, descripcion_extra, hora, prioridad, tienda, estado, fecha } = datos;

        if (!descripcion || !hora) {
            return res.status(400).json({ error: 'Descripción y hora son obligatorias' });
        }

        // Operador solo puede crear actividades de su tienda
        if (!esAdmin && req.usuario.tienda && tienda && tienda !== req.usuario.tienda) {
            return res.status(403).json({ error: 'Solo puedes crear actividades de tu tienda asignada' });
        }
        if (!esAdmin && !tienda && req.usuario.tienda) {
            tienda = req.usuario.tienda;
        }

        const result = await pool.query(
            `INSERT INTO actividades (descripcion, descripcion_extra, hora, prioridad, tienda, estado, fecha, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
            [descripcion, descripcion_extra || null, hora, prioridad || 'media', tienda || null, estado || 'pendiente', fecha || new Date(), req.usuario.id]
        );

        res.status(201).json(result.rows[0]);
    } catch (err) {
        console.error('Error creando actividad:', err);
        res.status(500).json({ error: 'Error al crear actividad' });
    }
});

// ============================================================
// ACTUALIZAR ACTIVIDAD (PUT)
// ============================================================
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const esAdmin = req.usuario.rol === 'administrador';

        const actual = await pool.query('SELECT * FROM actividades WHERE id = $1', [id]);
        if (actual.rows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        // ← Opción A: Convertir campos de texto a MAYÚSCULAS antes de actualizar
        const upperFields = ['descripcion', 'descripcion_extra', 'prioridad', 'tienda', 'estado'];
        const datos = toUpperCaseFields(req.body, upperFields);

        const { descripcion, descripcion_extra, hora, prioridad, tienda, estado, fecha } = datos;
        const actividad = actual.rows[0];

        // Solo admin puede cambiar tienda
        if (!esAdmin && tienda && tienda !== actividad.tienda) {
            return res.status(403).json({ error: 'No puedes cambiar la tienda de la actividad' });
        }

        let sets = [];
        let valores = [];
        let paramIndex = 1;

        if (descripcion !== undefined) { sets.push(`descripcion = $${paramIndex++}`); valores.push(descripcion); }
        if (descripcion_extra !== undefined) { sets.push(`descripcion_extra = $${paramIndex++}`); valores.push(descripcion_extra); }
        if (hora !== undefined) { sets.push(`hora = $${paramIndex++}`); valores.push(hora); }
        if (prioridad !== undefined) { sets.push(`prioridad = $${paramIndex++}`); valores.push(prioridad); }
        if (tienda !== undefined && esAdmin) { sets.push(`tienda = $${paramIndex++}`); valores.push(tienda); }
        if (estado !== undefined) { 
            sets.push(`estado = $${paramIndex++}`); 
            valores.push(estado);
            if (estado === 'completada' && actividad.estado !== 'completada') {
                sets.push(`fecha_completada = CURRENT_TIMESTAMP`);
                sets.push(`completado_por = $${paramIndex++}`);
                valores.push(req.usuario.id);
            }
        }
        if (fecha !== undefined) { sets.push(`fecha = $${paramIndex++}`); valores.push(fecha); }

        if (sets.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        const query = `UPDATE actividades SET ${sets.join(', ')} WHERE id = $${paramIndex} RETURNING *`;
        valores.push(id);

        const result = await pool.query(query, valores);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error actualizando actividad:', err);
        res.status(500).json({ error: 'Error al actualizar actividad' });
    }
});

// ============================================================
// ELIMINAR ACTIVIDAD
// ============================================================
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const id = req.params.id;
        const esAdmin = req.usuario.rol === 'administrador';

        const actual = await pool.query('SELECT * FROM actividades WHERE id = $1', [id]);
        if (actual.rows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        if (!esAdmin && actual.rows[0].tienda !== req.usuario.tienda) {
            return res.status(403).json({ error: 'No puedes eliminar actividades de otra tienda' });
        }

        await pool.query('DELETE FROM actividades WHERE id = $1', [id]);
        res.json({ message: 'Actividad eliminada' });
    } catch (err) {
        console.error('Error eliminando actividad:', err);
        res.status(500).json({ error: 'Error al eliminar actividad' });
    }
});

// ============================================================
// ESTADÍSTICAS DE ACTIVIDADES (DÍA ACTUAL)
// ============================================================
router.get('/estadisticas/resumen', verificarToken, async (req, res) => {
    try {
        const esAdmin = req.usuario.rol === 'administrador';
        const tiendaFilter = (!esAdmin && req.usuario.tienda) ? req.usuario.tienda : null;

        let query = `SELECT 
            COUNT(*) as total,
            COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
            COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
            COUNT(*) FILTER (WHERE prioridad = 'urgente') as urgentes,
            COUNT(*) FILTER (WHERE prioridad = 'alta') as altas
            FROM actividades WHERE fecha = CURRENT_DATE`;

        const params = [];
        if (tiendaFilter) {
            query += ' AND tienda = $1';
            params.push(tiendaFilter);
        }

        const result = await pool.query(query, params);
        res.json(result.rows[0]);
    } catch (err) {
        console.error('Error obteniendo estadísticas de actividades:', err);
        res.status(500).json({ error: 'Error al obtener estadísticas' });
    }
});

module.exports = router;
