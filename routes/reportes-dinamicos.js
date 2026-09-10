// ============================================================
// API DE REPORTES DINAMICOS v1.7 — Sistema de Creditos IPSFA
// ============================================================
// Fecha: 2026-09-10
// Cambios v1.7 (migracion canceladas a divisa, v7.1):
//   - REGLA UNIFICADA DE CANCELADA en todos los filtros y reportes:
//     cancelada = (cancelada_fija >= 1) OR (deuda_usd <= 0.01).
//     Las facturas congeladas en la migracion (cancelada_fija = 1)
//     NUNCA aparecen como deudores aunque tengan deuda_usd > 0
//     (a esos clientes no se les cobra el remanente en divisa).
//   - Filtro Estado: aldia = canceladas; deudor/incompleto/sinpago
//     excluyen canceladas. Aplica a Cartera y Cobranza (con y sin
//     filtro de fechas).
//   - Reporte DEUDORES: excluye canceladas y ahora muestra la
//     Deuda (Bs) EN VIVO (factura - inicial - Σ pagos), igual que
//     la lista del sistema. Antes mostraba la columna "deuda"
//     almacenada, que esta OBSOLETA en varias facturas (0 o
//     negativos que no coincidian con el sistema).
//   - Filtros "Deuda Min/Max" ahora operan sobre deuda_usd ($),
//     no sobre la columna Bs obsoleta.
//   - CARTERA: nueva etiqueta de estado "Cancelada" cuando
//     cancelada_fija >= 1; el resumen "al dia" incluye canceladas
//     y se reporta su conteo aparte (clientesCanceladas).
// Cambios v1.6:
//   - FIX filtro "Sin Pago" con rango: la INICIAL (cuota 0) NO esta en
//     la tabla de pagos (vive en inicial_bs/inicial_usd/fecha_inicial
//     del credito), asi que clientes que pagaron SOLO la inicial dentro
//     del rango aparecian como "sin pago". Ahora tambien se excluye
//     quien tenga la inicial pagada con fecha_inicial dentro del rango.
// Cambios v1.5:
//   - CRITERIO "DEUDOR" ahora es Deuda Pendiente en $ (deuda_usd) > 0.
//     Antes se usaba la deuda en Bs (campo deuda). Aplica a: filtro
//     Estado (deudor/aldia/incompleto), reporte DEUDORES, etiqueta
//     de estado en CARTERA y contadores al dia/deudores del resumen.
// Cambios v1.4:
//   - FIX filtro "Sin Pago" con rango de fechas: antes usaba
//     monto_depositados = 0 (historico de por vida) y filtraba por
//     fecha_factura. Ahora, cuando hay fechas, usa NOT EXISTS contra
//     la tabla de pagos real: trae los clientes SIN NINGUN PAGO en el
//     rango seleccionado (y ya no filtra por fecha_factura).
//   - Cobranza con fechas + estado "sinpago": LEFT JOIN + IS NULL
//     (antes INNER JOIN contradecia el filtro y devolvia 0 o datos malos).
// Cambios v1.3:
//   - FIX CRITICO: "Cannot access 'countQuery' before initialization"
//     (error 500 en reporte COBRANZA con filtro de fechas).
//     countQuery/countParams se declaraban con let DESPUES del switch
//     pero el caso 'cobranza' con fechas ya las asignaba dentro del
//     switch (TDZ). Ahora se declaran al inicio de construirQuery().
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

// ------------------------------------------------------------
// v1.7: regla unificada de CANCELADA (la misma que usa el sistema
// en las listas y en routes/reportes.js):
//   cancelada = (cancelada_fija >= 1) OR (deuda_usd <= 0.01)
// cancelada_fija = 1 → congelada en la migracion v7.1 (INTOCABLE,
//   no se le cobra remanente en divisa aunque deuda_usd > 0)
// cancelada_fija = 2 → cancelada por divisa (reabrible)
// La existencia de la columna se detecta una sola vez por proceso
// para no romper nada si la migracion aun no se ha corrido.
// ------------------------------------------------------------
let _cacheColFija = null;
async function existeColumnaCanceladaFija() {
    if (_cacheColFija !== null) return _cacheColFija;
    try {
        const r = await pool.query(
            `SELECT 1 FROM information_schema.columns
             WHERE table_name = 'tienda_caracas' AND column_name = 'cancelada_fija'`
        );
        _cacheColFija = r.rows.length > 0;
    } catch (e) {
        _cacheColFija = false;
    }
    return _cacheColFija;
}

// Expresion SQL "es cancelada" con alias opcional ('c', 't' o '')
function sqlEsCancelada(alias, colFijaExiste) {
    const p = alias ? `${alias}.` : '';
    const partes = [];
    if (colFijaExiste) partes.push(`COALESCE(${p}cancelada_fija, 0) >= 1`);
    partes.push(`COALESCE(${p}deuda_usd, 0) <= 0.01`);
    return '(' + partes.join(' OR ') + ')';
}

// v1.7: Deuda Bs EN VIVO (lo que realmente muestra el sistema):
//   factura - inicial - Σ pagos (monto_bs > 0)
// La columna almacenada "deuda" esta OBSOLETA en varias facturas
// y NO se debe mostrar en reportes.
function sqlDeudaVivaBs(alias, tablaPagos) {
    const p = alias ? `${alias}.` : '';
    return `(COALESCE(${p}monto_factura, 0) - COALESCE(${p}inicial_bs, 0) - COALESCE((SELECT SUM(p2.monto_bs) FROM ${tablaPagos} p2 WHERE p2.factura_id = ${p}id AND COALESCE(p2.monto_bs, 0) > 0), 0))`;
}

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

        const { query, params, countQuery, countParams } = await construirQuery(
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
                const { query, params, countQuery, countParams } = await construirQuery(
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
async function construirQuery(tipo, tabla, filtros, ordenarPor, orden, pagina, porPagina, tiendaKey, sinPaginacion) {
    const where = ['1=1'];
    let params = [];
    let idx = 1;
    // v1.7: existencia de cancelada_fija (detectada 1 vez por proceso)
    const colFija = await existeColumnaCanceladaFija();
    const esCanc = sqlEsCancelada('', colFija);
    // FIX v1.3: declarar AQUI (antes del switch). El caso 'cobranza'
    // con filtro de fechas las asigna dentro del switch; si se declaran
    // con let al final de la funcion, esa asignacion cae en la TDZ y
    // Node lanza "Cannot access 'countQuery' before initialization".
    let countQuery = null;
    let countParams = null;

    // FIX v1.4: "Sin Pago" + rango de fechas = clientes SIN NINGUN PAGO
    // en ese rango (segun la tabla de pagos real). En ese caso NO se
    // filtra por fecha_factura: lo que importa es la fecha del PAGO.
    const hayRangoFechas = !!(filtros.fechaDesde || filtros.fechaHasta);
    const sinPagoConRango = filtros.estado === 'sinpago' && hayRangoFechas;

    if (filtros.fechaDesde && !sinPagoConRango) {
        where.push(`fecha_factura >= $${idx++}`);
        params.push(filtros.fechaDesde);
    }

    if (filtros.fechaHasta && !sinPagoConRango) {
        where.push(`fecha_factura <= $${idx++}`);
        params.push(filtros.fechaHasta);
    }

    if (filtros.estado && filtros.estado !== 'todos') {
        switch (filtros.estado) {
            case 'aldia':
                // v1.7: al dia = CANCELADA (marca congelada >= 1 o deuda_usd <= 0.01)
                where.push(esCanc);
                break;
            case 'deudor':
                // v1.7: deudor = NO cancelada (excluye congeladas de la migracion)
                where.push(`NOT ${esCanc}`);
                break;
            case 'incompleto':
                // v1.7: incompleto = NO cancelada y con al menos un pago
                where.push(`NOT ${esCanc} AND COALESCE(monto_depositados, 0) > 0`);
                break;
            case 'sinpago':
                // v1.7: una cancelada NUNCA es un "sin pago" pendiente
                where.push(`NOT ${esCanc}`);
                if (hayRangoFechas) {
                    // v1.4: sin pagos EN EL RANGO, verificado contra la
                    // tabla de pagos real (fuente de verdad).
                    // OJO: el reporte 'cuotas' usa alias "t" para la tabla.
                    const tablaPagosSP = TABLAS_PAGOS[tiendaKey];
                    const refExterna = (tipo === 'cuotas') ? 't' : tabla;
                    const condsPago = [];
                    if (filtros.fechaDesde) {
                        condsPago.push(`p.fecha >= $${idx++}`);
                        params.push(filtros.fechaDesde);
                    }
                    if (filtros.fechaHasta) {
                        condsPago.push(`p.fecha <= $${idx++}`);
                        params.push(filtros.fechaHasta);
                    }
                    where.push(`NOT EXISTS (SELECT 1 FROM ${tablaPagosSP} p WHERE p.factura_id = ${refExterna}.id AND ${condsPago.join(' AND ')})`);

                    // v1.6: la INICIAL (cuota 0) tambien cuenta como pago,
                    // pero NO esta en la tabla de pagos: vive en el propio
                    // credito. Si fecha_inicial cae en el rango y el monto
                    // de la inicial es > 0, el cliente SI pago en el rango.
                    const condsInicial = [
                        `(COALESCE(${refExterna}.inicial_bs, 0) > 0 OR COALESCE(${refExterna}.inicial_usd, 0) > 0)`,
                        `${refExterna}.fecha_inicial IS NOT NULL`
                    ];
                    if (filtros.fechaDesde) {
                        condsInicial.push(`${refExterna}.fecha_inicial >= $${idx++}`);
                        params.push(filtros.fechaDesde);
                    }
                    if (filtros.fechaHasta) {
                        condsInicial.push(`${refExterna}.fecha_inicial <= $${idx++}`);
                        params.push(filtros.fechaHasta);
                    }
                    where.push(`NOT (${condsInicial.join(' AND ')})`);
                } else {
                    // Sin rango de fechas: comportamiento original
                    // (nunca ha depositado nada).
                    where.push('COALESCE(monto_depositados, 0) = 0');
                }
                break;
        }
    }

    // v1.7: Deuda Min/Max operan sobre deuda_usd ($). La columna "deuda"
    // en Bs esta obsoleta y no es criterio de cobranza.
    if (filtros.minDeuda !== undefined && filtros.minDeuda !== null && filtros.minDeuda !== '') {
        where.push(`COALESCE(deuda_usd, 0) >= $${idx++}`);
        params.push(parseFloat(filtros.minDeuda));
    }

    if (filtros.maxDeuda !== undefined && filtros.maxDeuda !== null && filtros.maxDeuda !== '') {
        where.push(`COALESCE(deuda_usd, 0) <= $${idx++}`);
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
        deuda: 'deuda_usd',
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
                      numero_cuenta, banco, created_at,
                      ${colFija ? 'cancelada_fija' : '0 AS cancelada_fija'},
                      ${sqlDeudaVivaBs('', TABLAS_PAGOS[tiendaKey])} AS deuda_viva_bs
                      FROM ${tabla} WHERE ${whereClause} ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            params.push(limit, offset);
            break;

        case 'cobranza': {
            const tablaPagos = TABLAS_PAGOS[tiendaKey];
            const hayFechasPagos = filtros.fechaDesde || filtros.fechaHasta;

            if (hayFechasPagos) {
                // ── COBRANZA CON FILTRO DE FECHAS: filtra por fecha DE PAGO ──
                let pCond = [];
                let pIdx = 1;
                let pParams = [];
                if (filtros.fechaDesde) { pCond.push(`fecha >= $${pIdx++}`); pParams.push(filtros.fechaDesde); }
                if (filtros.fechaHasta) { pCond.push(`fecha <= $${pIdx++}`); pParams.push(filtros.fechaHasta); }
                const pWhere = pCond.length > 0 ? 'WHERE ' + pCond.join(' AND ') : '';

                // WHERE principal (sin fechas de factura)
                let whereCobranza = ['1=1'];
                let paramsCobranza = [];
                let cIdx = pParams.length + 1;

                // v1.4: "sinpago" con rango = clientes SIN pagos en el
                // rango. Se implementa con LEFT JOIN + IS NULL mas abajo;
                // aqui NO se agrega condicion de estado (el INNER JOIN
                // original contradecia el filtro).
                const esSinPagoRango = filtros.estado === 'sinpago';

                const esCancC = sqlEsCancelada('c', colFija);
                if (filtros.estado && filtros.estado !== 'todos' && !esSinPagoRango) {
                    switch (filtros.estado) {
                        // v1.7: criterio unificado de cancelada
                        case 'aldia': whereCobranza.push(esCancC); break;
                        case 'deudor': whereCobranza.push(`NOT ${esCancC}`); break;
                        case 'incompleto': whereCobranza.push(`NOT ${esCancC} AND COALESCE(c.monto_depositados, 0) > 0`); break;
                    }
                }

                // v1.6: la INICIAL (cuota 0) no esta en la tabla de pagos;
                // si cayo dentro del rango, el cliente SI pago y debe
                // excluirse del reporte "sin pago".
                if (esSinPagoRango) {
                    // v1.7: una cancelada NUNCA es un "sin pago" pendiente
                    whereCobranza.push(`NOT ${esCancC}`);
                    const iniConds = [
                        '(COALESCE(c.inicial_bs, 0) > 0 OR COALESCE(c.inicial_usd, 0) > 0)',
                        'c.fecha_inicial IS NOT NULL'
                    ];
                    if (filtros.fechaDesde) {
                        iniConds.push(`c.fecha_inicial >= $${cIdx++}`);
                        paramsCobranza.push(filtros.fechaDesde);
                    }
                    if (filtros.fechaHasta) {
                        iniConds.push(`c.fecha_inicial <= $${cIdx++}`);
                        paramsCobranza.push(filtros.fechaHasta);
                    }
                    whereCobranza.push(`NOT (${iniConds.join(' AND ')})`);
                }
                // v1.7: Deuda Min/Max en $ (deuda_usd), no en la columna Bs obsoleta
                if (filtros.minDeuda !== undefined && filtros.minDeuda !== null && filtros.minDeuda !== '') {
                    whereCobranza.push(`COALESCE(c.deuda_usd, 0) >= $${cIdx++}`);
                    paramsCobranza.push(parseFloat(filtros.minDeuda));
                }
                if (filtros.maxDeuda !== undefined && filtros.maxDeuda !== null && filtros.maxDeuda !== '') {
                    whereCobranza.push(`COALESCE(c.deuda_usd, 0) <= $${cIdx++}`);
                    paramsCobranza.push(parseFloat(filtros.maxDeuda));
                }
                if (filtros.busqueda) {
                    whereCobranza.push(`(c.nombre_apellido ILIKE $${cIdx} OR c.cedula ILIKE $${cIdx})`);
                    paramsCobranza.push(`%${filtros.busqueda}%`);
                    cIdx++;
                }

                const whereCobranzaStr = whereCobranza.join(' AND ');
                const _offset = sinPaginacion ? 0 : (parseInt(pagina) - 1) * parseInt(porPagina);
                const _limit = sinPaginacion ? 10000 : parseInt(porPagina);

                // v1.4: sinpago = LEFT JOIN y quedarse con los que NO
                // tienen pagos en el rango (p.factura_id IS NULL)
                const joinTipo = esSinPagoRango ? 'LEFT JOIN' : 'INNER JOIN';
                const condSinPago = esSinPagoRango ? 'AND p.factura_id IS NULL' : '';

                query = `
                    WITH pagos_filtrados AS (
                        SELECT factura_id, COUNT(*) as cantidad,
                               SUM(monto_bs) as monto_total_bs, SUM(monto_usd) as monto_total_usd
                        FROM ${tablaPagos}
                        ${pWhere}
                        GROUP BY factura_id
                    )
                    SELECT c.id, c.nro_factura, c.nombre_apellido, c.cedula,
                      c.monto_factura, c.monto_facturado_divisa, c.cuotas,
                      COALESCE(p.cantidad, 0) as cuotas_pagadas_rango,
                      COALESCE(p.monto_total_bs, 0) as depositado_rango_bs,
                      COALESCE(p.monto_total_usd, 0) as depositado_rango_usd,
                      c.deuda, c.deuda_usd, c.fecha_factura,
                      c.monto_depositados as total_depositado_historico,
                      c.cuotas_pagadas as cuotas_pagadas_historico,
                      ${colFija ? 'c.cancelada_fija' : '0 AS cancelada_fija'},
                      ${sqlDeudaVivaBs('c', tablaPagos)} AS deuda_viva_bs
                    FROM ${tabla} c
                    ${joinTipo} pagos_filtrados p ON c.id = p.factura_id
                    WHERE ${whereCobranzaStr} ${condSinPago}
                    ORDER BY ${colOrden} ${dirOrden}
                    LIMIT $${cIdx++} OFFSET $${cIdx++}`;

                const allParams = [...pParams, ...paramsCobranza, _limit, _offset];

                const countQueryStr = `
                    WITH pagos_filtrados AS (
                        SELECT factura_id
                        FROM ${tablaPagos}
                        ${pWhere}
                        GROUP BY factura_id
                    )
                    SELECT COUNT(*) FROM ${tabla} c
                    ${joinTipo} pagos_filtrados p ON c.id = p.factura_id
                    WHERE ${whereCobranzaStr} ${condSinPago}`;

                const countParamsArr = [...pParams, ...paramsCobranza];

                // Asignar a las variables let del scope padre
                params = allParams;
                countQuery = countQueryStr;
                countParams = countParamsArr;

            } else {
                // ── COBRANZA SIN FECHAS: comportamiento original ──
                query = `SELECT id, nro_factura, nombre_apellido, cedula,
                          monto_depositados, deuda, fecha_factura, cuotas, cuotas_pagadas,
                          monto_factura, monto_facturado_divisa, total_depositado_usd, deuda_usd,
                          ${colFija ? 'cancelada_fija' : '0 AS cancelada_fija'},
                          ${sqlDeudaVivaBs('', TABLAS_PAGOS[tiendaKey])} AS deuda_viva_bs
                          FROM ${tabla} WHERE ${whereClause} ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
                params.push(limit, offset);
            }
            break;
        }

        case 'deudores':
            // v1.7: NOT esCanc ya implica deuda_usd > 0.01 Y excluye las
            // congeladas (cancelada_fija >= 1). deuda_viva_bs = lo que el
            // sistema muestra en vivo (factura - inicial - Σ pagos).
            query = `SELECT id, nro_factura, nombre_apellido, cedula,
                      monto_factura, monto_depositados, deuda, fecha_factura,
                      monto_facturado_divisa, total_depositado_usd, deuda_usd,
                      cuotas, monto_cuota_usd, cuotas_pagadas,
                      telefono, numero_cuenta, banco,
                      ${colFija ? 'cancelada_fija' : '0 AS cancelada_fija'},
                      ${sqlDeudaVivaBs('', TABLAS_PAGOS[tiendaKey])} AS deuda_viva_bs
                      FROM ${tabla} WHERE ${whereClause} AND NOT ${esCanc}
                      ORDER BY ${colOrden} ${dirOrden} LIMIT $${idx++} OFFSET $${idx++}`;
            // v1.7 FIX: el COUNT debe repetir el filtro de deudor,
            // si no totalRegistros/paginas salen inflados.
            countQuery = `SELECT COUNT(*) FROM ${tabla} WHERE ${whereClause} AND NOT ${esCanc}`;
            countParams = params.slice();
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

    // Valores por defecto para el COUNT: solo si el caso (ej. cobranza
    // con fechas) no asigno ya su propio countQuery/countParams.
    if (countQuery === null) {
        countQuery = `SELECT COUNT(*) FROM ${tabla} WHERE ${whereClause}`;
        countParams = params.slice(0, params.length - 2);
    }

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
                // v1.7: deuda Bs EN VIVO (la columna "deuda" esta obsoleta)
                const deudaBs = r.deuda_viva_bs !== undefined && r.deuda_viva_bs !== null
                    ? parseFloat(r.deuda_viva_bs) || 0
                    : parseFloat(r.deuda) || 0;
                const fija = parseInt(r.cancelada_fija) || 0;

                return {
                    id: r.id,
                    factura: r.nro_factura,
                    cliente: r.nombre_apellido,
                    cedula: r.cedula,
                    telefono: r.telefono,
                    montoBs: parseFloat(r.monto_factura) || 0,
                    depositadoBs: parseFloat(r.monto_depositados) || 0,
                    deudaBs: deudaBs,
                    // v1.7: Cancelada si tiene marca congelada; si no, se
                    // decide por Deuda Pendiente ($) con tolerancia 0.01
                    estado: fija >= 1 ? 'Cancelada' : (deudaUSD <= 0.01 ? 'Al dia' : 'Deudor'),
                    canceladaFija: fija,
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
                const enRango = r.depositado_rango_bs !== undefined;
                const cuotasPagadas = enRango
                    ? parseInt(r.cuotas_pagadas_rango) || 0
                    : parseInt(r.cuotas_pagadas) || 0;
                const depositadoBs = enRango
                    ? parseFloat(r.depositado_rango_bs) || 0
                    : parseFloat(r.monto_depositados) || 0;
                const depositadoUSD = enRango
                    ? parseFloat(r.depositado_rango_usd) || 0
                    : parseFloat(r.total_depositado_usd) || 0;
                const montoFactura = parseFloat(r.monto_factura) || 0;
                const porcentajePagado = montoFactura > 0
                    ? parseFloat(((depositadoBs / montoFactura) * 100).toFixed(2))
                    : 0;
                return {
                    id: r.id,
                    factura: r.nro_factura,
                    cliente: r.nombre_apellido,
                    cedula: r.cedula,
                    cuotasPagadas,
                    cuotasTotales,
                    porcentajePagado,
                    totalDepositadoBs: depositadoBs,
                    totalDepositadoUSD: depositadoUSD,
                    // v1.7: deuda Bs EN VIVO (la columna "deuda" esta obsoleta)
                    deudaRestanteBs: r.deuda_viva_bs !== undefined && r.deuda_viva_bs !== null
                        ? parseFloat(r.deuda_viva_bs) || 0
                        : parseFloat(r.deuda) || 0,
                    deudaRestanteUSD: parseFloat(r.deuda_usd) || 0,
                    montoFacturaBs: montoFactura,
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
                    // v1.7: deuda Bs EN VIVO (la columna "deuda" esta obsoleta)
                    deudaBs: r.deuda_viva_bs !== undefined && r.deuda_viva_bs !== null
                        ? parseFloat(r.deuda_viva_bs) || 0
                        : parseFloat(r.deuda) || 0,
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
        // v1.7: contadores por etiqueta de estado. "Al dia" incluye las
        // canceladas (congeladas por migracion o pagadas en divisa).
        const clientesAlDia = datos.filter(d => d.estado === 'Al dia' || d.estado === 'Cancelada').length;
        const clientesDeudores = datos.filter(d => d.estado === 'Deudor').length;
        const clientesCanceladas = datos.filter(d => d.estado === 'Cancelada').length;

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
            clientesCanceladas,
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
        const totalEsperadoBs = datos.reduce((s, d) => s + (d.montoFacturaBs || 0), 0);
        const totalPendienteBs = datos.reduce((s, d) => s + (d.deudaRestanteBs || 0), 0);
        return {
            totalRegistros: datos.length,
            totalCuotasPagadas,
            totalCuotasTotales,
            porcentajeCuotasPagadas: totalCuotasTotales > 0
                ? parseFloat(((totalCuotasPagadas / totalCuotasTotales) * 100).toFixed(2))
                : 0,
            totalDepositadoBs: parseFloat(totalDepositadoBs.toFixed(2)),
            totalDepositadoUSD: parseFloat(totalDepositadoUSD.toFixed(2)),
            totalEsperadoBs: parseFloat(totalEsperadoBs.toFixed(2)),
            totalPendienteBs: parseFloat(totalPendienteBs.toFixed(2)),
            porcentajeCobrado: totalEsperadoBs > 0
                ? parseFloat(((totalDepositadoBs / totalEsperadoBs) * 100).toFixed(2))
                : 0
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