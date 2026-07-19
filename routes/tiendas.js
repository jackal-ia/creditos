// ============================================================
// RUTAS GENÉRICAS DE TIENDAS - CRUD unificado
// ============================================================
// Un solo conjunto de handlers para TODAS las tiendas.
// Reemplaza los 3 bloques inline duplicados que existían en
// server.js (tienda-caracas / tienda-maracay / tienda-maracaibo).
//
// Endpoints nuevos (paramétricos):
//   GET    /api/tiendas/:tienda
//   GET    /api/tiendas/:tienda/:id
//   POST   /api/tiendas/:tienda
//   PUT    /api/tiendas/:tienda/:id
//   DELETE /api/tiendas/:tienda/:id
//
// Endpoints legacy (siguen funcionando para no romper nada):
//   /api/tienda-caracas  -> tienda = 'caracas'
//   /api/tienda-maracay  -> tienda = 'maracay'
//   /api/tienda-maracaibo -> tienda = 'maracaibo'
//
// Para agregar una tienda nueva: añadir UNA línea en TIENDAS.
// ============================================================

const express = require('express');
const pool = require('../config/database');
// FIX SEGURIDAD (v6.1): estas rutas antes NO pedían token —
// cualquier equipo de la red podía leer/modificar/borrar clientes.
const { verificarToken, soloAdmin } = require('../middleware/auth');

// ------------------------------------------------------------
// WHITELIST DE TIENDAS: clave pública -> tabla real en PostgreSQL
// (la clave nunca se interpola en SQL sin validarse aquí primero)
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
    // v6.3: datos bancarios del cliente (las 3 tiendas comparten whitelist)
    'numero_cuenta', 'banco'
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

const DATE_FIELDS = ['fecha_factura', ...Array.from({ length: 11 }, (_, i) => `fecha_cuota_${i + 1}`)];

// ------------------------------------------------------------
// Helpers (misma lógica que existía en server.js)
// ------------------------------------------------------------
const toNullIfEmpty = (val) => {
    if (val === undefined || val === null || val === '' || val === 'null' || val === 'undefined') {
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

// ------------------------------------------------------------
// Middleware: valida :tienda contra la whitelist y deja
// req.tablaTienda con el nombre real de la tabla.
// ------------------------------------------------------------
function validarTienda(req, res, next) {
    const tabla = TIENDAS[req.params.tienda];
    if (!tabla) {
        return res.status(400).json({
            error: 'Tienda no válida',
            tiendas_disponibles: Object.keys(TIENDAS)
        });
    }
    // Operadores: solo SU tienda (forzado en servidor desde la BD)
    if (req.usuario && req.usuario.rol === 'operador' && req.usuario.tienda
        && req.params.tienda !== req.usuario.tienda) {
        return res.status(403).json({ error: 'No tiene acceso a esta tienda' });
    }
    req.tablaTienda = tabla;
    req.tienda = req.params.tienda;
    next();
}

// ------------------------------------------------------------
// Handlers (usan req.tablaTienda, nunca input del usuario en SQL)
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

async function crearCliente(req, res) {
    try {
        const data = req.body;
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
        res.status(201).json({ success: true, message: 'Cliente creado', data: result.rows[0] });

    } catch (error) {
        console.error(`Error al crear cliente (${req.tablaTienda}):`, error);
        res.status(500).json({ error: 'Error al crear cliente', details: error.message });
    }
}

async function actualizarCliente(req, res) {
    try {
        const { id } = req.params;
        const data = req.body;

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

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        paramCount++;
        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        values.push(id);

        const query = `UPDATE ${req.tablaTienda} SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ success: true, message: 'Cliente actualizado', data: result.rows[0] });

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
// ------------------------------------------------------------
const router = express.Router();
router.get('/:tienda', verificarToken, validarTienda, listarClientes);
router.get('/:tienda/:id', verificarToken, validarTienda, obtenerCliente);
router.post('/:tienda', verificarToken, validarTienda, crearCliente);
router.put('/:tienda/:id', verificarToken, validarTienda, actualizarCliente);
router.delete('/:tienda/:id', verificarToken, soloAdmin, validarTienda, eliminarCliente);

// ------------------------------------------------------------
// Factory de routers legacy: fija la tienda y expone las mismas
// rutas que antes vivían inline en server.js.
//   createLegacyRouter('caracas') -> GET/POST '/', GET/PUT/DELETE '/:id'
// ------------------------------------------------------------
function createLegacyRouter(tiendaKey) {
    const legacyRouter = express.Router();

    // Token obligatorio también en los aliases legacy
    legacyRouter.use(verificarToken);

    // Inyecta la tabla correspondiente sin necesidad de :tienda en la URL
    legacyRouter.use((req, res, next) => {
        // Operadores: solo SU tienda
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
