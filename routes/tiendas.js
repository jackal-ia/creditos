// ============================================================
// RUTAS GENÉRICAS DE TIENDAS - CRUD unificado  (v6.7.2-rev9)
// ============================================================
// Cambios v6.7.2-rev9:
//   - Campos nuevos: inicial_bs, inicial_usd, ref_inicial, fecha_inicial,
//     tasa_inicial, tasa_bcv_factura, monto_cuota_usd
//   - Campos faltantes: total_depositado_usd, deuda_usd, cuotas_pagadas,
//     proxima_cuota, discrepancias_cuotas
//   - Validaciones de cálculo en POST (±0.01 tolerancia)
//   - Validación de cédula duplicada como ADVERTENCIA
//   - Auditoría con IP y user-agent (try-catch en JSON.stringify)
//   - PUT recalcula totales, discrepancias, deuda_usd, proxima_cuota
//   - Rate limiting en BCV movido a routes/bcv.js
//   - Middleware validarTienda importado desde middleware/validarTienda.js
//   - MAYÚSCULAS: todos los campos de texto se guardan en mayúsculas (v6.7.3)
// ============================================================

const express = require('express');
const pool = require('../config/database');
const { verificarToken, soloAdmin } = require('../middleware/auth');
const { validarTienda } = require('../middleware/validarTienda');
const { toUpperCaseFields } = require('../utils/uppercase'); // ← v6.7.3: Helper para mayúsculas

// ------------------------------------------------------------
// WHITELIST DE TIENDAS: clave pública -> tabla real en PostgreSQL
// ------------------------------------------------------------
const TIENDAS = {
  caracas: 'tienda_caracas',
  maracay: 'tienda_maracay',
  maracaibo: 'tienda_maracaibo'
};

// ------------------------------------------------------------
// Campos permitidos en INSERT/UPDATE (whitelist anti inyección)
// ------------------------------------------------------------
const CAMPOS_BASE = [
  'nro_factura', 'nombre_apellido', 'monto_factura', 'fecha_factura',
  'cedula', 'telefono', 'monto_facturado_divisa', 'dolar_facturado', 'cuotas',
  'monto_pendiente', 'monto_depositados', 'deuda',
  // v6.3: datos bancarios
  'numero_cuenta', 'banco',
  // v6.7.2-rev9: campos nuevos de conciliaciones
  'inicial_bs', 'inicial_usd', 'ref_inicial', 'fecha_inicial',
  'tasa_inicial', 'tasa_bcv_factura', 'monto_cuota_usd',
  // v6.7.2-rev9: campos faltantes para modal
  'total_depositado_usd', 'deuda_usd', 'cuotas_pagadas', 'proxima_cuota',
  'discrepancias_cuotas'
];

const CAMPOS_CUOTAS = [];
for (let i = 1; i <= 11; i++) {
  CAMPOS_CUOTAS.push(
    `cuota_${i}`, `ref_cuota_${i}`, `fecha_cuota_${i}`,
    `tasa_cuota_${i}`, `dolar_depositado_cuota_${i}`
  );
}

const ALLOWED_FIELDS_UPDATE = [...CAMPOS_BASE, ...CAMPOS_CUOTAS];
const ALLOWED_FIELDS_INSERT = ['numero', ...ALLOWED_FIELDS_UPDATE];

const DATE_FIELDS = ['fecha_factura', 'fecha_inicial', ...Array.from({ length: 11 }, (_, i) => `fecha_cuota_${i + 1}`)];

// ------------------------------------------------------------
// Campos de texto que se convierten a MAYÚSCULAS (v6.7.3)
// ------------------------------------------------------------
const UPPERCASE_FIELDS = [
  'nro_factura', 'nombre_apellido', 'cedula', 'telefono',
  'banco', 'numero_cuenta', 'ref_inicial',
  'ref_cuota_1', 'ref_cuota_2', 'ref_cuota_3', 'ref_cuota_4', 'ref_cuota_5',
  'ref_cuota_6', 'ref_cuota_7', 'ref_cuota_8', 'ref_cuota_9', 'ref_cuota_10', 'ref_cuota_11'
];

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const toNullIfEmpty = (val) => {
  if (val === undefined || val === null || val === '' || val === 'null' || val === 'undefined') {
    return null;
  }
  // NaN desde JSON (parseFloat de string vacío) → null
  if (typeof val === 'number' && isNaN(val)) {
    return null;
  }
  return val;
};

const toDateOrNull = (val) => {
  if (!val || val === '' || val === 'null' || val === 'undefined' || val === 'Invalid date') {
    return null;
  }
  return val;
};

function redondearDecimales(valor, decimales = 2) {
  if (typeof valor !== 'number' || isNaN(valor) || !isFinite(valor)) return 0;
  const factor = Math.pow(10, decimales);
  return Math.round((valor + Number.EPSILON) * factor) / factor;
}

// ------------------------------------------------------------
// Middleware interno: valida :tienda contra la whitelist y deja
// req.tablaTienda con el nombre real de la tabla.
// NOTA: Se mantiene para compatibilidad con legacy routers.
// Las rutas nuevas usan el middleware importado de validarTienda.js
// ------------------------------------------------------------
function validarTiendaInterno(req, res, next) {
  const tabla = TIENDAS[req.params.tienda];
  if (!tabla) {
    return res.status(400).json({
      error: 'Tienda no válida',
      tiendas_disponibles: Object.keys(TIENDAS)
    });
  }
  // Operadores: solo SU tienda
  if (req.usuario && req.usuario.rol === 'operador' && req.usuario.tienda
      && req.params.tienda !== req.usuario.tienda) {
    return res.status(403).json({ error: 'No tiene acceso a esta tienda' });
  }
  req.tablaTienda = tabla;
  req.tienda = req.params.tienda;
  next();
}

// ------------------------------------------------------------
// Handlers
// ------------------------------------------------------------
async function listarClientes(req, res) {
  try {
    const result = await pool.query(`SELECT * FROM ${req.tablaTienda} ORDER BY id`);
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
    res.json(result.rows[0]);
  } catch (error) {
    console.error(`Error al obtener cliente (${req.tablaTienda}):`, error);
    res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
  }
}

// ============================================================
// POST /api/tiendas/:tienda  —  Crear cliente con validaciones v6.7.2-rev9
// ============================================================
async function crearCliente(req, res) {
  try {
    // ← v6.7.3: Convertir campos de texto a MAYÚSCULAS antes de procesar
    const data = toUpperCaseFields(req.body, UPPERCASE_FIELDS);

    // --- Validaciones básicas ---
    if (!data.nro_factura || data.nro_factura.toString().trim() === '') {
      return res.status(400).json({ error: 'N° de factura es obligatorio' });
    }
    if (!data.monto_factura || parseFloat(data.monto_factura) <= 0) {
      return res.status(400).json({ error: 'Monto de factura debe ser mayor a cero' });
    }

    // --- Validaciones de campos nuevos (v6.7.2-rev9) ---
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
    if (isNaN(cuotas) || cuotas < 1 || cuotas > 11) {
      return res.status(400).json({ error: 'Cuotas debe ser un número entero entre 1 y 11' });
    }

    if (data.fecha_inicial && data.fecha_factura) {
      if (new Date(data.fecha_inicial) < new Date(data.fecha_factura)) {
        return res.status(400).json({ error: 'Fecha de inicial no puede ser anterior a la fecha de la factura' });
      }
    }

    // TASA_MIN = 0.0001 para soportar tasas históricas
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

    // --- Validación de cálculos (±0.01 tolerancia) ---
    const tolerancia = 0.01;
    if (data.monto_facturado_divisa !== undefined && tasaFactura > 0) {
      const calculadoMontoUSD = redondearDecimales(montoFactura / tasaFactura);
      if (Math.abs(calculadoMontoUSD - parseFloat(data.monto_facturado_divisa)) > tolerancia) {
        return res.status(400).json({ error: 'Cálculo de monto en $ incorrecto' });
      }
    }
    if (inicialBs !== null && tasaInicial > 0 && data.inicial_usd !== undefined) {
      const calculadoInicialUSD = redondearDecimales(inicialBs / tasaInicial);
      if (Math.abs(calculadoInicialUSD - parseFloat(data.inicial_usd)) > tolerancia) {
        return res.status(400).json({ error: 'Cálculo de inicial en $ incorrecto' });
      }
    }
    if (data.monto_cuota_usd !== undefined && data.monto_facturado_divisa !== undefined && data.inicial_usd !== undefined) {
      const deudaUSD = redondearDecimales(parseFloat(data.monto_facturado_divisa) - parseFloat(data.inicial_usd));
      const calculadoCuotaUSD = redondearDecimales(deudaUSD / cuotas);
      if (Math.abs(calculadoCuotaUSD - parseFloat(data.monto_cuota_usd)) > tolerancia) {
        return res.status(400).json({ error: 'Cálculo de cuota incorrecto' });
      }
    }

    // --- Validación de teléfono (Venezuela) ---
    if (data.telefono && data.telefono.toString().trim() !== '') {
      const telefonoRegex = /^(0?4[0-9]{2}-?[0-9]{7}|\+58 ?0?4[0-9]{2}-?[0-9]{7})$/;
      if (!telefonoRegex.test(data.telefono.toString().trim())) {
        return res.status(400).json({ error: 'Formato de teléfono inválido. Ej: 0412-1234567 o +58 412-1234567' });
      }
    }

    // --- Verificar nro_factura único en la tienda ---
    const checkFactura = await pool.query(
      `SELECT id FROM ${req.tablaTienda} WHERE nro_factura = $1`,
      [data.nro_factura]
    );
    if (checkFactura.rows.length > 0) {
      return res.status(400).json({ error: 'N° de factura ya existe en esta tienda' });
    }

    // --- Verificar cédula duplicada (ADVERTENCIA, no bloqueo) ---
    let cedulaAdvertencia = null;
    if (data.cedula && data.cedula.toString().trim() !== '') {
      const checkCedula = await pool.query(
        `SELECT id, nro_factura FROM ${req.tablaTienda} WHERE cedula = $1`,
        [data.cedula.toString().trim()]
      );
      if (checkCedula.rows.length > 0) {
        cedulaAdvertencia = {
          mensaje: `Esta cédula ya tiene ${checkCedula.rows.length} factura(s) en esta tienda`,
          facturas: checkCedula.rows.map(r => r.nro_factura)
        };
      }
    }

    // --- Construir INSERT ---
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

    // --- Auditoría con IP y user-agent (v6.7.2-rev9) ---
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
      console.warn('Error registrando auditoría:', auditErr.message);
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
// PUT /api/tiendas/:tienda/:id  —  Actualizar con recálculos v6.7.2-rev9
// ============================================================
async function actualizarCliente(req, res) {
  try {
    const { id } = req.params;

    // ← v6.7.3: Convertir campos de texto a MAYÚSCULAS antes de procesar
    const data = toUpperCaseFields(req.body, UPPERCASE_FIELDS);

    // 1. Obtener datos actuales del cliente
    const clienteActual = await pool.query(
      `SELECT * FROM ${req.tablaTienda} WHERE id = $1`, [id]
    );
    if (clienteActual.rows.length === 0) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }
    const cliente = clienteActual.rows[0];

    // 2. Recalcular totales desde los inputs del modal
    let totalDepositadoBs = 0;
    let totalDepositadoUSD = 0;
    let cuotasPagadas = 0;

    for (let i = 1; i <= 11; i++) {
      const cuotaBs = parseFloat(data[`cuota_${i}`]) || 0;
      const cuotaUSD = parseFloat(data[`dolar_depositado_cuota_${i}`]) || 0;
      if (cuotaBs > 0) {
        totalDepositadoBs += cuotaBs;
        totalDepositadoUSD += cuotaUSD;
        cuotasPagadas++;
      }
    }

    // 3. Incluir inicial en totales (si es registro nuevo)
    const esNuevo = cliente.inicial_bs !== null && parseFloat(cliente.inicial_bs) > 0;
    if (esNuevo) {
      totalDepositadoBs += parseFloat(cliente.inicial_bs) || 0;
      totalDepositadoUSD += parseFloat(cliente.inicial_usd) || 0;
    }

    // 4. Calcular deuda pendiente
    const montoFactura = parseFloat(cliente.monto_factura) || 0;
    const montoFacturadoDivisa = parseFloat(cliente.monto_facturado_divisa) || 0;
    const deudaPendienteBs = montoFactura - totalDepositadoBs;
    const deudaPendienteUSD = montoFacturadoDivisa - totalDepositadoUSD;

    // 5. Calcular discrepancias de cuotas
    const montoCuotaUSD = parseFloat(cliente.monto_cuota_usd) || 0;
    const totalCuotas = parseInt(cliente.cuotas) || 4;

    // Validar que cuotasPagadas coincida con cuotas reales
    const cuotasReales = Object.keys(data)
      .filter(k => k.startsWith('cuota_') && parseFloat(data[k]) > 0)
      .length;
    if (cuotasReales !== cuotasPagadas) {
      console.warn(`[DISCREPANCIA] cuotasPagadas (${cuotasPagadas}) != cuotasReales (${cuotasReales}). Recalculando...`);
      cuotasPagadas = cuotasReales;
    }

    let discrepancias = {};
    for (let i = 1; i <= 11; i++) {
      const dolarRecibido = parseFloat(data[`dolar_depositado_cuota_${i}`]) || 0;
      if (dolarRecibido > 0) {
        const esUltimaPagada = i === cuotasPagadas && i === totalCuotas;
        let esperado = montoCuotaUSD;
        if (esUltimaPagada && montoCuotaUSD > 0) {
          const acumuladoAnterior = redondearDecimales(montoCuotaUSD * (totalCuotas - 1));
          const deudaTotal = montoFacturadoDivisa - (parseFloat(cliente.inicial_usd) || 0);
          esperado = redondearDecimales(deudaTotal - acumuladoAnterior);
        }
        const diferencia = redondearDecimales(esperado - dolarRecibido);
        if (diferencia > 0.01) {
          discrepancias[i] = {
            esperado: redondearDecimales(esperado),
            recibido: dolarRecibido,
            diferencia: diferencia
          };
        }
      }
    }

    // Limitar JSONB a máximo 10 discrepancias (las más recientes)
    const discrepanciasKeys = Object.keys(discrepancias);
    if (discrepanciasKeys.length > 10) {
      const sortedKeys = discrepanciasKeys
        .map(k => parseInt(k))
        .sort((a, b) => b - a)
        .slice(0, 10);
      const limited = {};
      sortedKeys.forEach(k => { limited[k] = discrepancias[k]; });
      discrepancias = limited;
    }

    // 6. Calcular próxima cuota
    const proximaCuota = Math.min(montoCuotaUSD, deudaPendienteUSD);

    // CORRECCIoN: eliminar del payload los campos que el backend recalcula
    // para evitar DUPLICADOS en el SQL (error 42601 de PostgreSQL)
    delete data.monto_depositados;
    delete data.deuda;
    delete data.cuotas_pagadas;
    delete data.total_depositado_usd;
    delete data.deuda_usd;
    delete data.proxima_cuota;
    delete data.discrepancias_cuotas;
    delete data.nro_factura;      // UNIQUE - no se debe cambiar
    delete data.numero;           // correlativo interno
    delete data.created_at;       // controlado por trigger
    delete data.updated_at;       // controlado por trigger

    // 7. Construir UPDATE
    const fields = [];
    const values = [];
    let paramCount = 0;

    for (const field of ALLOWED_FIELDS_UPDATE) {
      if (data[field] !== undefined) {
        paramCount++;
        fields.push(`${field} = $${paramCount}`);
        values.push(DATE_FIELDS.includes(field) ? toDateOrNull(data[field]) : toNullIfEmpty(data[field]));
      }
    }

    // Agregar campos calculados automáticamente
    paramCount++;
    fields.push(`total_depositado_usd = $${paramCount}`);
    values.push(redondearDecimales(totalDepositadoUSD));

    paramCount++;
    fields.push(`deuda_usd = $${paramCount}`);
    values.push(redondearDecimales(deudaPendienteUSD));

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

    res.json({ success: true, message: 'Cliente eliminado', data: result.rows[0] });

  } catch (error) {
    console.error(`Error al eliminar cliente (${req.tablaTienda}):`, error);
    res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
  }
}

// ------------------------------------------------------------
// Router paramétrico: /api/tiendas/:tienda/...
// v6.7.2-rev9: usa validarTienda importado del middleware
// ------------------------------------------------------------
const router = express.Router();
router.get('/:tienda', verificarToken, validarTienda, validarTiendaInterno, listarClientes);
router.get('/:tienda/:id', verificarToken, validarTienda, validarTiendaInterno, obtenerCliente);
router.post('/:tienda', verificarToken, soloAdmin, validarTienda, validarTiendaInterno, crearCliente);
router.put('/:tienda/:id', verificarToken, soloAdmin, validarTienda, validarTiendaInterno, actualizarCliente);
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
