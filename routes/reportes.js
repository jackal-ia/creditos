// ============================================================
// REPORTES GENÉRICOS POR TIENDA
// ============================================================
// Un solo handler paramétrico reemplaza los bloques duplicados
// de /caracas y /maracaibo (y habilita /maracay, que no existía).
//
//   POST /api/reportes/:tienda
//   Body: { fecha_desde, fecha_hasta, estado, monto_min, monto_max,
//           nombre_cliente, cedula }
//
// Las URLs existentes (/api/reportes/caracas, /api/reportes/maracaibo)
// siguen funcionando igual: :tienda se valida contra la whitelist.
// Para agregar una tienda: añadir UNA línea en TIENDAS.
// ============================================================

const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');
const { TIENDAS } = require('./tiendas');

// ------------------------------------------------------------
// Middleware: valida :tienda contra la whitelist
// ------------------------------------------------------------
function validarTienda(req, res, next) {
    const tabla = TIENDAS[req.params.tienda];
    if (!tabla) {
        return res.status(400).json({
            exito: false,
            error: 'Tienda no válida',
            tiendas_disponibles: Object.keys(TIENDAS)
        });
    }
    // Operadores: solo reportes de SU tienda
    if (req.usuario && req.usuario.rol === 'operador' && req.usuario.tienda
        && req.params.tienda !== req.usuario.tienda) {
        return res.status(403).json({ exito: false, error: 'No tiene acceso a esta tienda' });
    }
    req.tablaTienda = tabla;
    next();
}

// ------------------------------------------------------------
// POST /api/reportes/:tienda - Reporte filtrado de una tienda
// ------------------------------------------------------------
router.post('/:tienda', verificarToken, validarTienda, async (req, res) => {
    try {
        const {
            fecha_desde,
            fecha_hasta,
            estado,
            monto_min,
            monto_max,
            nombre_cliente,
            cedula
        } = req.body;

        // Construir query dinámica (tabla validada por whitelist, nunca raw input)
        let query = `SELECT * FROM ${req.tablaTienda} WHERE 1=1`;
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
        // CAST(... AS NUMERIC) para asegurar comparación numérica
        if (estado && estado !== 'todos') {
            paramCount++;
            if (estado === 'pendiente') {
                query += ` AND CAST(deuda AS NUMERIC) > 0 AND CAST(monto_depositados AS NUMERIC) < CAST(monto_factura AS NUMERIC) AND fecha_factura >= NOW() - INTERVAL '30 days'`;
            } else if (estado === 'pagado') {
                query += ` AND (CAST(deuda AS NUMERIC) <= 0 OR CAST(monto_depositados AS NUMERIC) >= CAST(monto_factura AS NUMERIC))`;
            } else if (estado === 'mora') {
                query += ` AND CAST(deuda AS NUMERIC) > 0 AND fecha_factura < NOW() - INTERVAL '30 days'`;
            } else if (estado === 'abiertas') {
                query += ` AND CAST(deuda AS NUMERIC) > 0`;
            } else if (estado === 'canceladas') {
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

            // Cuotas pagadas: monto_depositados / (monto_factura / cuotas)
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

        // Resumen con sumatorias
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
        console.error(`Error generando reporte (${req.tablaTienda}):`, err);
        res.status(500).json({
            exito: false,
            error: 'Error al generar reporte'
        });
    }
});

module.exports = router;
