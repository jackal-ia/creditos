const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth');

// ============================================
// 1. LISTAR ACTIVIDADES (por fecha y tienda)
// ============================================
router.get('/', verificarToken, async (req, res) => {
    try {
        const { fecha, fecha_desde, fecha_hasta, tienda, estado } = req.query;
        const usuario = req.usuario;

        // Si es operador, solo ver actividades de su tienda
        let tiendaFiltro = tienda;
        if (usuario.rol === 'operador' && usuario.tienda) {
            tiendaFiltro = usuario.tienda;
        }

        let query = `
            SELECT a.*, 
                   u1.nombre as creado_por_nombre,
                   u2.nombre as completado_por_nombre
            FROM actividades a
            LEFT JOIN usuarios u1 ON a.creado_por = u1.id
            LEFT JOIN usuarios u2 ON a.completado_por = u2.id
            WHERE 1=1
        `;
        const params = [];
        let paramCount = 0;

        if (fecha) {
            // Filtro de fecha exacta
            paramCount++;
            query += ` AND a.fecha = $${paramCount}`;
            params.push(fecha);
        } else if (fecha_desde && fecha_hasta) {
            // Rango de fechas
            paramCount++;
            query += ` AND a.fecha >= $${paramCount}`;
            params.push(fecha_desde);
            paramCount++;
            query += ` AND a.fecha <= $${paramCount}`;
            params.push(fecha_hasta);
        } else if (fecha_desde) {
            // Solo fecha desde
            paramCount++;
            query += ` AND a.fecha >= $${paramCount}`;
            params.push(fecha_desde);
        } else if (fecha_hasta) {
            // Solo fecha hasta
            paramCount++;
            query += ` AND a.fecha <= $${paramCount}`;
            params.push(fecha_hasta);
        } else {
            // Por defecto, actividades de hoy
            paramCount++;
            query += ` AND a.fecha = CURRENT_DATE`;
        }

        if (tiendaFiltro) {
            paramCount++;
            query += ` AND a.tienda = $${paramCount}`;
            params.push(tiendaFiltro);
        }

        if (estado) {
            paramCount++;
            query += ` AND a.estado = $${paramCount}`;
            params.push(estado);
        }

        query += ` ORDER BY a.fecha DESC, a.hora DESC`;

        const result = await pool.query(query, params);

        res.json({
            exito: true,
            total: result.rows.length,
            actividades: result.rows
        });
    } catch (err) {
        console.error('Error listando actividades:', err);
        res.status(500).json({ error: 'Error al obtener actividades', detalle: err.message });
    }
});

// ============================================
// 2. OBTENER UNA ACTIVIDAD POR ID
// ============================================
router.get('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        const result = await pool.query(
            `SELECT a.*, 
                    u1.nombre as creado_por_nombre,
                    u2.nombre as completado_por_nombre
             FROM actividades a
             LEFT JOIN usuarios u1 ON a.creado_por = u1.id
             LEFT JOIN usuarios u2 ON a.completado_por = u2.id
             WHERE a.id = $1`,
            [id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        const actividad = result.rows[0];

        // Si es operador, verificar que sea de su tienda
        if (usuario.rol === 'operador' && usuario.tienda && actividad.tienda !== usuario.tienda) {
            return res.status(403).json({ error: 'No tienes permiso para ver esta actividad' });
        }

        res.json({ exito: true, actividad });
    } catch (err) {
        console.error('Error obteniendo actividad:', err);
        res.status(500).json({ error: 'Error al obtener actividad', detalle: err.message });
    }
});

// ============================================
// 3. CREAR ACTIVIDAD
// ============================================
router.post('/', verificarToken, async (req, res) => {
    try {
        const { descripcion, descripcion_extra, hora, prioridad, tienda, fecha } = req.body;
        const usuario = req.usuario;

        // Validaciones
        if (!descripcion || !hora || !prioridad || !tienda) {
            return res.status(400).json({ 
                error: 'Descripcion, hora, prioridad y tienda son obligatorios' 
            });
        }

        // Si es operador, solo puede crear para su tienda
        let tiendaFinal = tienda;
        if (usuario.rol === 'operador' && usuario.tienda) {
            tiendaFinal = usuario.tienda;
        }

        const fechaFinal = fecha || new Date().toISOString().split('T')[0];

        const result = await pool.query(
            `INSERT INTO actividades (descripcion, descripcion_extra, hora, prioridad, tienda, fecha, creado_por)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING *`,
            [descripcion, descripcion_extra || null, hora, prioridad, tiendaFinal, fechaFinal, usuario.id]
        );

        res.status(201).json({
            exito: true,
            mensaje: 'Actividad creada correctamente',
            actividad: result.rows[0]
        });
    } catch (err) {
        console.error('Error creando actividad:', err);
        res.status(500).json({ error: 'Error al crear actividad', detalle: err.message });
    }
});

// ============================================
// 4. ACTUALIZAR ACTIVIDAD
// ============================================
router.put('/:id', verificarToken, async (req, res) => {
    try {
        const id = parseInt(req.params.id, 10);
        const { descripcion, descripcion_extra, hora, prioridad, tienda, estado, fecha_completada } = req.body;
        const usuario = req.usuario;

        // Validar que el id sea un número válido
        if (isNaN(id)) {
            return res.status(400).json({ error: 'ID de actividad inválido' });
        }

        // Verificar que el usuario esté autenticado
        if (!usuario || !usuario.id) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        // Verificar que la actividad existe
        const existe = await pool.query('SELECT * FROM actividades WHERE id = $1', [id]);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        const actividadActual = existe.rows[0];

        // Si es operador, verificar que sea de su tienda
        if (usuario.rol === 'operador' && usuario.tienda && actividadActual.tienda !== usuario.tienda) {
            return res.status(403).json({ error: 'No tienes permiso para editar esta actividad' });
        }

        const updates = [];
        const params = [];
        let paramCount = 0;

        if (descripcion !== undefined) { paramCount++; updates.push(`descripcion = $${paramCount}`); params.push(descripcion); }
        if (descripcion_extra !== undefined) { paramCount++; updates.push(`descripcion_extra = $${paramCount}`); params.push(descripcion_extra); }
        if (hora !== undefined) { paramCount++; updates.push(`hora = $${paramCount}`); params.push(hora); }
        if (prioridad !== undefined) { paramCount++; updates.push(`prioridad = $${paramCount}`); params.push(prioridad); }
        if (tienda !== undefined && usuario.rol === 'administrador') { 
            paramCount++; updates.push(`tienda = $${paramCount}`); params.push(tienda); 
        }
        if (estado !== undefined) { 
            paramCount++; updates.push(`estado = $${paramCount}`); params.push(estado); 
            if (estado === 'completada') {
                paramCount++; updates.push(`fecha_completada = $${paramCount}`); params.push(new Date());
                paramCount++; updates.push(`completado_por = $${paramCount}`); params.push(usuario.id);
            } else if (estado === 'pendiente') {
                paramCount++; updates.push(`fecha_completada = $${paramCount}`); params.push(null);
                paramCount++; updates.push(`completado_por = $${paramCount}`); params.push(null);
            }
        }

        if (updates.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        // NO incluir updated_at - la tabla puede no tener esta columna
        // Si la tabla tiene triggers automáticos, se actualizará solo
        paramCount++;
        params.push(id);

        const query = `UPDATE actividades SET ${updates.join(', ')} WHERE id = $${paramCount} RETURNING *`;
        const result = await pool.query(query, params);

        res.json({
            exito: true,
            mensaje: 'Actividad actualizada correctamente',
            actividad: result.rows[0]
        });
    } catch (err) {
        console.error('Error actualizando actividad:', err);
        console.error('Stack trace:', err.stack);
        res.status(500).json({ error: 'Error al actualizar actividad', detalle: err.message });
    }
});

// ============================================
// 5. ELIMINAR ACTIVIDAD
// ============================================
router.delete('/:id', verificarToken, async (req, res) => {
    try {
        const { id } = req.params;
        const usuario = req.usuario;

        // Verificar que la actividad existe
        const existe = await pool.query('SELECT * FROM actividades WHERE id = $1', [id]);
        if (existe.rows.length === 0) {
            return res.status(404).json({ error: 'Actividad no encontrada' });
        }

        const actividad = existe.rows[0];

        // Si es operador, verificar que sea de su tienda
        if (usuario.rol === 'operador' && usuario.tienda && actividad.tienda !== usuario.tienda) {
            return res.status(403).json({ error: 'No tienes permiso para eliminar esta actividad' });
        }

        await pool.query('DELETE FROM actividades WHERE id = $1', [id]);

        res.json({
            exito: true,
            mensaje: 'Actividad eliminada correctamente'
        });
    } catch (err) {
        console.error('Error eliminando actividad:', err);
        res.status(500).json({ error: 'Error al eliminar actividad', detalle: err.message });
    }
});

// ============================================
// 6. ESTADISTICAS DE ACTIVIDADES
// ============================================
router.get('/estadisticas/resumen', verificarToken, async (req, res) => {
    try {
        const { fecha } = req.query;
        const usuario = req.usuario;

        let tiendaFiltro = null;
        if (usuario.rol === 'operador' && usuario.tienda) {
            tiendaFiltro = usuario.tienda;
        }

        const fechaFinal = fecha || new Date().toISOString().split('T')[0];

        let query = `
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE estado = 'pendiente') as pendientes,
                COUNT(*) FILTER (WHERE estado = 'completada') as completadas,
                COUNT(*) FILTER (WHERE prioridad = 'urgente') as urgentes,
                COUNT(*) FILTER (WHERE prioridad = 'alta') as altas
            FROM actividades
            WHERE fecha = $1
        `;
        const params = [fechaFinal];

        if (tiendaFiltro) {
            query += ` AND tienda = $2`;
            params.push(tiendaFiltro);
        }

        const result = await pool.query(query, params);

        res.json({
            exito: true,
            estadisticas: result.rows[0]
        });
    } catch (err) {
        console.error('Error obteniendo estadisticas:', err);
        res.status(500).json({ error: 'Error al obtener estadisticas', detalle: err.message });
    }
});

module.exports = router;
