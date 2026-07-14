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

        // Filtro estado (calculado: pendiente/pagado/mora/abiertas/canceladas)
        // Usar CAST(deuda AS NUMERIC) para asegurar comparación numérica
        // ya que el campo podría ser VARCHAR/TEXT en la base de datos
        if (estado && estado !== 'todos') {
            paramCount++;
            if (estado === 'pendiente') {
                query += ` AND CAST(deuda AS NUMERIC) > 0 AND CAST(monto_depositados AS NUMERIC) < CAST(monto_factura AS NUMERIC) AND fecha_factura >= NOW() - INTERVAL '30 days'`;
            } else if (estado === 'pagado') {
                query += ` AND (CAST(deuda AS NUMERIC) <= 0 OR CAST(monto_depositados AS NUMERIC) >= CAST(monto_factura AS NUMERIC))`;
            } else if (estado === 'mora') {
                query += ` AND CAST(deuda AS NUMERIC) > 0 AND fecha_factura < NOW() - INTERVAL '30 days'`;
            } else if (estado === 'abiertas') {
                // Facturas Abiertas: deuda > 0 (excluye deuda = 0 y negativos)
                query += ` AND CAST(deuda AS NUMERIC) > 0`;
            } else if (estado === 'canceladas') {
                // Facturas Canceladas: deuda <= 0 (totalmente pagadas)
                query += ` AND CAST(deuda AS NUMERIC) <= 0`;
            }
        }

        // Filtro monto deuda
        if (monto_min) {
            paramCount++;
            query += ` AND CAST(deuda AS NUMERIC) >= $${paramCount}`;
            params.push(parseFloat(monto_min));
        }
        if (monto_max) {
            paramCount++;
            query += ` AND CAST(deuda AS NUMERIC) <= $${paramCount}`;
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

        // Calcular cuotas pagadas para cada registro
        const datosConCuotas = result.rows.map(row => {
            const montoFactura = parseFloat(row.monto_factura) || 0;
            const montoDepositados = parseFloat(row.monto_depositados) || 0;
            const cuotasTotales = parseInt(row.cuotas) || 0;

            // Calcular cuotas pagadas: monto_depositados / (monto_factura / cuotas)
            let cuotasPagadas = 0;
            if (montoFactura > 0 && cuotasTotales > 0) {
                const montoPorCuota = montoFactura / cuotasTotales;
                cuotasPagadas = Math.min(Math.floor(montoDepositados / montoPorCuota), cuotasTotales);
            }

            return {
                ...row,
                cuotas_pagadas: cuotasPagadas,
                cuotas_totales: cuotasTotales
            };
        });

        // Calcular resumen con sumatorias
        const resumen = {
            total_clientes: datosConCuotas.length,
            total_deuda: datosConCuotas.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0),
            total_facturado: datosConCuotas.reduce((sum, r) => sum + (parseFloat(r.monto_factura) || 0), 0),
            total_depositado: datosConCuotas.reduce((sum, r) => sum + (parseFloat(r.monto_depositados) || 0), 0),
            clientes_mora: datosConCuotas.filter(r => {
                const deuda = parseFloat(r.deuda) || 0;
                const fecha = new Date(r.fecha_factura);
                const dias = (new Date() - fecha) / (1000 * 60 * 60 * 24);
                return deuda > 0 && dias > 30;
            }).length,
            promedio_deuda: datosConCuotas.length > 0 
                ? datosConCuotas.reduce((sum, r) => sum + (parseFloat(r.deuda) || 0), 0) / datosConCuotas.length 
                : 0
        };

        res.json({
            exito: true,
            total: datosConCuotas.length,
            datos: datosConCuotas,
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