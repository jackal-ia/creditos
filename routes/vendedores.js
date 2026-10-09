// ============================================================
//  FASE VENDEDORES v8.0 — Solo Tienda Caracas
//  Clientes, Inventario, Cotizaciones y Notas de Entrega.
//  Acceso: rol 'administrador' y nuevo rol 'vendedor'.
//  No toca tablas ni rutas del modulo de creditos.
// ============================================================
const express = require('express');
const router = express.Router();
const pool = require('../config/database');
const { verificarToken } = require('../middleware/auth');

// Tablas de esta fase (escalable: _caracas hoy, _maracay manana)
const T_CLIENTES = 'vendedores_clientes_caracas';
const T_INVENTARIO = 'inventario_caracas';
const T_COTIZACIONES = 'cotizaciones_caracas';
const T_ITEMS = 'cotizaciones_items_caracas';
const T_NOTAS = 'notas_entrega_caracas';

const ESTADOS = ['borrador', 'enviada', 'aprobada', 'rechazada'];

// ------------------------------------------------------------
// Guard: solo administrador y vendedor entran a este modulo
// ------------------------------------------------------------
const soloVendedores = (req, res, next) => {
    const rol = (req.usuario && req.usuario.rol) || '';
    if (rol !== 'administrador' && rol !== 'vendedor') {
        return res.status(403).json({ error: 'Acceso restringido al modulo de vendedores.' });
    }
    next();
};

const soloAdminLocal = (req, res, next) => {
    if (!req.usuario || req.usuario.rol !== 'administrador') {
        return res.status(403).json({ error: 'Solo el administrador puede realizar esta accion.' });
    }
    next();
};

router.use(verificarToken, soloVendedores);

// ------------------------------------------------------------
// Helpers
// ------------------------------------------------------------
const num = (v) => {
    const n = parseFloat(v);
    return isNaN(n) ? 0 : n;
};
const entero = (v, def = 0) => {
    const n = parseInt(v);
    return isNaN(n) ? def : n;
};
const texto = (v, max = 200) => (v === undefined || v === null) ? null : String(v).trim().slice(0, max);
// Texto que se guarda SIEMPRE en mayúsculas (aunque el vendedor escriba en minúscula)
const textoMay = (v, max = 200) => {
    const t = texto(v, max);
    return t === null ? null : t.toUpperCase();
};

// ============================================================
//  CONTROL DE STOCK
//  El artículo se COMPROMETE al generar la nota de entrega.
//  La cotización solo valida disponibilidad. El descuento es
//  atómico (UPDATE ... WHERE cantidad_disponible >= X): si dos
//  vendedores generan nota a la vez, el último es rechazado.
// ============================================================
function errorStock(codigo, disp) {
    const err = new Error(`Sin disponibilidad suficiente de ${codigo}: quedan ${disp} unidad(es) — puede estar comprometido por otra nota de entrega en curso`);
    err.status = 409;
    err.codigo = 'SIN_STOCK';
    return err;
}

// Solo validar (crear/editar cotización sin nota)
async function validarDisponible(client, items) {
    for (const it of items) {
        if (!it.inventario_id) continue;
        const r = await client.query(`SELECT codigo, cantidad_disponible FROM ${T_INVENTARIO} WHERE id = $1`, [it.inventario_id]);
        const disp = r.rows.length ? parseInt(r.rows[0].cantidad_disponible) : 0;
        if (disp < it.cantidad) throw errorStock(r.rows.length ? r.rows[0].codigo : (it.codigo || 'ARTICULO'), disp);
    }
}

// Comprometer (al generar nota): descuenta disponible y suma al vendido — atómico
async function comprometerStock(client, items, formaPago) {
    const col = formaPago === 'credito' ? 'vendido_credito' : 'vendido_contado';
    const ordenados = items.filter(it => it.inventario_id).sort((a, b) => a.inventario_id - b.inventario_id); // orden fijo anti-deadlock
    for (const it of ordenados) {
        const r = await client.query(
            `UPDATE ${T_INVENTARIO}
             SET cantidad_disponible = cantidad_disponible - $2, ${col} = ${col} + $2, updated_at = CURRENT_TIMESTAMP
             WHERE id = $1 AND cantidad_disponible >= $2
             RETURNING id`, [it.inventario_id, it.cantidad]);
        if (!r.rows.length) {
            const act = await client.query(`SELECT codigo, cantidad_disponible FROM ${T_INVENTARIO} WHERE id = $1`, [it.inventario_id]);
            throw errorStock(act.rows.length ? act.rows[0].codigo : (it.codigo || 'ARTICULO'), act.rows.length ? act.rows[0].cantidad_disponible : 0);
        }
    }
}

// Liberar (al borrar cotización con nota o re-editarla): devuelve disponible y resta del vendido
async function liberarStock(client, items, formaPago) {
    const col = formaPago === 'credito' ? 'vendido_credito' : 'vendido_contado';
    for (const it of items) {
        if (!it.inventario_id) continue;
        await client.query(
            `UPDATE ${T_INVENTARIO}
             SET cantidad_disponible = cantidad_disponible + $2, ${col} = GREATEST(0, ${col} - $2), updated_at = CURRENT_TIMESTAMP
             WHERE id = $1`, [it.inventario_id, it.cantidad]);
    }
}
const fmtNumero = (n) => String(n).padStart(5, '0'); // 1 → '00001'

function validarClientePayload(b) {
    const errores = [];
    if (!texto(b.nombres, 100)) errores.push('nombres es obligatorio');
    if (!texto(b.apellidos, 100)) errores.push('apellidos es obligatorio');
    if (!texto(b.cedula_rif, 20)) errores.push('cedula_rif es obligatorio');
    return errores;
}

// ============================================================
//  CLIENTES
// ============================================================

// Listar / buscar: GET /clientes?q=texto
router.get('/clientes', async (req, res) => {
    try {
        const q = texto(req.query.q, 60);
        let result;
        if (q) {
            const like = '%' + q.replace(/[%_]/g, '') + '%';
            result = await pool.query(
                `SELECT * FROM ${T_CLIENTES}
                 WHERE cedula_rif ILIKE $1 OR nombres ILIKE $1 OR apellidos ILIKE $1
                    OR (nombres || ' ' || apellidos) ILIKE $1
                 ORDER BY apellidos, nombres LIMIT 100`, [like]);
        } else {
            result = await pool.query(`SELECT * FROM ${T_CLIENTES} ORDER BY apellidos, nombres LIMIT 500`);
        }
        res.json({ exito: true, clientes: result.rows });
    } catch (e) {
        console.error('[vendedores] listar clientes:', e.message);
        res.status(500).json({ error: 'Error al listar clientes' });
    }
});

// Crear: POST /clientes
router.post('/clientes', async (req, res) => {
    try {
        const b = req.body || {};
        const errores = validarClientePayload(b);
        if (errores.length) return res.status(400).json({ error: errores.join(', ') });

        const dup = await pool.query(`SELECT id FROM ${T_CLIENTES} WHERE cedula_rif = $1`, [textoMay(b.cedula_rif, 20)]);
        if (dup.rows.length) return res.status(409).json({ error: 'Ya existe un cliente con esa cedula/RIF', cliente_id: dup.rows[0].id });

        const r = await pool.query(
            `INSERT INTO ${T_CLIENTES} (nombres, apellidos, cedula_rif, telefono, ocupacion, es_militar, direccion, sexo, email)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
            [textoMay(b.nombres, 100), textoMay(b.apellidos, 100), textoMay(b.cedula_rif, 20),
             textoMay(b.telefono, 30), textoMay(b.ocupacion, 100),
             entero(b.es_militar) === 1 ? 1 : 0,
             textoMay(b.direccion, 500), textoMay(b.sexo, 20), textoMay(b.email, 120)]);
        res.status(201).json({ exito: true, cliente: r.rows[0] });
    } catch (e) {
        console.error('[vendedores] crear cliente:', e.message);
        res.status(500).json({ error: 'Error al crear cliente' });
    }
});

// Actualizar: PUT /clientes/:id
router.put('/clientes/:id', async (req, res) => {
    try {
        const id = entero(req.params.id);
        const b = req.body || {};
        const errores = validarClientePayload(b);
        if (errores.length) return res.status(400).json({ error: errores.join(', ') });

        const dup = await pool.query(`SELECT id FROM ${T_CLIENTES} WHERE cedula_rif = $1 AND id <> $2`, [textoMay(b.cedula_rif, 20), id]);
        if (dup.rows.length) return res.status(409).json({ error: 'Otra ficha ya usa esa cedula/RIF' });

        const r = await pool.query(
            `UPDATE ${T_CLIENTES} SET nombres=$1, apellidos=$2, cedula_rif=$3, telefono=$4, ocupacion=$5,
                    es_militar=$6, direccion=$7, sexo=$8, email=$9, updated_at=CURRENT_TIMESTAMP
             WHERE id=$10 RETURNING *`,
            [textoMay(b.nombres, 100), textoMay(b.apellidos, 100), textoMay(b.cedula_rif, 20),
             textoMay(b.telefono, 30), textoMay(b.ocupacion, 100),
             entero(b.es_militar) === 1 ? 1 : 0,
             textoMay(b.direccion, 500), textoMay(b.sexo, 20), textoMay(b.email, 120), id]);
        if (!r.rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ exito: true, cliente: r.rows[0] });
    } catch (e) {
        console.error('[vendedores] actualizar cliente:', e.message);
        res.status(500).json({ error: 'Error al actualizar cliente' });
    }
});

// Eliminar: DELETE /clientes/:id (solo admin; bloquea si tiene cotizaciones)
router.delete('/clientes/:id', soloAdminLocal, async (req, res) => {
    try {
        const id = entero(req.params.id);
        const uso = await pool.query(`SELECT COUNT(*)::int AS n FROM ${T_COTIZACIONES} WHERE cliente_id = $1`, [id]);
        if (uso.rows[0].n > 0) {
            return res.status(409).json({ error: `No se puede eliminar: el cliente tiene ${uso.rows[0].n} cotizacion(es)` });
        }
        const r = await pool.query(`DELETE FROM ${T_CLIENTES} WHERE id = $1 RETURNING id`, [id]);
        if (!r.rows.length) return res.status(404).json({ error: 'Cliente no encontrado' });
        res.json({ exito: true });
    } catch (e) {
        console.error('[vendedores] eliminar cliente:', e.message);
        res.status(500).json({ error: 'Error al eliminar cliente' });
    }
});

// ============================================================
//  INVENTARIO
// ============================================================

// Listar / buscar: GET /inventario?q=texto&soloDisponibles=1
// vendido_contado / vendido_credito son columnas físicas (v8.2), actualizadas al generar/liberar notas
router.get('/inventario', async (req, res) => {
    try {
        const q = texto(req.query.q, 60);
        const soloDisp = req.query.soloDisponibles === '1';
        let sql = `SELECT * FROM ${T_INVENTARIO} WHERE activo = 1`;
        const params = [];
        if (q) {
            params.push('%' + q.replace(/[%_]/g, '') + '%');
            sql += ` AND (codigo ILIKE $1 OR descripcion ILIKE $1)`;
        }
        if (soloDisp) sql += ` AND cantidad_disponible > 0`;
        sql += ` ORDER BY descripcion LIMIT 200`;
        const r = await pool.query(sql, params);
        res.json({ exito: true, articulos: r.rows });
    } catch (e) {
        console.error('[vendedores] listar inventario:', e.message);
        res.status(500).json({ error: 'Error al listar inventario' });
    }
});

// Crear: POST /inventario
router.post('/inventario', async (req, res) => {
    try {
        const b = req.body || {};
        if (!texto(b.codigo, 30)) return res.status(400).json({ error: 'codigo es obligatorio' });
        if (!texto(b.descripcion, 200)) return res.status(400).json({ error: 'descripcion es obligatoria' });

        const dup = await pool.query(`SELECT * FROM ${T_INVENTARIO} WHERE codigo = $1`, [textoMay(b.codigo, 30)]);
        if (dup.rows.length) {
            const art = dup.rows[0];
            // mismo código: en vez de duplicar, se SUMA a la cantidad disponible (previa confirmación)
            if (b.sumar === true) {
                const cant = Math.max(0, entero(b.cantidad_disponible));
                const r2 = await pool.query(
                    `UPDATE ${T_INVENTARIO} SET cantidad_disponible = cantidad_disponible + $2,
                            updated_at = CURRENT_TIMESTAMP
                     WHERE id = $1 RETURNING *`,
                    [art.id, cant]);
                return res.json({ exito: true, articulo: r2.rows[0], sumado: true });
            }
            return res.status(409).json({
                error: 'Ya existe un articulo con ese codigo',
                codigo: 'CODIGO_EXISTE',
                articulo: { id: art.id, codigo: art.codigo, descripcion: art.descripcion, cantidad_disponible: art.cantidad_disponible }
            });
        }

        const r = await pool.query(
            `INSERT INTO ${T_INVENTARIO} (codigo, descripcion, cantidad_disponible, precio_contado, precio_credito)
             VALUES ($1,$2,$3,$4,$5) RETURNING *`,
            [textoMay(b.codigo, 30), textoMay(b.descripcion, 200), Math.max(0, entero(b.cantidad_disponible)),
             num(b.precio_contado), num(b.precio_credito)]);
        res.status(201).json({ exito: true, articulo: r.rows[0] });
    } catch (e) {
        console.error('[vendedores] crear articulo:', e.message);
        res.status(500).json({ error: 'Error al crear articulo' });
    }
});

// Actualizar: PUT /inventario/:id
router.put('/inventario/:id', async (req, res) => {
    try {
        const id = entero(req.params.id);
        const b = req.body || {};
        if (!texto(b.codigo, 30)) return res.status(400).json({ error: 'codigo es obligatorio' });
        if (!texto(b.descripcion, 200)) return res.status(400).json({ error: 'descripcion es obligatoria' });

        const dup = await pool.query(`SELECT id FROM ${T_INVENTARIO} WHERE codigo = $1 AND id <> $2`, [textoMay(b.codigo, 30), id]);
        if (dup.rows.length) return res.status(409).json({ error: 'Otro articulo ya usa ese codigo' });

        const r = await pool.query(
            `UPDATE ${T_INVENTARIO} SET codigo=$1, descripcion=$2, cantidad_disponible=$3,
                    precio_contado=$4, precio_credito=$5, updated_at=CURRENT_TIMESTAMP
             WHERE id=$6 RETURNING *`,
            [textoMay(b.codigo, 30), textoMay(b.descripcion, 200), Math.max(0, entero(b.cantidad_disponible)),
             num(b.precio_contado), num(b.precio_credito), id]);
        if (!r.rows.length) return res.status(404).json({ error: 'Articulo no encontrado' });
        res.json({ exito: true, articulo: r.rows[0] });
    } catch (e) {
        console.error('[vendedores] actualizar articulo:', e.message);
        res.status(500).json({ error: 'Error al actualizar articulo' });
    }
});

// Eliminar (desactivar): DELETE /inventario/:id (solo admin)
router.delete('/inventario/:id', soloAdminLocal, async (req, res) => {
    try {
        const id = entero(req.params.id);
        const r = await pool.query(
            `UPDATE ${T_INVENTARIO} SET activo = 0, updated_at=CURRENT_TIMESTAMP WHERE id=$1 RETURNING id`, [id]);
        if (!r.rows.length) return res.status(404).json({ error: 'Articulo no encontrado' });
        res.json({ exito: true });
    } catch (e) {
        console.error('[vendedores] eliminar articulo:', e.message);
        res.status(500).json({ error: 'Error al eliminar articulo' });
    }
});

// ============================================================
//  COTIZACIONES
// ============================================================

// Listar: GET /cotizaciones?estado=borrador
router.get('/cotizaciones', async (req, res) => {
    try {
        const estado = texto(req.query.estado, 12);
        let sql = `SELECT c.id, c.numero, c.fecha, c.tipo_precio, c.moneda, c.tasa_bcv,
                          c.subtotal_usd, c.total_usd, c.total_bs, c.estado,
                          c.nota_entrega_generada, c.observaciones, c.created_at,
                          cl.nombres, cl.apellidos, cl.cedula_rif,
                          u.nombre AS vendedor_nombre
                   FROM ${T_COTIZACIONES} c
                   JOIN ${T_CLIENTES} cl ON cl.id = c.cliente_id
                   LEFT JOIN usuarios u ON u.id = c.created_by`;
        const params = [];
        if (estado && ESTADOS.includes(estado)) {
            params.push(estado);
            sql += ` WHERE c.estado = $1`;
        }
        sql += ` ORDER BY c.numero ASC LIMIT 500`;
        const r = await pool.query(sql, params);
        const cotizaciones = r.rows.map(x => ({ ...x, numero_fmt: fmtNumero(x.numero) }));
        res.json({ exito: true, cotizaciones });
    } catch (e) {
        console.error('[vendedores] listar cotizaciones:', e.message);
        res.status(500).json({ error: 'Error al listar cotizaciones' });
    }
});

// Detalle: GET /cotizaciones/:id  (cabecera + cliente + items + nota si existe)
router.get('/cotizaciones/:id', async (req, res) => {
    try {
        const id = entero(req.params.id);
        const c = await pool.query(
            `SELECT c.*, cl.nombres, cl.apellidos, cl.cedula_rif, cl.telefono, cl.ocupacion,
                    cl.es_militar, cl.direccion, cl.sexo, cl.email,
                    u.nombre AS vendedor_nombre
             FROM ${T_COTIZACIONES} c
             JOIN ${T_CLIENTES} cl ON cl.id = c.cliente_id
             LEFT JOIN usuarios u ON u.id = c.created_by
             WHERE c.id = $1`, [id]);
        if (!c.rows.length) return res.status(404).json({ error: 'Cotizacion no encontrada' });

        const items = await pool.query(
            `SELECT * FROM ${T_ITEMS} WHERE cotizacion_id = $1 ORDER BY id`, [id]);
        const nota = await pool.query(
            `SELECT * FROM ${T_NOTAS} WHERE cotizacion_id = $1`, [id]);

        const cot = c.rows[0];
        cot.numero_fmt = fmtNumero(cot.numero);
        res.json({
            exito: true,
            cotizacion: cot,
            items: items.rows,
            nota_entrega: nota.rows[0] || null
        });
    } catch (e) {
        console.error('[vendedores] detalle cotizacion:', e.message);
        res.status(500).json({ error: 'Error al obtener la cotizacion' });
    }
});

// Crear: POST /cotizaciones
// body: { fecha, cliente_id | cliente:{...nuevo}, tipo_precio, moneda, tasa_bcv,
//         observaciones, items:[{inventario_id, codigo, descripcion, cantidad, precio_unitario_usd}] }
router.post('/cotizaciones', async (req, res) => {
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return res.status(400).json({ error: 'La cotizacion debe tener al menos un articulo' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1) Cliente: existente o nuevo (registrado inline desde el modal)
        let clienteId = entero(b.cliente_id);
        if (!clienteId) {
            const nc = b.cliente || {};
            const errores = validarClientePayload(nc);
            if (errores.length) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Cliente nuevo: ' + errores.join(', ') });
            }
            const dup = await client.query(`SELECT id FROM ${T_CLIENTES} WHERE cedula_rif = $1`, [textoMay(nc.cedula_rif, 20)]);
            if (dup.rows.length) {
                clienteId = dup.rows[0].id; // ya existia: se usa su ficha
            } else {
                const ins = await client.query(
                    `INSERT INTO ${T_CLIENTES} (nombres, apellidos, cedula_rif, telefono, ocupacion, es_militar, direccion, sexo, email)
                     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING id`,
                    [textoMay(nc.nombres, 100), textoMay(nc.apellidos, 100), textoMay(nc.cedula_rif, 20),
                     textoMay(nc.telefono, 30), textoMay(nc.ocupacion, 100),
                     entero(nc.es_militar) === 1 ? 1 : 0,
                     textoMay(nc.direccion, 500), textoMay(nc.sexo, 20), textoMay(nc.email, 120)]);
                clienteId = ins.rows[0].id;
            }
        } else {
            const existe = await client.query(`SELECT id FROM ${T_CLIENTES} WHERE id = $1`, [clienteId]);
            if (!existe.rows.length) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Cliente no encontrado' });
            }
        }

        // 2) Numero correlativo (por tienda: esta tabla es solo Caracas).
        //    Bloqueo de numeracion: si dos vendedores guardan al mismo tiempo,
        //    uno espera al otro y cada quien recibe un numero distinto (reservado
        //    desde que se guarda la cotizacion; la nota hereda ese mismo numero).
        await client.query(`SELECT pg_advisory_xact_lock(hashtext('cotizaciones_caracas_numero'))`);
        const seq = await client.query(`SELECT COALESCE(MAX(numero), 0) + 1 AS sig FROM ${T_COTIZACIONES}`);
        const numero = seq.rows[0].sig;

        // 3) Items y totales (precios en USD)
        let totalUsd = 0;
        const itemsOk = [];
        for (const it of items) {
            const cantidad = Math.max(1, entero(it.cantidad, 1));
            const precio = num(it.precio_unitario_usd);
            const sub = Math.round(cantidad * precio * 100) / 100;
            totalUsd += sub;
            itemsOk.push({
                inventario_id: entero(it.inventario_id) || null,
                codigo: textoMay(it.codigo, 30),
                descripcion: textoMay(it.descripcion, 200),
                cantidad,
                precio_unitario_usd: precio,
                subtotal_usd: sub
            });
        }
        totalUsd = Math.round(totalUsd * 100) / 100;
        const tasa = num(b.tasa_bcv);
        const totalBs = Math.round(totalUsd * tasa * 100) / 100;

        // 4) Validar disponibilidad REAL (el artículo se compromete al generar la nota)
        await validarDisponible(client, itemsOk);

        const tipoPrecio = (b.tipo_precio === 'credito') ? 'credito' : 'contado';
        const moneda = (String(b.moneda).toUpperCase() === 'BS') ? 'BS' : 'USD';

        const cab = await client.query(
            `INSERT INTO ${T_COTIZACIONES}
                (numero, fecha, cliente_id, tipo_precio, moneda, tasa_bcv, subtotal_usd,
                 total_usd, total_bs, estado, observaciones, created_by)
             VALUES ($1, COALESCE($2::date, CURRENT_DATE), $3, $4, $5, $6, $7, $7, $8, 'borrador', $9, $10)
             RETURNING *`,
            [numero, texto(b.fecha, 10), clienteId, tipoPrecio, moneda, tasa || null,
             totalUsd, totalBs, textoMay(b.observaciones, 500), req.usuario.id]);

        for (const it of itemsOk) {
            await client.query(
                `INSERT INTO ${T_ITEMS} (cotizacion_id, inventario_id, codigo, descripcion, cantidad, precio_unitario_usd, subtotal_usd)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [cab.rows[0].id, it.inventario_id, it.codigo, it.descripcion, it.cantidad, it.precio_unitario_usd, it.subtotal_usd]);
        }

        await client.query('COMMIT');
        const salida = cab.rows[0];
        salida.numero_fmt = fmtNumero(salida.numero);
        res.status(201).json({ exito: true, cotizacion: salida, items: itemsOk });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[vendedores] crear cotizacion:', e.message);
        res.status(e.status || 500).json({ error: e.status ? e.message : 'Error al crear la cotizacion', codigo: e.codigo });
    } finally {
        client.release();
    }
});

// Editar: PUT /cotizaciones/:id — solo en estado borrador
router.put('/cotizaciones/:id', async (req, res) => {
    const id = entero(req.params.id);
    const b = req.body || {};
    const items = Array.isArray(b.items) ? b.items : [];
    if (!items.length) return res.status(400).json({ error: 'La cotizacion debe tener al menos un articulo' });

    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const act = await client.query(`SELECT * FROM ${T_COTIZACIONES} WHERE id = $1 FOR UPDATE`, [id]);
        if (!act.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Cotizacion no encontrada' }); }
        if (act.rows[0].estado !== 'borrador') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Solo se puede editar una cotizacion en estado borrador' });
        }

        // ítems actuales y nota (si existe) — para el manejo de stock
        const itemsViejos = await client.query(`SELECT * FROM ${T_ITEMS} WHERE cotizacion_id = $1`, [id]);
        const notaQ = await client.query(`SELECT * FROM ${T_NOTAS} WHERE cotizacion_id = $1 FOR UPDATE`, [id]);
        const notaPrevia = notaQ.rows[0] || null;

        let totalUsd = 0;
        const itemsOk = [];
        for (const it of items) {
            const cantidad = Math.max(1, entero(it.cantidad, 1));
            const precio = num(it.precio_unitario_usd);
            const sub = Math.round(cantidad * precio * 100) / 100;
            totalUsd += sub;
            itemsOk.push({ inventario_id: entero(it.inventario_id) || null, codigo: textoMay(it.codigo, 30),
                           descripcion: textoMay(it.descripcion, 200), cantidad, precio_unitario_usd: precio, subtotal_usd: sub });
        }
        totalUsd = Math.round(totalUsd * 100) / 100;
        const tasa = num(b.tasa_bcv);
        const totalBs = Math.round(totalUsd * tasa * 100) / 100;

        // Stock: si ya tiene nota, los ítems viejos estaban comprometidos:
        // se liberan y se comprometen los nuevos (atómico). Si no tiene nota, solo validar.
        if (notaPrevia) {
            await liberarStock(client, itemsViejos.rows, notaPrevia.forma_pago);
            await comprometerStock(client, itemsOk, notaPrevia.forma_pago);
        } else {
            await validarDisponible(client, itemsOk);
        }

        await client.query(
            `UPDATE ${T_COTIZACIONES} SET fecha=COALESCE($2::date, fecha), tipo_precio=$3, moneda=$4,
                    tasa_bcv=$5, subtotal_usd=$6, total_usd=$6, total_bs=$7, observaciones=$8,
                    updated_at=CURRENT_TIMESTAMP
             WHERE id=$1`,
            [id, texto(b.fecha, 10), (b.tipo_precio === 'credito') ? 'credito' : 'contado',
             (String(b.moneda).toUpperCase() === 'BS') ? 'BS' : 'USD', tasa || null,
             totalUsd, totalBs, textoMay(b.observaciones, 500)]);

        await client.query(`DELETE FROM ${T_ITEMS} WHERE cotizacion_id = $1`, [id]);
        for (const it of itemsOk) {
            await client.query(
                `INSERT INTO ${T_ITEMS} (cotizacion_id, inventario_id, codigo, descripcion, cantidad, precio_unitario_usd, subtotal_usd)
                 VALUES ($1,$2,$3,$4,$5,$6,$7)`,
                [id, it.inventario_id, it.codigo, it.descripcion, it.cantidad, it.precio_unitario_usd, it.subtotal_usd]);
        }

        // Si ya tiene nota de entrega, se ACTUALIZA con los nuevos montos (no se borra):
        // mismo numero, mismas fechas del cronograma; se recalculan resta y cuotas.
        let notaActualizada = false;
        if (notaPrevia) {
            const nota = notaPrevia;
            if (nota.forma_pago === 'credito') {
                const inicial = num(nota.inicial_usd);
                const cuotas = Math.max(1, entero(nota.cuotas_quincenales, 1));
                const resta = Math.max(0, Math.round((totalUsd - inicial) * 100) / 100);
                const montoCuota = Math.round((resta / cuotas) * 100) / 100;
                const cronViejo = Array.isArray(nota.cronograma) ? nota.cronograma : [];
                let acumulado = 0;
                const cronNuevo = [];
                for (let i = 1; i <= cuotas; i++) {
                    const monto = (i === cuotas) ? Math.round((resta - acumulado) * 100) / 100 : montoCuota;
                    acumulado = Math.round((acumulado + monto) * 100) / 100;
                    let fecha = cronViejo[i - 1] && cronViejo[i - 1].fecha;
                    if (!fecha) {
                        // si faltara una fecha, se continua quincenal desde la ultima conocida
                        const baseF = cronNuevo.length ? new Date(cronNuevo[cronNuevo.length - 1].fecha + 'T12:00:00Z') : new Date();
                        fecha = new Date(baseF.getTime() + 15 * 24 * 3600 * 1000).toISOString().slice(0, 10);
                    }
                    cronNuevo.push({ nro: i, fecha: String(fecha).slice(0, 10), monto_usd: monto });
                }
                await client.query(
                    `UPDATE ${T_NOTAS} SET monto_cuota_usd = $2, cronograma = $3 WHERE cotizacion_id = $1`,
                    [id, montoCuota, JSON.stringify(cronNuevo)]);
            }
            notaActualizada = true;
        }

        await client.query('COMMIT');
        res.json({ exito: true, items: itemsOk, total_usd: totalUsd, total_bs: totalBs, nota_actualizada: notaActualizada });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[vendedores] editar cotizacion:', e.message);
        res.status(e.status || 500).json({ error: e.status ? e.message : 'Error al editar la cotizacion', codigo: e.codigo });
    } finally {
        client.release();
    }
});

// Cambiar estado: PUT /cotizaciones/:id/estado  { estado: 'enviada'|'aprobada'|'rechazada'|'borrador' }
router.put('/cotizaciones/:id/estado', async (req, res) => {
    try {
        const id = entero(req.params.id);
        const nuevo = texto((req.body || {}).estado, 12);
        if (!ESTADOS.includes(nuevo)) return res.status(400).json({ error: 'Estado invalido' });

        const act = await pool.query(`SELECT estado FROM ${T_COTIZACIONES} WHERE id = $1`, [id]);
        if (!act.rows.length) return res.status(404).json({ error: 'Cotizacion no encontrada' });

        const actual = act.rows[0].estado;
        // Volver a borrador está permitido aunque tenga nota de entrega:
        // la nota se CONSERVA y al guardar la edición se actualiza sola
        await pool.query(
            `UPDATE ${T_COTIZACIONES} SET estado = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`, [nuevo, id]);
        res.json({ exito: true, estado_anterior: actual, estado: nuevo });
    } catch (e) {
        console.error('[vendedores] cambiar estado:', e.message);
        res.status(500).json({ error: 'Error al cambiar el estado' });
    }
});

// Eliminar: DELETE /cotizaciones/:id — en borrador cualquiera del modulo; en otro estado solo admin
// Eliminar: si tiene nota de entrega, se borra TAMBIÉN la nota y se LIBERA el stock
router.delete('/cotizaciones/:id', async (req, res) => {
    const id = entero(req.params.id);
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const act = await client.query(`SELECT estado FROM ${T_COTIZACIONES} WHERE id = $1 FOR UPDATE`, [id]);
        if (!act.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Cotizacion no encontrada' }); }
        // v8.2: el vendedor TAMBIEN puede borrar cotizaciones (cualquier estado).
        // Si tiene nota de entrega, se borra automatica y se libera el stock (abajo).

        const items = await client.query(`SELECT * FROM ${T_ITEMS} WHERE cotizacion_id = $1`, [id]);
        const notaQ = await client.query(`SELECT * FROM ${T_NOTAS} WHERE cotizacion_id = $1 FOR UPDATE`, [id]);
        let notaEliminada = false;
        if (notaQ.rows.length) {
            // liberar artículos comprometidos por la nota y borrar la nota automáticamente
            await liberarStock(client, items.rows, notaQ.rows[0].forma_pago);
            await client.query(`DELETE FROM ${T_NOTAS} WHERE cotizacion_id = $1`, [id]);
            notaEliminada = true;
        }
        await client.query(`DELETE FROM ${T_COTIZACIONES} WHERE id = $1`, [id]); // items caen por CASCADE
        await client.query('COMMIT');
        res.json({ exito: true, nota_eliminada: notaEliminada, stock_liberado: notaEliminada });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[vendedores] eliminar cotizacion:', e.message);
        res.status(500).json({ error: 'Error al eliminar la cotizacion' });
    } finally {
        client.release();
    }
});

// ============================================================
//  NOTAS DE ENTREGA
// ============================================================

// Convertir: POST /cotizaciones/:id/nota-entrega
// body: { forma_pago, inicial_usd, cuotas_quincenales, primera_fecha }
// MISMO numero que la cotizacion. Solo una vez por cotizacion.
router.post('/cotizaciones/:id/nota-entrega', async (req, res) => {
    const id = entero(req.params.id);
    const b = req.body || {};
    const client = await pool.connect();
    try {
        await client.query('BEGIN');
        const c = await client.query(`SELECT * FROM ${T_COTIZACIONES} WHERE id = $1 FOR UPDATE`, [id]);
        if (!c.rows.length) { await client.query('ROLLBACK'); return res.status(404).json({ error: 'Cotizacion no encontrada' }); }

        const cot = c.rows[0];
        if (parseInt(cot.nota_entrega_generada) === 1) {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Esta cotizacion ya tiene su nota de entrega (' + fmtNumero(cot.numero) + ')' });
        }
        if (cot.estado === 'borrador' || cot.estado === 'rechazada') {
            await client.query('ROLLBACK');
            return res.status(409).json({ error: 'Solo se puede generar nota de entrega de una cotizacion enviada o aprobada' });
        }

        const formaPago = (b.forma_pago === 'credito') ? 'credito' : 'contado';
        const inicial = Math.max(0, num(b.inicial_usd));
        let cuotas = entero(b.cuotas_quincenales, 0);
        let montoCuota = 0;
        let cronograma = [];

        if (formaPago === 'credito') {
            if (cuotas < 1 || cuotas > 8) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Las cuotas quincenales deben ser entre 1 y 8' });
            }
            const resta = Math.max(0, Math.round((num(cot.total_usd) - inicial) * 100) / 100);
            montoCuota = Math.round((resta / cuotas) * 100) / 100;
            // Fechas quincenales: primera_fecha (o hoy + 15 dias), luego cada 15 dias
            let f = texto(b.primera_fecha, 10);
            let base;
            if (f && /^\d{4}-\d{2}-\d{2}$/.test(f)) {
                base = new Date(f + 'T12:00:00Z');
            } else {
                base = new Date();
                base.setUTCDate(base.getUTCDate() + 15);
            }
            let acumulado = 0;
            for (let i = 1; i <= cuotas; i++) {
                // Ajuste de redondeo en la ultima cuota
                let monto = (i === cuotas) ? Math.round((resta - acumulado) * 100) / 100 : montoCuota;
                acumulado = Math.round((acumulado + monto) * 100) / 100;
                const fechaCuota = new Date(base.getTime() + (i - 1) * 15 * 24 * 3600 * 1000);
                cronograma.push({ nro: i, fecha: fechaCuota.toISOString().slice(0, 10), monto_usd: monto });
            }
        }

        // COMPROMETER STOCK al generar la nota (atómico: si otro vendedor está
        // generando una nota del mismo artículo a la vez, el último es rechazado)
        const itemsCot = await client.query(`SELECT * FROM ${T_ITEMS} WHERE cotizacion_id = $1 ORDER BY inventario_id`, [id]);
        await comprometerStock(client, itemsCot.rows, formaPago);

        const ins = await client.query(
            `INSERT INTO ${T_NOTAS} (numero, cotizacion_id, forma_pago, inicial_usd, cuotas_quincenales, monto_cuota_usd, cronograma, created_by)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
            [cot.numero, id, formaPago, inicial, cuotas, montoCuota, JSON.stringify(cronograma), req.usuario.id]);

        await client.query(
            `UPDATE ${T_COTIZACIONES} SET nota_entrega_generada = 1, estado = 'aprobada',
                    updated_at = CURRENT_TIMESTAMP WHERE id = $1`, [id]);

        await client.query('COMMIT');
        const nota = ins.rows[0];
        nota.numero_fmt = fmtNumero(nota.numero);
        res.status(201).json({ exito: true, nota_entrega: nota });
    } catch (e) {
        await client.query('ROLLBACK');
        console.error('[vendedores] generar nota de entrega:', e.message);
        res.status(e.status || 500).json({ error: e.status ? e.message : 'Error al generar la nota de entrega', codigo: e.codigo });
    } finally {
        client.release();
    }
});

// Listar notas: GET /notas-entrega
router.get('/notas-entrega', async (req, res) => {
    try {
        const r = await pool.query(
            `SELECT n.*, c.fecha AS fecha_cotizacion, c.total_usd, c.total_bs, c.tasa_bcv,
                    cl.nombres, cl.apellidos, cl.cedula_rif,
                    u.nombre AS vendedor_nombre
             FROM ${T_NOTAS} n
             JOIN ${T_COTIZACIONES} c ON c.id = n.cotizacion_id
             JOIN ${T_CLIENTES} cl ON cl.id = c.cliente_id
             LEFT JOIN usuarios u ON u.id = n.created_by
             ORDER BY n.numero ASC LIMIT 500`);
        const notas = r.rows.map(x => ({ ...x, numero_fmt: fmtNumero(x.numero) }));
        res.json({ exito: true, notas });
    } catch (e) {
        console.error('[vendedores] listar notas:', e.message);
        res.status(500).json({ error: 'Error al listar notas de entrega' });
    }
});

module.exports = { router, _test: { fmtNumero } };
