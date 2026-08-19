// ============================================================
// RUTAS GENERICAS DE TIENDAS - CRUD unificado  (v6.10.1)
// ============================================================
// Cambios v6.10.1:
//   - SIEMPRE recalcula y guarda totales desde la tabla de pagos
//   - No confía en los valores enviados por el frontend
//   - Previene datos corruptos como deuda_usd negativo o inconsistente
//   - Sanea valores NULL y NaN antes de guardar
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { validarTienda } = require('../middleware/validarTienda');
const { toUpperCaseFields } = require('../utils/uppercase');

// ------------------------------------------------------------
// WHITELIST DE TIENDAS
// ------------------------------------------------------------
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

const MAX_CUOTAS_PLANAS = 11;
const TOLERANCIA_CERO = 0.01;

// ------------------------------------------------------------
// Campos permitidos en INSERT/UPDATE
// ------------------------------------------------------------
const CAMPOS_BASE = [
  'nro_factura', 'nombre_apellido', 'monto_factura', 'fecha_factura',
  'cedula', 'telefono', 'monto_facturado_divisa', 'dolar_facturado', 'cuotas',
  'monto_pendiente', 'monto_depositados', 'deuda',
  'numero_cuenta', 'banco',
  'inicial_bs', 'inicial_usd', 'ref_inicial', 'fecha_inicial',
  'tasa_inicial', 'tasa_bcv_factura', 'monto_cuota_usd',
  'total_depositado_usd', 'deuda_usd', 'cuotas_pagadas', 'proxima_cuota',
  'discrepancias_cuotas', 'deuda_remanente'
];

const CAMPOS_CUOTAS = [];
for (let i = 1; i <= MAX_CUOTAS_PLANAS; i++) {
  CAMPOS_CUOTAS.push(
    `cuota_${i}`, `ref_cuota_${i}`, `fecha_cuota_${i}`,
    `tasa_cuota_${i}`, `dolar_depositado_cuota_${i}`
  );
}

// Campos que SIEMPRE son calculados por el backend (no se aceptan del frontend)
const CAMPOS_CALCULADOS = [
  'total_depositado_usd', 'deuda_usd', 'monto_depositados', 
  'deuda', 'cuotas_pagadas', 'proxima_cuota', 'discrepancias_cuotas'
];

const ALLOWED_FIELDS_UPDATE = CAMPOS_BASE.filter(f => f !== 'cuotas');
const ALLOWED_FIELDS_INSERT = ['numero', 'cuotas', ...ALLOWED_FIELDS_UPDATE];

const DATE_FIELDS = ['fecha_factura', 'fecha_inicial', ...Array.from({ length: MAX_CUOTAS_PLANAS }, (_, i) => `fecha_cuota_${i + 1}`)];

const UPPERCASE_FIELDS = [
  'nro_factura', 'nombre_apellido', 'cedula', 'telefono',
  'banco', 'numero_cuenta', 'ref_inicial'
];
for (let i = 1; i <= MAX_CUOTAS_PLANAS; i++) {
  UPPERCASE_FIELDS.push(`ref_cuota_${i}`);
}

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const toNullIfEmpty = (val) => {
  if (val === undefined || val === null || val === '' || val === 'null' || val === 'undefined') {
    return null;
  }
  if (typeof val === 'number' && isNaN(val)) {
    return null;
  }
  return val;
};

const toDateOrNull = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined' || val === 'Invalid date') {
    return null;
  }
  if (val instanceof Date) {
    return val.toISOString().split('T')[0];
  }
  if (typeof val === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(val)) {
    return val;
  }
  const d = new Date(val);
  if (!isNaN(d.getTime())) {
    return d.toISOString().split('T')[0];
  }
  return val;
};

function redondearDecimales(valor, decimales = 2) {
  if (typeof valor !== 'number' || isNaN(valor) || !isFinite(valor)) return 0;
  const factor = Math.pow(10, decimales);
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

function sanearNumero(valor) {
  const num = parseFloat(valor);
  if (isNaN(num) || !isFinite(num)) return 0;
  return redondearDecimales(num);
}

// ------------------------------------------------------------
// Middleware interno: valida :tienda contra la whitelist
// ------------------------------------------------------------
function validarTiendaInterno(req, res, next) {
  const tabla = TIENDAS[req.params.tienda];
  if (!tabla) {
    return res.status(400).json({
      error: 'Tienda no valida',
      tiendas_disponibles: Object.keys(TIENDAS)
    });
  }
  if (req.usuario && req.usuario.rol === 'operador' && req.usuario.tienda
      && req.params.tienda !== req.usuario.tienda) {
    return res.status(403).json({ error: 'No tiene acceso a esta tienda' });
  }
  req.tablaTienda = tabla;
  req.tablaPagos = TABLAS_PAGOS[req.params.tienda];
  req.tienda = req.params.tienda;
  next();
}

// ------------------------------------------------------------
// Handlers
// ------------------------------------------------------------
async function listarClientes(req, res) {
  try {
    const result = await pool.query(`
      SELECT t.*,
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
          )
          FROM ${req.tablaPagos} p WHERE p.factura_id = t.id),
          '[]'::json
        ) as pagos_extra
      FROM ${req.tablaTienda} t
      ORDER BY t.id
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(`Error al obtener datos de ${req.tablaTienda}:`, error);
    res.status(500).json({ error: 'Error al obtener datos', details: error.message });
  }
}

async function obtenerCliente(req, res) {
  try {
    const { id } = req.params;

    const result = await pool.query(`SELECT * FROM ${req.tablaTienda} WHERE id = $1`, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const cliente = result.rows[0];

    try {
      const pagosResult = await pool.query(
        `SELECT nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd 
         FROM ${req.tablaPagos} 
         WHERE factura_id = $1 
         ORDER BY nro_cuota ASC`,
        [id]
      );
      cliente.pagos_extra = pagosResult.rows;
    } catch (pagosErr) {
      console.warn(`[v6.8] Tabla ${req.tablaPagos} no existe o error:`, pagosErr.message);
      cliente.pagos_extra = [];
    }

    res.json(cliente);
  } catch (error) {
    console.error(`Error al obtener cliente (${req.tablaTienda}):`, error);
    res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
  }
}

async function crearCliente(req, res) {
  try {
    const data = toUpperCaseFields(req.body, UPPERCASE_FIELDS);

    if (!data.nro_factura || data.nro_factura.toString().trim() === '') {
      return res.status(400).json({ error: 'N de factura es obligatorio' });
    }
    if (!data.monto_factura || parseFloat(data.monto_factura) <= 0) {
      return res.status(400).json({ error: 'Monto de factura debe ser mayor a cero' });
    }

    const montoFactura = parseFloat(data.monto_factura);
    const inicialBs = data.inicial_bs !== undefined ? parseFloat(data.inicial_bs) : null;

    if (inicialBs !== null) {
      if (inicialBs <= 0) {
        return res.status(400).json({ error: 'Inicial debe ser mayor a cero' });
      }
      if (inicialBs > montoFactura) {
        return res.status(400).json({ error: 'Inicial no puede superar el monto total' });
      }
    }

    const cuotas = parseInt(data.cuotas);
    if (isNaN(cuotas) || cuotas < 1 || cuotas > 30) {
      return res.status(400).json({ error: 'Cuotas debe ser un numero entero entre 1 y 30' });
    }

    if (data.fecha_inicial && data.fecha_factura) {
      if (new Date(data.fecha_inicial) < new Date(data.fecha_factura)) {
        return res.status(400).json({ error: 'Fecha de inicial no puede ser anterior a la fecha de la factura' });
      }
    }

    const tasaFactura = parseFloat(data.tasa_bcv_factura);
    const tasaInicial = parseFloat(data.tasa_inicial);
    if (tasaFactura !== undefined && !isNaN(tasaFactura)) {
      if (tasaFactura <= 0.0001 || tasaFactura > 10000) {
        return res.status(400).json({ error: 'Tasa BCV de factura fuera de rango (0.0001 - 10000)' });
      }
    }
    if (tasaInicial !== undefined && !isNaN(tasaInicial)) {
      if (tasaInicial <= 0.0001 || tasaInicial > 10000) {
        return res.status(400).json({ error: 'Tasa BCV de inicial fuera de rango (0.0001 - 10000)' });
      }
    }

    const tolerancia = 0.01;
    if (data.monto_facturado_divisa !== undefined && tasaFactura > 0) {
      const calculadoMontoUSD = redondearDecimales(montoFactura / tasaFactura);
      if (Math.abs(calculadoMontoUSD - parseFloat(data.monto_facturado_divisa)) > tolerancia) {
        return res.status(400).json({ error: 'Calculo de monto en $ incorrecto' });
      }
    }
    if (inicialBs !== null && tasaInicial > 0 && data.inicial_usd !== undefined) {
      const calculadoInicialUSD = redondearDecimales(inicialBs / tasaInicial);
      if (Math.abs(calculadoInicialUSD - parseFloat(data.inicial_usd)) > tolerancia) {
        return res.status(400).json({ error: 'Calculo de inicial en $ incorrecto' });
      }
    }
    if (data.monto_cuota_usd !== undefined && data.monto_facturado_divisa !== undefined && data.inicial_usd !== undefined) {
      const deudaUSD = redondearDecimales(parseFloat(data.monto_facturado_divisa) - parseFloat(data.inicial_usd));
      const calculadoCuotaUSD = redondearDecimales(deudaUSD / cuotas);
      if (Math.abs(calculadoCuotaUSD - parseFloat(data.monto_cuota_usd)) > tolerancia) {
        return res.status(400).json({ error: 'Calculo de cuota incorrecto' });
      }
    }

    if (data.telefono && data.telefono.toString().trim() !== '') {
      const telefonoRegex = /^(0?4[0-9]{2}-?[0-9]{7}|\+58 ?0?4[0-9]{2}-?[0-9]{7})$/;
      if (!telefonoRegex.test(data.telefono.toString().trim())) {
        return res.status(400).json({ error: 'Formato de telefono invalido. Ej: 0412-1234567 o +58 412-1234567' });
      }
    }

    const checkFactura = await pool.query(
      `SELECT id FROM ${req.tablaTienda} WHERE nro_factura = $1`,
      [data.nro_factura]
    );
    if (checkFactura.rows.length > 0) {
      return res.status(400).json({ error: 'N de factura ya existe en esta tienda' });
    }

    let cedulaAdvertencia = null;
    if (data.cedula && data.cedula.toString().trim() !== '') {
      const checkCedula = await pool.query(
        `SELECT id, nro_factura FROM ${req.tablaTienda} WHERE cedula = $1`,
        [data.cedula.toString().trim()]
      );
      if (checkCedula.rows.length > 0) {
        cedulaAdvertencia = {
          mensaje: `Esta cedula ya tiene ${checkCedula.rows.length} factura(s) en esta tienda`,
          facturas: checkCedula.rows.map(r => r.nro_factura)
        };
      }
    }

    const fields = [];
    const values = [];

    for (const field of ALLOWED_FIELDS_INSERT) {
      if (data[field] !== undefined) {
        fields.push(field);
        values.push(DATE_FIELDS.includes(field) ? toDateOrNull(data[field]) : toNullIfEmpty(data[field]));
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No hay campos para crear' });
    }

    const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
    const query = `INSERT INTO ${req.tablaTienda} (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const result = await pool.query(query, values);
    const registroId = result.rows[0].id;

    let detallesJson = '{}';
    try {
      detallesJson = JSON.stringify({
        nro_factura: data.nro_factura,
        monto_factura: data.monto_factura,
        inicial_bs: data.inicial_bs,
        tienda: req.tienda
      });
    } catch (e) {
      detallesJson = JSON.stringify({ error: 'No se pudieron serializar los detalles' });
    }

    try {
      await pool.query(`
        INSERT INTO auditoria_usuarios (
          usuario_id, accion, tabla, registro_id, detalles, ip, user_agent, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
      `, [
        req.usuario.id,
        'CREAR_REGISTRO_CONCILIACION',
        req.tablaTienda,
        registroId,
        detallesJson,
        req.ip || req.connection?.remoteAddress || req.socket?.remoteAddress || 'unknown',
        req.headers['user-agent'] || ''
      ]);
    } catch (auditErr) {
      console.warn('Error registrando auditoria:', auditErr.message);
    }

    res.status(201).json({
      success: true,
      message: 'Cliente creado',
      data: result.rows[0],
      advertencia: cedulaAdvertencia
    });

  } catch (error) {
    console.error(`Error al crear cliente (${req.tablaTienda}):`, error);
    res.status(500).json({ error: 'Error al crear cliente', details: error.message });
  }
}

// ============================================================
// PUT /api/tiendas/:tienda/:id  —  CORREGIDO v6.10.1
// ============================================================
async function actualizarCliente(req, res) {
  try {
    const { id } = req.params;
    const data = toUpperCaseFields(req.body, UPPERCASE_FIELDS);

    // 1. Obtener datos actuales del cliente
    const clienteActual = await pool.query(
      `SELECT * FROM ${req.tablaTienda} WHERE id = $1`, [id]
    );
    if (clienteActual.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    const cliente = clienteActual.rows[0];

    // 2. Procesar pagos_extra: insertar/actualizar en tabla de pagos
    const pagosExtra = data.pagos_extra || [];
    const tablaPagos = req.tablaPagos;

    // 2a. Eliminar cuotas marcadas
    if (data.eliminar_cuotas && Array.isArray(data.eliminar_cuotas)) {
      for (const nroCuota of data.eliminar_cuotas) {
        await pool.query(
          `DELETE FROM ${tablaPagos} WHERE factura_id = $1 AND nro_cuota = $2`,
          [id, nroCuota]
        );
      }
    }

    // 2b. Insertar/actualizar cada cuota en la tabla de pagos
    for (const pago of pagosExtra) {
      const nroCuota = parseInt(pago.nro_cuota);
      const montoBs = sanearNumero(pago.monto_bs);
      const referencia = (pago.referencia || '').toString().trim();
      const fecha = toDateOrNull(pago.fecha);
      const tasaBcv = sanearNumero(pago.tasa_bcv);
      const montoUsd = sanearNumero(pago.monto_usd);

      if (montoBs > 0) {
        await pool.query(`
          INSERT INTO ${tablaPagos} (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd, updated_at)
          VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
          ON CONFLICT (factura_id, nro_cuota) 
          DO UPDATE SET 
            monto_bs = EXCLUDED.monto_bs,
            referencia = EXCLUDED.referencia,
            fecha = EXCLUDED.fecha,
            tasa_bcv = EXCLUDED.tasa_bcv,
            monto_usd = EXCLUDED.monto_usd,
            updated_at = NOW()
        `, [id, nroCuota, montoBs, referencia, fecha, tasaBcv, montoUsd]);
      }
    }

    // ============================================================
    // 3. RECALCULAR TOTALES DESDE CERO (siempre, sin importar el frontend)
    // ============================================================
    let totalDepositadoBs = 0;
    let totalDepositadoUSD = 0;
    let cuotasPagadas = 0;

    // Leer TODOS los pagos de la tabla de pagos
    try {
      const pagosResult = await pool.query(
        `SELECT monto_bs, monto_usd FROM ${req.tablaPagos} WHERE factura_id = $1`,
        [id]
      );
      for (const pago of pagosResult.rows) {
        const montoBs = sanearNumero(pago.monto_bs);
        const montoUsd = sanearNumero(pago.monto_usd);
        if (montoBs > 0) {
          totalDepositadoBs += montoBs;
          totalDepositadoUSD += montoUsd;
          cuotasPagadas++;
        }
      }
    } catch (e) {
      console.warn(`[v6.10.1] Error leyendo pagos de ${req.tablaPagos}:`, e.message);
    }

    // FALLBACK: si no hay pagos en tabla de pagos, leer columnas planas legacy
    if (totalDepositadoBs === 0 && cuotasPagadas === 0) {
      console.log(`[v6.10.1] Fallback: leyendo columnas planas legacy para factura_id=${id}`);
      for (let i = 1; i <= MAX_CUOTAS_PLANAS; i++) {
        const cuotaBs = sanearNumero(cliente[`cuota_${i}`]);
        const dolarCuota = sanearNumero(cliente[`dolar_depositado_cuota_${i}`]);
        if (cuotaBs > 0) {
          totalDepositadoBs += cuotaBs;
          totalDepositadoUSD += dolarCuota;
          cuotasPagadas++;
        }
      }
    }

    // 4. Incluir inicial en totales
    const inicialBs = sanearNumero(cliente.inicial_bs);
    const inicialUSD = sanearNumero(cliente.inicial_usd);
    const esNuevo = inicialBs > 0;
    if (esNuevo) {
      totalDepositadoBs += inicialBs;
      totalDepositadoUSD += inicialUSD;
    }

    // 5. Calcular deuda pendiente
    const montoFactura = sanearNumero(cliente.monto_factura);
    const montoFacturadoDivisa = sanearNumero(cliente.monto_facturado_divisa);
    const deudaPendienteBs = redondearDecimales(montoFactura - totalDepositadoBs);
    const deudaPendienteUSD = redondearDecimales(montoFacturadoDivisa - totalDepositadoUSD);

    // Si la deuda es muy pequeña (por redondeo), ponerla a 0
    const deudaFinalBs = Math.abs(deudaPendienteBs) < TOLERANCIA_CERO ? 0 : deudaPendienteBs;
    const deudaFinalUSD = Math.abs(deudaPendienteUSD) < TOLERANCIA_CERO ? 0 : deudaPendienteUSD;

    // 6. Calcular proxima cuota
    const montoCuotaUSD = sanearNumero(cliente.monto_cuota_usd);
    const proximaCuota = Math.min(montoCuotaUSD, Math.max(0, deudaFinalUSD));

    // 7. Calcular discrepancias desde tabla de pagos
    const totalCuotas = parseInt(cliente.cuotas) || 4;
    let discrepancias = {};

    try {
      const pagosResult = await pool.query(
        `SELECT nro_cuota, monto_usd FROM ${req.tablaPagos} WHERE factura_id = $1 ORDER BY nro_cuota`,
        [id]
      );
      for (const pago of pagosResult.rows) {
        const nroCuota = parseInt(pago.nro_cuota);
        const dolarRecibido = sanearNumero(pago.monto_usd);
        if (dolarRecibido > 0) {
          const esUltimaPagada = nroCuota === cuotasPagadas && nroCuota === totalCuotas;
          let esperado = montoCuotaUSD;
          if (esUltimaPagada && montoCuotaUSD > 0) {
            const acumuladoAnterior = redondearDecimales(montoCuotaUSD * (totalCuotas - 1));
            const deudaTotal = montoFacturadoDivisa - inicialUSD;
            esperado = redondearDecimales(deudaTotal - acumuladoAnterior);
          }
          const diferencia = redondearDecimales(esperado - dolarRecibido);
          if (diferencia > 0.01) {
            discrepancias[nroCuota] = { 
              esperado: redondearDecimales(esperado), 
              recibido: dolarRecibido, 
              diferencia: redondearDecimales(diferencia) 
            };
          }
        }
      }
    } catch (e) {
      console.warn(`[v6.10.1] Error calculando discrepancias:`, e.message);
    }

    // Limitar discrepancias a 10
    const discrepanciasKeys = Object.keys(discrepancias);
    if (discrepanciasKeys.length > 10) {
      const sortedKeys = discrepanciasKeys.map(k => parseInt(k)).sort((a, b) => b - a).slice(0, 10);
      const limited = {};
      sortedKeys.forEach(k => { limited[k] = discrepancias[k]; });
      discrepancias = limited;
    }

    // ============================================================
    // 8. CONSTRUIR UPDATE - SIEMPRE guardar valores recalculados
    // ============================================================
    
    // Eliminar campos calculados del payload (NO confiar en el frontend)
    for (const campo of CAMPOS_CALCULADOS) {
      delete data[campo];
    }
    // También eliminar estos campos que no deben actualizarse
    delete data.nro_factura;
    delete data.numero;
    delete data.created_at;
    delete data.updated_at;
    delete data.pagos_extra;
    delete data.eliminar_cuotas;

    const fields = [];
    const values = [];
    let paramCount = 0;

    // Campos editables del payload
    for (const field of ALLOWED_FIELDS_UPDATE) {
      // Saltar campos calculados (ya los vamos a setear nosotros)
      if (CAMPOS_CALCULADOS.includes(field)) {
        continue;
      }
      if (data[field] !== undefined) {
        paramCount++;
        fields.push(`${field} = $${paramCount}`);
        const valor = DATE_FIELDS.includes(field) ? toDateOrNull(data[field]) : toNullIfEmpty(data[field]);
        // Sanear números
        if (typeof valor === 'number' && !isNaN(valor)) {
          values.push(redondearDecimales(valor));
        } else {
          values.push(valor);
        }
      }
    }

    // ✅ SIEMPRE guardar valores recalculados (NO confiar en el frontend)
    paramCount++;
    fields.push(`total_depositado_usd = $${paramCount}`);
    values.push(redondearDecimales(totalDepositadoUSD));

    paramCount++;
    fields.push(`deuda_usd = $${paramCount}`);
    values.push(redondearDecimales(deudaFinalUSD));

    paramCount++;
    fields.push(`monto_depositados = $${paramCount}`);
    values.push(redondearDecimales(totalDepositadoBs));

    paramCount++;
    fields.push(`deuda = $${paramCount}`);
    values.push(redondearDecimales(deudaFinalBs));

    paramCount++;
    fields.push(`cuotas_pagadas = $${paramCount}`);
    values.push(cuotasPagadas);

    paramCount++;
    fields.push(`proxima_cuota = $${paramCount}`);
    values.push(redondearDecimales(proximaCuota));

    paramCount++;
    fields.push(`discrepancias_cuotas = $${paramCount}`);
    values.push(JSON.stringify(discrepancias));

    paramCount++;
    fields.push(`updated_at = $${paramCount}`);
    values.push(new Date());
    values.push(id);

    const query = `UPDATE ${req.tablaTienda} SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;
    console.log('[actualizarCliente] SQL:', query);
    console.log('[actualizarCliente] Values:', values);

    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    res.json({
      success: true,
      message: 'Cliente actualizado',
      data: result.rows[0],
      discrepancias: Object.keys(discrepancias).length > 0 ? discrepancias : null
    });

  } catch (error) {
    console.error(`Error al actualizar cliente (${req.tablaTienda}):`, error);
    res.status(500).json({ error: 'Error al actualizar cliente', details: error.message });
  }
}

async function eliminarCliente(req, res) {
  try {
    const { id } = req.params;
    const result = await pool.query(`DELETE FROM ${req.tablaTienda} WHERE id = $1 RETURNING *`, [id]);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    try {
      await pool.query(`DELETE FROM ${req.tablaPagos} WHERE factura_id = $1`, [id]);
    } catch (e) {
      console.warn(`[v6.8] No se pudieron eliminar pagos extra:`, e.message);
    }

    res.json({ success: true, message: 'Cliente eliminado', data: result.rows[0] });

  } catch (error) {
    console.error(`Error al eliminar cliente (${req.tablaTienda}):`, error);
    res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
  }
}

// ------------------------------------------------------------
// Router parametrico
// ------------------------------------------------------------
const router = express.Router();
router.get('/:tienda', verificarToken, validarTienda, validarTiendaInterno, listarClientes);
router.get('/:tienda/:id', verificarToken, validarTienda, validarTiendaInterno, obtenerCliente);
router.post('/:tienda', verificarToken, validarTienda, validarTiendaInterno, crearCliente);
router.put('/:tienda/:id', verificarToken, validarTienda, validarTiendaInterno, actualizarCliente);
router.delete('/:tienda/:id', verificarToken, soloAdmin, validarTienda, validarTiendaInterno, eliminarCliente);

// ------------------------------------------------------------
// Factory de routers legacy
// ------------------------------------------------------------
function createLegacyRouter(tiendaKey) {
  const legacyRouter = express.Router();
  legacyRouter.use(verificarToken);

  legacyRouter.use((req, res, next) => {
    if (req.usuario && req.usuario.rol === 'operador' && req.usuario.tienda
        && tiendaKey !== req.usuario.tienda) {
      return res.status(403).json({ error: 'No tiene acceso a esta tienda' });
    }
    req.tienda = tiendaKey;
    req.tablaTienda = TIENDAS[tiendaKey];
    req.tablaPagos = TABLAS_PAGOS[tiendaKey];
    next();
  });

  legacyRouter.get('/', listarClientes);
  legacyRouter.get('/:id', obtenerCliente);
  legacyRouter.post('/', crearCliente);
  legacyRouter.put('/:id', actualizarCliente);
  legacyRouter.delete('/:id', soloAdmin, eliminarCliente);

  return legacyRouter;
}

module.exports = { router, createLegacyRouter, TIENDAS };