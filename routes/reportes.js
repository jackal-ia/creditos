const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

// ============================================
// REPORTES TIENDA CARACAS
// ============================================

router.post('/caracas', verificarToken, async (req, res) => {
    try {
        const {
            fecha_desde,
            fecha_hasta,
            estado,
            monto_min,
            monto_max,
            cuotas_pendientes,
            nombre_cliente,
            cedula
        } = req.body;

        // Construir query dinámica
        let query = `SELECT * FROM tienda_caracas WHERE 1=1`;
        const params = [];
        let paramCount = 0;

        // Filtro fecha factura
        if (fecha_desde) {
            paramCount++;
            query += ` AND fecha_factura >= $${paramCount}`;
            params.push(fecha_desde);
        }
        if (fecha_hasta) {
            paramCount++;
            query += ` AND fecha_factura <= $${paramCount}`;
            params.push(fecha_hasta);
        }

        // Filtro estado (calculado: pendiente/pagado/mora)
        if (estado && estado !== 'todos') {
            paramCount++;
            if (estado === 'pendiente') {
                query += ` AND deuda > 0 AND monto_depositados < monto_factura`;
            } else if (estado === 'pagado') {
                query += ` AND deuda <= 0 OR monto_depositados >= monto_factura`;
            } else if (estado === 'mora') {
                query += ` AND deuda > 0 AND fecha_factura < NOW() - INTERVAL '30 days'`;
            }
        }

        // Filtro monto deuda
        if (monto_min) {
            paramCount++;
            query += ` AND deuda >= $${paramCount}`;
            params.push(parseFloat(monto_min));
        }
        if (monto_max) {
            paramCount++;
            query += ` AND deuda <= $${paramCount}`;
            params.push(parseFloat(monto_max));
        }

        // Filtro nombre cliente
        if (nombre_cliente) {
            paramCount++;
            query += ` AND nombre_apellido ILIKE $${paramCount}`;
            params.push(`%${nombre_cliente}%`);
        }

        // Filtro cédula
        if (cedula) {
            paramCount++;
            query += ` AND cedula ILIKE $${paramCount}`;
            params.push(`%${cedula}%`);
        }

        query += ` ORDER BY fecha_factura DESC, id DESC`;

        const result = await pool.query(query, params);

        // Calcular resumen
        const resumen = {
            total_clientes: result.rows.length,
            total_deuda: result.rows.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0),
            total_facturado: result.rows.reduce((sum, r) => sum + (parseFloat(r.monto_factura) || 0), 0),
            total_depositado: result.rows.reduce((sum, r) => sum + (parseFloat(r.monto_depositados) || 0), 0),
            clientes_mora: result.rows.filter(r => {
                const deuda = parseFloat(r.deuda) || 0;
                const fecha = new Date(r.fecha_factura);
                const dias = (new Date() - fecha) / (1000 * 60 * 60 * 24);
                return deuda > 0 && dias > 30;
            }).length,
            promedio_deuda: result.rows.length > 0 
                ? result.rows.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0) / result.rows.length 
                : 0
        };

        res.json({
            exito: true,
            total: result.rows.length,
            datos: result.rows,
            resumen: resumen
        });

    } catch (err) {
        console.error('Error generando reporte:', err);
        res.status(500).json({ 
            exito: false, 
            error: 'Error al generar reporte', 
            detalle: err.message 
        });
    }
});

module.exports = router;
