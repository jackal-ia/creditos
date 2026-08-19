// ============================================================
// API DE REPORTES DINAMICOS v1.2 — Sistema de Creditos IPSFA
// ============================================================
// Fecha: 2026-08-16
// Cambios v1.2:
//   - El filtro DEUDORES usa deuda_usd DIRECTAMENTE de la BD
//   - Mantiene consistencia con el modal de edición
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

const router = express.Router();

// Mapa de tiendas a tablas de PostgreSQL
const TIENDAS = {
    caracas: 'tienda_caracas',
    maracay: 'tienda_maracay',
    maracaibo: 'tienda_maracaibo'
};

const TABLAS_PAGOS = {
    caracas: 'pagos_caracas',
    maracay: 'pagos_maracay',
    maracaibo: 'pagos_maracaibo'
};

const TIPOS_REPORTE = ['cartera', 'cobranza', 'deudores', 'cuotas'];
const FORMATOS_SALIDA = ['json', 'excel', 'pdf'];

// ============================================================
// ENDPOINT PRINCIPAL: POST /api/reportes/v1/generar
// ============================================================
router.post('/generar', verificarToken, async (req, res) => {
    try {
        const {
            tienda,
            tipo = 'cartera',
            formato = 'json',
            filtros = {},
            ordenarPor = 'id',
            orden = 'asc',
            pagina = 1,
            porPagina = 50
        } = req.body;

        if (!tienda) {
            return res.status(400).json({
                exito: false,
                error: 'El campo "tienda" es obligatorio',
                tiendas_disponibles: Object.keys(TIENDAS)
            });
        }

        const tabla = TIENDAS[tienda];
        if (!tabla) {
            return res.status(400).json({
                exito: false,
                error: 'Tienda no valida',
                tiendas_disponibles: Object.keys(TIENDAS)
            });
        }

        if (!TIPOS_REPORTE.includes(tipo)) {
            return res.status(400).json({
                exito: false,
                error: 'Tipo de reporte no valido',
                tipos_disponibles: TIPOS_REPORTE
            });
        }

        if (!FORMATOS_SALIDA.includes(formato)) {
            return res.status(400).json({
                exito: false,
                error: 'Formato no valido',
                formatos_disponibles: FORMATOS_SALIDA
            });
        }

        if (req.usuario.rol === 'operador' && req.usuario.tienda && req.usuario.tienda !== tienda) {
            return res.status(403).json({ exito: false, error: 'No tiene acceso a esta tienda' });
        }

        const { query, params, countQuery, countParams } = construirQuery(
            tipo, tabla, filtros, ordenarPor, orden, pagina, porPagina, tienda, false
        );

        const result = await pool.query(query, params);
        const countResult = await pool.query(countQuery, countParams);
        const totalRegistros = parseInt(countResult.rows[0].count);

        const datos = formatearReporte(tipo, result.rows);
        const resumen = calcularResumen(tipo, datos);

        if (formato === 'excel') {
            return exportarCSV(res, datos, `reporte_${tipo}_${tienda}_${new Date().toISOString().split('T')[0]}`);
        }

        if (formato === 'pdf') {
            return exportarPDF(res, datos, resumen, `reporte_${tipo}_${tienda}`);
        }

        res.json({
            exito: true,
            tipo,
            tienda,
            totalRegistros,
            pagina,
            porPagina,
            totalPaginas: Math.ceil(totalRegistros / porPagina),
            resumen,
            datos
        });

    } catch (error) {
        console.error('[API Reportes] Error:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al generar reporte',
            details: error.message
        });
    }
});

// ============================================================
// ENDPOINT CONSOLIDADO
// ============================================================
router.post('/generar-consolidado', verificarToken, async (req, res) => {
    try {
        const {
            tiendas = ['caracas', 'maracay', 'maracaibo'],
            tipo = 'cartera',
            formato = 'json',
            filtros = {},
            ordenarPor = 'id',
            orden = 'asc',
            pagina = 1,
            porPagina = 50
        } = req.body;

        if (req.usuario.rol !== 'administrador') {
            return res.status(403).json({
                exito: false,
                error: 'Solo administradores pueden usar reportes consolidados'
            });
        }

        const tiendasValidas = tiendas.filter(t => TIENDAS[t]);
        if (tiendasValidas.length === 0) {
            return res.status(400).json({
                exito: false,
                error: 'Ninguna tienda valida',
                tiendas_disponibles: Object.keys(TIENDAS)
            });
        }

        if (!TIPOS_REPORTE.includes(tipo)) {
            return res.status(400).json({
                exito: false,
                error: 'Tipo de reporte no valido',
                tipos_disponibles: TIPOS_REPORTE
            });
        }

        if (!FORMATOS_SALIDA.includes(formato)) {
            return res.status(400).json({
                exito: false,
                error: 'Formato no valido',
                formatos_disponibles: FORMATOS_SALIDA
            });
        }

        const resultadosPorTienda = await Promise.all(
            tiendasValidas.map(async (tiendaKey) => {
                const tabla = TIENDAS[tiendaKey];
                const { query, params, countQuery, countParams } = construirQuery(
                    tipo, tabla, filtros, ordenarPor, orden, 1, 10000, tiendaKey, true
                );

                const result = await pool.query(query, params);
                const countResult = await pool.query(countQuery, countParams);
                const totalRegistros = parseInt(countResult.rows[0].count);

                const datos = formatearReporte(tipo, result.rows).map(d => ({
                    ...d,
                    tienda: tiendaKey,
                    tiendaNombre: tiendaKey.charAt(0).toUpperCase() + tiendaKey.slice(1)
                }));

                return {
                    tienda: tiendaKey,
                    totalRegistros,
                    datos
                };
            })
        );

        const todosDatos = resultadosPorTienda.flatMap(r => r.datos);
        const totalGlobal = resultadosPorTienda.reduce((s, r) => s + r.totalRegistros, 0);

        const resumenGlobal = calcularResumen(tipo, todosDatos);
        resumenGlobal.desglosePorTienda = resultadosPorTienda.map(r => ({
            tienda: r.tienda,
            registros: r.totalRegistros
        }));

        const offset = (parseInt(pagina) - 1) * parseInt(porPagina);
        const limit = parseInt(porPagina);
        const datosPaginados = todosDatos.slice(offset, offset + limit);
        const totalPaginas = Math.ceil(todosDatos.length / limit);

        if (formato === 'excel') {
            return exportarCSV(res, datosPaginados, `reporte_consolidado_${tipo}_${new Date().toISOString().split('T')[0]}`);
        }

        if (formato === 'pdf') {
            return exportarPDF(res, datosPaginados, resumenGlobal, `reporte_consolidado_${tipo}`);
        }

        res.json({
            exito: true,
            tipo,
            tiendas: tiendasValidas,
            totalRegistros: totalGlobal,
            pagina: parseInt(pagina),
            porPagina: limit,
            totalPaginas,
            resumen: resumenGlobal,
            desglosePorTienda: resultadosPorTienda.map(r => ({
                tienda: r.tienda,
                totalRegistros: r.totalRegistros
            })),
            datos: datosPaginados
        });

    } catch (error) {
        console.error('[API Reportes Consolidado] Error:', error);
        res.status(500).json({
            exito: false,
            error: 'Error al generar reporte consolidado',
            details: error.message
        });
    }
});

// ============================================================
// QUERY BUILDER
// ============================================================
function construirQuery(tipo, tabla, filtros, ordenarPor, orden, pagina, porPagina, tiendaKey, sinPaginacion) {
    const where = ['1=1'];
    const params = [];
    let idx = 1;

    if (filtros.fechaDesde) {
        where.push(`fecha_factura >= $${idx++}`);
        params.push(filtros.fechaDesde);
    }

    if (filtros.fechaHasta) {
        where.push(`fecha_factura <= $${idx++}`);
        params.push(filtros.fechaHasta);
    }

    if (filtros.estado && filtros.estado !== 'todos') {
        switch (filtros.estado) {
            case 'aldia':
                where.push('COALESCE(deuda, 0) <= 0');
                break;
            case 'deudor':
                where.push('COALESCE(deuda, 0) > 0');
                break;
            case 'incompleto':
                where.push('COALESCE(monto_depositados, 0) > 0 AND COALESCE(deuda, 0) > 0');
                break;
            case 'sinpago':
                where.push('COALESCE(monto_depositados, 0) = 0');
                break;
        }
    }

    if (filtros.minDeuda !== undefined && filtros.minDeuda !== null && filtros.minDeuda !== '') {
        where.push(`COALESCE(deuda, 0) >= $${idx++}`);
        params.push(parseFloat(filtros.minDeuda));
    }

    if (filtros.maxDeuda !== undefined && filtros.maxDeuda !== null && filtros.maxDeuda !== '') {
        where.push(`COALESCE(deuda, 0) <= $${idx++}`);
        params.push(parseFloat(filtros.maxDeuda));
    }

    if (filtros.busqueda) {
        where.push(`(nombre_apellido ILIKE $${idx} OR cedula ILIKE $${idx})`);
        params.push(`%${filtros.busqueda}%`);
        idx++;
    }

    const whereClause = where.join(' AND ');

    const columnasPermitidas = {
        id: 'id',
        nombre: 'nombre_apellido',
        fecha: 'fecha_factura',
        deuda: 'deuda',
        monto: 'monto_factura',
        factura: 'nro_factura',
        cedula: 'cedula'
    };
    const colOrden = columnasPermitidas[ordenarPor] || 'id';
    const dirOrden = orden === 'desc' ? 'DESC' : 'ASC';

    const offset = sinPaginacion ? 0 : (parseInt(pagina) - 1) * parseInt(porPagina);
    const limit = sinPaginacion ? 10000 : parseInt(porPagina);

    let query;

    switch (tipo) {
        case 'cartera':
            query = `SELECT id, nro_factura, nombre_apellido, cedula, telefono,
                      monto_factura, monto_depositados, deuda, fecha_factura,
                      monto_facturado_divisa, tasa_bcv_factura, cuotas,
                      monto_cuota_usd, inicial_bs, inicial_usd,
                      total_depositado_usd, deuda_usd, cuotas_pagadas, proxima_cuota,
                      numero_cuenta, banco, created_at
                      FROM ${tabla} WHERE ${whereClause} ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
            break;

        case 'cobranza':
            query = `SELECT id, nro_factura, nombre_apellido, cedula,
                      monto_depositados, deuda, fecha_factura, cuotas, cuotas_pagadas,
                      monto_factura, monto_facturado_divisa, total_depositado_usd, deuda_usd
                      FROM ${tabla} WHERE ${whereClause} ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
            break;

        case 'deudores':
            query = `SELECT id, nro_factura, nombre_apellido, cedula,
                      monto_factura, monto_depositados, deuda, fecha_factura,
                      monto_facturado_divisa, total_depositado_usd, deuda_usd,
                      cuotas, monto_cuota_usd, cuotas_pagadas,
                      telefono, numero_cuenta, banco
                      FROM ${tabla} WHERE ${whereClause} AND COALESCE(deuda, 0) > 0
                      ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
            break;

        case 'cuotas':
            query = `SELECT t.id, t.nro_factura, t.nombre_apellido, t.cedula,
                      t.monto_factura, t.monto_facturado_divisa, t.cuotas, t.monto_cuota_usd,
                      COALESCE(
                        (SELECT json_agg(
                          json_build_object(
                            'nro_cuota', p.nro_cuota,
                            'monto_bs', p.monto_bs,
                            'monto_usd', p.monto_usd,
                            'referencia', p.referencia,
                            'fecha', p.fecha,
                            'tasa_bcv', p.tasa_bcv
                          ) ORDER BY p.nro_cuota
                        ) FROM ${TABLAS_PAGOS[tiendaKey]} p WHERE p.factura_id = t.id),
                        '[]'::json
                      ) as pagos_extra
                      FROM ${tabla} t WHERE ${whereClause}
                      ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
            break;

        default:
            query = `SELECT * FROM ${tabla} WHERE ${whereClause} ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
    }

    const countQuery = `SELECT COUNT(*) FROM ${tabla} WHERE ${whereClause}`;
    const countParams = params.slice(0, params.length - 2);

    return { query, params, countQuery, countParams };
}

// ============================================================
// FORMATEADOR DE DATOS (v1.2)
// ============================================================
function formatearReporte(tipo, rows) {
    switch (tipo) {
        case 'cartera':
            return rows.map(r => {
                // Recalcular deudaUSD para cartera (consistencia con frontend)
                const montoUSD = parseFloat(r.monto_facturado_divisa) || 0;
                const depositadoUSD = parseFloat(r.total_depositado_usd) || 0;
                const deudaUSD = redondearDecimales(montoUSD - depositadoUSD);
                const deudaBs = parseFloat(r.deuda) || 0;

                return {
                    id: r.id,
                    factura: r.nro_factura,
                    cliente: r.nombre_apellido,
                    cedula: r.cedula,
                    telefono: r.telefono,
                    montoBs: parseFloat(r.monto_factura) || 0,
                    depositadoBs: parseFloat(r.monto_depositados) || 0,
                    deudaBs: deudaBs,
                    estado: deudaBs <= 0 ? 'Al dia' : 'Deudor',
                    montoUSD: montoUSD,
                    tasaBCV: parseFloat(r.tasa_bcv_factura) || 0,
                    cuotas: parseInt(r.cuotas) || 0,
                    montoCuotaUSD: parseFloat(r.monto_cuota_usd) || 0,
                    inicialBs: parseFloat(r.inicial_bs) || 0,
                    inicialUSD: parseFloat(r.inicial_usd) || 0,
                    depositadoUSD: depositadoUSD,
                    deudaUSD: deudaUSD,
                    cuotasPagadas: parseInt(r.cuotas_pagadas) || 0,
                    proximaCuota: parseFloat(r.proxima_cuota) || 0,
                    banco: r.banco,
                    numeroCuenta: r.numero_cuenta,
                    fecha: r.fecha_factura
                };
            });

        case 'cobranza':
            return rows.map(r => {
                const cuotasTotales = parseInt(r.cuotas) || 0;
                const cuotasPagadas = parseInt(r.cuotas_pagadas) || 0;
                const porcentajePagado = cuotasTotales > 0
                    ? parseFloat(((cuotasPagadas / cuotasTotales) * 100).toFixed(2))
                    : 0;
                return {
                    id: r.id,
                    factura: r.nro_factura,
                    cliente: r.nombre_apellido,
                    cedula: r.cedula,
                    cuotasPagadas,
                    cuotasTotales,
                    porcentajePagado,
                    totalDepositadoBs: parseFloat(r.monto_depositados) || 0,
                    totalDepositadoUSD: parseFloat(r.total_depositado_usd) || 0,
                    deudaRestanteBs: parseFloat(r.deuda) || 0,
                    deudaRestanteUSD: parseFloat(r.deuda_usd) || 0,
                    fecha: r.fecha_factura
                };
            });

        case 'deudores':
            // ✅ v1.2: Usar deuda_usd DIRECTAMENTE de la BD
            // (igual que el modal de edición en tienda-spa.js)
            return rows.map(r => {
                const deudaUSD = parseFloat(r.deuda_usd) || 0;

                return {
                    id: r.id,
                    factura: r.nro_factura,
                    cliente: r.nombre_apellido,
                    cedula: r.cedula,
                    telefono: r.telefono,
                    montoTotalBs: parseFloat(r.monto_factura) || 0,
                    montoTotalUSD: parseFloat(r.monto_facturado_divisa) || 0,
                    depositadoBs: parseFloat(r.monto_depositados) || 0,
                    deudaBs: parseFloat(r.deuda) || 0,
                    deudaUSD: deudaUSD,  // ✅ DIRECTO de la BD
                    cuotas: parseInt(r.cuotas) || 0,
                    montoCuotaUSD: parseFloat(r.monto_cuota_usd) || 0,
                    diasSinPago: calcularDiasMora(r.fecha_factura, r.monto_depositados),
                    banco: r.banco,
                    numeroCuenta: r.numero_cuenta,
                    fecha: r.fecha_factura
                };
            });

        case 'cuotas':
            return rows.map(r => ({
                id: r.id,
                factura: r.nro_factura,
                cliente: r.nombre_apellido,
                cedula: r.cedula,
                montoFacturaBs: parseFloat(r.monto_factura) || 0,
                montoFacturaUSD: parseFloat(r.monto_facturado_divisa) || 0,
                cuotasTotales: parseInt(r.cuotas) || 0,
                montoCuotaUSD: parseFloat(r.monto_cuota_usd) || 0,
                pagos: Array.isArray(r.pagos_extra) ? r.pagos_extra.map(p => ({
                    nroCuota: p.nro_cuota,
                    montoBs: parseFloat(p.monto_bs) || 0,
                    montoUSD: parseFloat(p.monto_usd) || 0,
                    referencia: p.referencia,
                    fecha: p.fecha,
                    tasaBCV: parseFloat(p.tasa_bcv) || 0
                })) : []
            }));

        default:
            return rows;
    }
}

// ============================================================
// CALCULADOR DE RESUMEN
// ============================================================
function calcularResumen(tipo, datos) {
    if (datos.length === 0) {
        return { totalRegistros: 0, totalFacturado: 0, totalDepositado: 0, totalDeuda: 0 };
    }

    if (tipo === 'cartera') {
        const totalFacturado = datos.reduce((s, d) => s + (d.montoBs || 0), 0);
        const totalDepositado = datos.reduce((s, d) => s + (d.depositadoBs || 0), 0);
        const totalDeuda = datos.reduce((s, d) => s + (d.deudaBs || 0), 0);
        const totalFacturadoUSD = datos.reduce((s, d) => s + (d.montoUSD || 0), 0);
        const totalDepositadoUSD = datos.reduce((s, d) => s + (d.depositadoUSD || 0), 0);
        const totalDeudaUSD = datos.reduce((s, d) => s + (d.deudaUSD || 0), 0);
        const clientesAlDia = datos.filter(d => (d.deudaBs || 0) <= 0).length;
        const clientesDeudores = datos.filter(d => (d.deudaBs || 0) > 0).length;

        return {
            totalRegistros: datos.length,
            totalFacturadoBs: parseFloat(totalFacturado.toFixed(2)),
            totalDepositadoBs: parseFloat(totalDepositado.toFixed(2)),
            totalDeudaBs: parseFloat(totalDeuda.toFixed(2)),
            totalFacturadoUSD: parseFloat(totalFacturadoUSD.toFixed(2)),
            totalDepositadoUSD: parseFloat(totalDepositadoUSD.toFixed(2)),
            totalDeudaUSD: parseFloat(totalDeudaUSD.toFixed(2)),
            clientesAlDia,
            clientesDeudores,
            porcentajeRecuperacion: totalFacturado > 0
                ? parseFloat(((totalDepositado / totalFacturado) * 100).toFixed(2))
                : 0
        };
    }

    if (tipo === 'cobranza') {
        const totalCuotasPagadas = datos.reduce((s, d) => s + (d.cuotasPagadas || 0), 0);
        const totalCuotasTotales = datos.reduce((s, d) => s + (d.cuotasTotales || 0), 0);
        const totalDepositadoBs = datos.reduce((s, d) => s + (d.totalDepositadoBs || 0), 0);
        const totalDepositadoUSD = datos.reduce((s, d) => s + (d.totalDepositadoUSD || 0), 0);
        return {
            totalRegistros: datos.length,
            totalCuotasPagadas,
            totalCuotasTotales,
            porcentajeCuotasPagadas: totalCuotasTotales > 0
                ? parseFloat(((totalCuotasPagadas / totalCuotasTotales) * 100).toFixed(2))
                : 0,
            totalDepositadoBs: parseFloat(totalDepositadoBs.toFixed(2)),
            totalDepositadoUSD: parseFloat(totalDepositadoUSD.toFixed(2))
        };
    }

    if (tipo === 'deudores') {
        const totalDeuda = datos.reduce((s, d) => s + (d.deudaBs || 0), 0);
        const totalDeudaUSD = datos.reduce((s, d) => s + (d.deudaUSD || 0), 0);
        const promedioDeuda = datos.length > 0 ? totalDeuda / datos.length : 0;
        const moraPromedio = datos.length > 0
            ? datos.reduce((s, d) => s + (d.diasSinPago || 0), 0) / datos.length
            : 0;
        return {
            totalRegistros: datos.length,
            totalDeudaBs: parseFloat(totalDeuda.toFixed(2)),
            totalDeudaUSD: parseFloat(totalDeudaUSD.toFixed(2)),
            promedioDeudaBs: parseFloat(promedioDeuda.toFixed(2)),
            moraPromedioDias: parseFloat(moraPromedio.toFixed(1))
        };
    }

    if (tipo === 'cuotas') {
        const totalPagos = datos.reduce((s, d) => s + (d.pagos ? d.pagos.length : 0), 0);
        const totalMontoPagadoBs = datos.reduce((s, d) => {
            return s + (d.pagos ? d.pagos.reduce((ps, p) => ps + (p.montoBs || 0), 0) : 0);
        }, 0);
        const totalMontoPagadoUSD = datos.reduce((s, d) => {
            return s + (d.pagos ? d.pagos.reduce((ps, p) => ps + (p.montoUSD || 0), 0) : 0);
        }, 0);
        return {
            totalRegistros: datos.length,
            totalPagosRegistrados: totalPagos,
            totalMontoPagadoBs: parseFloat(totalMontoPagadoBs.toFixed(2)),
            totalMontoPagadoUSD: parseFloat(totalMontoPagadoUSD.toFixed(2))
        };
    }

    return { totalRegistros: datos.length };
}

function calcularDiasMora(fechaFactura, montoDepositados) {
    if (!fechaFactura) return 0;
    const dias = Math.floor((new Date() - new Date(fechaFactura)) / (1000 * 60 * 60 * 24));
    return Math.max(0, dias - 30);
}

function redondearDecimales(valor, decimales = 2) {
    if (typeof valor !== 'number' || isNaN(valor) || !isFinite(valor)) return 0;
    const factor = Math.pow(10, decimales);
    return Math.round((valor + Number.EPSILON) * factor) / factor;
}

// ============================================================
// EXPORTADOR A CSV
// ============================================================
function exportarCSV(res, datos, nombreArchivo) {
    if (datos.length === 0) {
        return res.status(400).json({ exito: false, error: 'No hay datos para exportar' });
    }

    const filasPlanas = datos.map(row => {
        const plano = {};
        for (const key of Object.keys(row)) {
            const val = row[key];
            if (Array.isArray(val)) {
                plano[key] = JSON.stringify(val);
            } else if (typeof val === 'object' && val !== null) {
                plano[key] = JSON.stringify(val);
            } else {
                plano[key] = val;
            }
        }
        return plano;
    });

    const headers = Object.keys(filasPlanas[0]);
    const csv = [
        headers.join(';'),
        ...filasPlanas.map(row => headers.map(h => {
            const val = row[h];
            if (val === null || val === undefined) return '';
            if (typeof val === 'number') return val.toString().replace('.', ',');
            if (typeof val === 'object') return JSON.stringify(val);
            return `"${String(val).replace(/"/g, '""')}"`;
        }).join(';'))
    ].join('\n');

    const bom = '\uFEFF';
    const buffer = Buffer.from(bom + csv, 'utf-8');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}.csv"`);
    res.send(buffer);
}

// ============================================================
// EXPORTADOR A PDF
// ============================================================
function exportarPDF(res, datos, resumen, nombreArchivo) {
    if (datos.length === 0) {
        return res.status(400).json({ exito: false, error: 'No hay datos para exportar' });
    }

    res.json({
        exito: true,
        nota: 'Exportacion PDF requiere jsPDF configurado en el servidor. Use formato "excel" para descarga inmediata.',
        resumen,
        datos
    });
}

module.exports = router;