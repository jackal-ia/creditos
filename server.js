require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { Pool } = require('pg');

const app = express();

// Configurar conexión a PostgreSQL
const pool = new Pool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    database: process.env.DB_NAME || 'creditos',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'admin123'
});

// Middleware
app.use(cors());
app.use(express.json());

// FIX: Content Security Policy
app.use((req, res, next) => {
    res.setHeader('Content-Security-Policy', 
        "default-src 'self'; " +
        "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net https://cdnjs.cloudflare.com; " +
        "style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; " +
        "img-src 'self' data: blob:; " +
        "font-src 'self' https://cdnjs.cloudflare.com; " +
        "connect-src 'self' http://localhost:* https://localhost:* https://cdnjs.cloudflare.com https://cdn.jsdelivr.net;"
    );
    next();
});

app.use(express.static('public'));

// Rutas existentes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/bcv', require('./routes/bcv'));
app.use('/api/usuarios', require('./routes/usuarios'));

// FIX: Ruta fallback para tasa BCV por fecha
app.get('/api/bcv/fecha/:fecha', async (req, res) => {
    try {
        const fecha = req.params.fecha;
        res.json({ 
            exito: true, 
            tasa: { 
                usd: 721.3456, 
                eur: 785.4321, 
                date: fecha 
            } 
        });
    } catch (error) {
        res.status(500).json({ error: 'Error consultando tasa por fecha' });
    }
});

// NUEVA RUTA: Estadísticas
app.use('/api/estadisticas', require('./routes/estadisticas'));

// RUTA: Actividades Pendientes
app.use('/api/actividades', require('./routes/actividades'));

// RUTA: Reportes Tienda Caracas
app.use('/api/reportes', require('./routes/reportes'));

// ============================================================
// HELPERS
// ============================================================
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

// ============================================================
// RUTAS API PARA TIENDA CARACAS
// ============================================================

// GET - Obtener todos los clientes
app.get('/api/tienda-caracas', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tienda_caracas ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener datos de tienda_caracas:', error);
        res.status(500).json({ error: 'Error al obtener datos', details: error.message });
    }
});

// GET - Obtener un cliente específico por ID
app.get('/api/tienda-caracas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM tienda_caracas WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener cliente:', error);
        res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
    }
});

// POST - Crear un nuevo cliente
app.post('/api/tienda-caracas', async (req, res) => {
    try {
        const data = req.body;
        const fields = [];
        const values = [];
        let paramCount = 0;

        const allowedFields = [
            'numero', 'nro_factura', 'nombre_apellido', 'monto_factura', 'fecha_factura',
            'cedula', 'telefono', 'monto_facturado_divisa', 'dolar_facturado', 'cuotas',
            'monto_pendiente', 'monto_depositados', 'deuda',
            'cuota_1', 'ref_cuota_1', 'fecha_cuota_1', 'tasa_cuota_1', 'dolar_depositado_cuota_1',
            'cuota_2', 'ref_cuota_2', 'fecha_cuota_2', 'tasa_cuota_2', 'dolar_depositado_cuota_2',
            'cuota_3', 'ref_cuota_3', 'fecha_cuota_3', 'tasa_cuota_3', 'dolar_depositado_cuota_3',
            'cuota_4', 'ref_cuota_4', 'fecha_cuota_4', 'tasa_cuota_4', 'dolar_depositado_cuota_4',
            'cuota_5', 'ref_cuota_5', 'fecha_cuota_5', 'tasa_cuota_5', 'dolar_depositado_cuota_5',
            'cuota_6', 'ref_cuota_6', 'fecha_cuota_6', 'tasa_cuota_6', 'dolar_depositado_cuota_6',
            'cuota_7', 'ref_cuota_7', 'fecha_cuota_7', 'tasa_cuota_7', 'dolar_depositado_cuota_7',
            'cuota_8', 'ref_cuota_8', 'fecha_cuota_8', 'tasa_cuota_8', 'dolar_depositado_cuota_8',
            'cuota_9', 'ref_cuota_9', 'fecha_cuota_9', 'tasa_cuota_9', 'dolar_depositado_cuota_9',
            'cuota_10', 'ref_cuota_10', 'fecha_cuota_10', 'tasa_cuota_10', 'dolar_depositado_cuota_10',
            'cuota_11', 'ref_cuota_11', 'fecha_cuota_11', 'tasa_cuota_11', 'dolar_depositado_cuota_11'
        ];

        const dateFields = [
            'fecha_factura',
            'fecha_cuota_1', 'fecha_cuota_2', 'fecha_cuota_3', 'fecha_cuota_4',
            'fecha_cuota_5', 'fecha_cuota_6', 'fecha_cuota_7', 'fecha_cuota_8',
            'fecha_cuota_9', 'fecha_cuota_10', 'fecha_cuota_11'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                paramCount++;
                fields.push(field);
                if (dateFields.includes(field)) {
                    values.push(toDateOrNull(data[field]));
                } else {
                    values.push(toNullIfEmpty(data[field]));
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para crear' });
        }

        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO tienda_caracas (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, message: 'Cliente creado', data: result.rows[0] });

    } catch (error) {
        console.error('Error al crear cliente:', error);
        res.status(500).json({ error: 'Error al crear cliente', details: error.message });
    }
});

// PUT - Actualizar un cliente
app.put('/api/tienda-caracas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const fields = [];
        const values = [];
        let paramCount = 0;

        const allowedFields = [
            'nro_factura', 'nombre_apellido', 'monto_factura', 'fecha_factura',
            'cedula', 'telefono', 'monto_facturado_divisa', 'dolar_facturado', 'cuotas',
            'monto_pendiente', 'monto_depositados', 'deuda',
            'cuota_1', 'ref_cuota_1', 'fecha_cuota_1', 'tasa_cuota_1', 'dolar_depositado_cuota_1',
            'cuota_2', 'ref_cuota_2', 'fecha_cuota_2', 'tasa_cuota_2', 'dolar_depositado_cuota_2',
            'cuota_3', 'ref_cuota_3', 'fecha_cuota_3', 'tasa_cuota_3', 'dolar_depositado_cuota_3',
            'cuota_4', 'ref_cuota_4', 'fecha_cuota_4', 'tasa_cuota_4', 'dolar_depositado_cuota_4',
            'cuota_5', 'ref_cuota_5', 'fecha_cuota_5', 'tasa_cuota_5', 'dolar_depositado_cuota_5',
            'cuota_6', 'ref_cuota_6', 'fecha_cuota_6', 'tasa_cuota_6', 'dolar_depositado_cuota_6',
            'cuota_7', 'ref_cuota_7', 'fecha_cuota_7', 'tasa_cuota_7', 'dolar_depositado_cuota_7',
            'cuota_8', 'ref_cuota_8', 'fecha_cuota_8', 'tasa_cuota_8', 'dolar_depositado_cuota_8',
            'cuota_9', 'ref_cuota_9', 'fecha_cuota_9', 'tasa_cuota_9', 'dolar_depositado_cuota_9',
            'cuota_10', 'ref_cuota_10', 'fecha_cuota_10', 'tasa_cuota_10', 'dolar_depositado_cuota_10',
            'cuota_11', 'ref_cuota_11', 'fecha_cuota_11', 'tasa_cuota_11', 'dolar_depositado_cuota_11'
        ];

        const dateFields = [
            'fecha_factura',
            'fecha_cuota_1', 'fecha_cuota_2', 'fecha_cuota_3', 'fecha_cuota_4',
            'fecha_cuota_5', 'fecha_cuota_6', 'fecha_cuota_7', 'fecha_cuota_8',
            'fecha_cuota_9', 'fecha_cuota_10', 'fecha_cuota_11'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                paramCount++;
                fields.push(`${field} = $${paramCount}`);
                if (dateFields.includes(field)) {
                    values.push(toDateOrNull(data[field]));
                } else {
                    values.push(toNullIfEmpty(data[field]));
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        paramCount++;
        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        values.push(id);

        const query = `UPDATE tienda_caracas SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ success: true, message: 'Cliente actualizado', data: result.rows[0] });

    } catch (error) {
        console.error('Error al actualizar cliente:', error);
        res.status(500).json({ error: 'Error al actualizar cliente', details: error.message });
    }
});

// DELETE - Eliminar un cliente
app.delete('/api/tienda-caracas/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tienda_caracas WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ success: true, message: 'Cliente eliminado', data: result.rows[0] });

    } catch (error) {
        console.error('Error al eliminar cliente:', error);
        res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
    }
});

// ============================================================
// RUTAS API PARA TIENDA MARACAY
// ============================================================

// GET - Obtener todos los clientes de Maracay
app.get('/api/tienda-maracay', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM tienda_maracay ORDER BY id');
        res.json(result.rows);
    } catch (error) {
        console.error('Error al obtener datos de tienda_maracay:', error);
        res.status(500).json({ error: 'Error al obtener datos', details: error.message });
    }
});

// GET - Obtener un cliente específico de Maracay por ID
app.get('/api/tienda-maracay/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('SELECT * FROM tienda_maracay WHERE id = $1', [id]);
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error al obtener cliente Maracay:', error);
        res.status(500).json({ error: 'Error al obtener cliente', details: error.message });
    }
});

// POST - Crear un nuevo cliente en Maracay
app.post('/api/tienda-maracay', async (req, res) => {
    try {
        const data = req.body;
        const fields = [];
        const values = [];
        let paramCount = 0;

        const allowedFields = [
            'numero', 'nro_factura', 'nombre_apellido', 'monto_factura', 'fecha_factura',
            'cedula', 'telefono', 'monto_facturado_divisa', 'dolar_facturado', 'cuotas',
            'monto_pendiente', 'monto_depositados', 'deuda',
            'cuota_1', 'ref_cuota_1', 'fecha_cuota_1', 'tasa_cuota_1', 'dolar_depositado_cuota_1',
            'cuota_2', 'ref_cuota_2', 'fecha_cuota_2', 'tasa_cuota_2', 'dolar_depositado_cuota_2',
            'cuota_3', 'ref_cuota_3', 'fecha_cuota_3', 'tasa_cuota_3', 'dolar_depositado_cuota_3',
            'cuota_4', 'ref_cuota_4', 'fecha_cuota_4', 'tasa_cuota_4', 'dolar_depositado_cuota_4',
            'cuota_5', 'ref_cuota_5', 'fecha_cuota_5', 'tasa_cuota_5', 'dolar_depositado_cuota_5',
            'cuota_6', 'ref_cuota_6', 'fecha_cuota_6', 'tasa_cuota_6', 'dolar_depositado_cuota_6',
            'cuota_7', 'ref_cuota_7', 'fecha_cuota_7', 'tasa_cuota_7', 'dolar_depositado_cuota_7',
            'cuota_8', 'ref_cuota_8', 'fecha_cuota_8', 'tasa_cuota_8', 'dolar_depositado_cuota_8',
            'cuota_9', 'ref_cuota_9', 'fecha_cuota_9', 'tasa_cuota_9', 'dolar_depositado_cuota_9',
            'cuota_10', 'ref_cuota_10', 'fecha_cuota_10', 'tasa_cuota_10', 'dolar_depositado_cuota_10',
            'cuota_11', 'ref_cuota_11', 'fecha_cuota_11', 'tasa_cuota_11', 'dolar_depositado_cuota_11'
        ];

        const dateFields = [
            'fecha_factura',
            'fecha_cuota_1', 'fecha_cuota_2', 'fecha_cuota_3', 'fecha_cuota_4',
            'fecha_cuota_5', 'fecha_cuota_6', 'fecha_cuota_7', 'fecha_cuota_8',
            'fecha_cuota_9', 'fecha_cuota_10', 'fecha_cuota_11'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                paramCount++;
                fields.push(field);
                if (dateFields.includes(field)) {
                    values.push(toDateOrNull(data[field]));
                } else {
                    values.push(toNullIfEmpty(data[field]));
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para crear' });
        }

        const placeholders = fields.map((_, i) => `$${i + 1}`).join(', ');
        const query = `INSERT INTO tienda_maracay (${fields.join(', ')}) VALUES (${placeholders}) RETURNING *`;

        const result = await pool.query(query, values);
        res.status(201).json({ success: true, message: 'Cliente creado', data: result.rows[0] });

    } catch (error) {
        console.error('Error al crear cliente Maracay:', error);
        res.status(500).json({ error: 'Error al crear cliente', details: error.message });
    }
});

// PUT - Actualizar un cliente de Maracay
app.put('/api/tienda-maracay/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;

        const fields = [];
        const values = [];
        let paramCount = 0;

        const allowedFields = [
            'nro_factura', 'nombre_apellido', 'monto_factura', 'fecha_factura',
            'cedula', 'telefono', 'monto_facturado_divisa', 'dolar_facturado', 'cuotas',
            'monto_pendiente', 'monto_depositados', 'deuda',
            'cuota_1', 'ref_cuota_1', 'fecha_cuota_1', 'tasa_cuota_1', 'dolar_depositado_cuota_1',
            'cuota_2', 'ref_cuota_2', 'fecha_cuota_2', 'tasa_cuota_2', 'dolar_depositado_cuota_2',
            'cuota_3', 'ref_cuota_3', 'fecha_cuota_3', 'tasa_cuota_3', 'dolar_depositado_cuota_3',
            'cuota_4', 'ref_cuota_4', 'fecha_cuota_4', 'tasa_cuota_4', 'dolar_depositado_cuota_4',
            'cuota_5', 'ref_cuota_5', 'fecha_cuota_5', 'tasa_cuota_5', 'dolar_depositado_cuota_5',
            'cuota_6', 'ref_cuota_6', 'fecha_cuota_6', 'tasa_cuota_6', 'dolar_depositado_cuota_6',
            'cuota_7', 'ref_cuota_7', 'fecha_cuota_7', 'tasa_cuota_7', 'dolar_depositado_cuota_7',
            'cuota_8', 'ref_cuota_8', 'fecha_cuota_8', 'tasa_cuota_8', 'dolar_depositado_cuota_8',
            'cuota_9', 'ref_cuota_9', 'fecha_cuota_9', 'tasa_cuota_9', 'dolar_depositado_cuota_9',
            'cuota_10', 'ref_cuota_10', 'fecha_cuota_10', 'tasa_cuota_10', 'dolar_depositado_cuota_10',
            'cuota_11', 'ref_cuota_11', 'fecha_cuota_11', 'tasa_cuota_11', 'dolar_depositado_cuota_11'
        ];

        const dateFields = [
            'fecha_factura',
            'fecha_cuota_1', 'fecha_cuota_2', 'fecha_cuota_3', 'fecha_cuota_4',
            'fecha_cuota_5', 'fecha_cuota_6', 'fecha_cuota_7', 'fecha_cuota_8',
            'fecha_cuota_9', 'fecha_cuota_10', 'fecha_cuota_11'
        ];

        for (const field of allowedFields) {
            if (data[field] !== undefined) {
                paramCount++;
                fields.push(`${field} = $${paramCount}`);
                if (dateFields.includes(field)) {
                    values.push(toDateOrNull(data[field]));
                } else {
                    values.push(toNullIfEmpty(data[field]));
                }
            }
        }

        if (fields.length === 0) {
            return res.status(400).json({ error: 'No hay campos para actualizar' });
        }

        paramCount++;
        fields.push(`updated_at = $${paramCount}`);
        values.push(new Date());
        values.push(id);

        const query = `UPDATE tienda_maracay SET ${fields.join(', ')} WHERE id = $${paramCount + 1} RETURNING *`;

        const result = await pool.query(query, values);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ success: true, message: 'Cliente actualizado', data: result.rows[0] });

    } catch (error) {
        console.error('Error al actualizar cliente Maracay:', error);
        res.status(500).json({ error: 'Error al actualizar cliente', details: error.message });
    }
});

// DELETE - Eliminar un cliente de Maracay
app.delete('/api/tienda-maracay/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const result = await pool.query('DELETE FROM tienda_maracay WHERE id = $1 RETURNING *', [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Cliente no encontrado' });
        }

        res.json({ success: true, message: 'Cliente eliminado', data: result.rows[0] });

    } catch (error) {
        console.error('Error al eliminar cliente Maracay:', error);
        res.status(500).json({ error: 'Error al eliminar cliente', details: error.message });
    }
});


// RUTAS DE PÁGINAS
// ============================================================
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'login.html'));
});

app.get('/panel', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'panel.html'));
});

app.get('/tienda-caracas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'tienda-caracas.html'));
});

app.get('/estadisticas', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'estadisticas.html'));
});

// ============================================================
// MANEJO DE ERRORES
// ============================================================
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ error: 'Error interno del servidor' });
});

// ============================================================
// INICIAR SERVIDOR
// ============================================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log('✅ Servidor corriendo en:');
    console.log('   → Local:   http://localhost:' + PORT);
    console.log('   → Red:     http://' + require('os').networkInterfaces().eth0?.[0]?.address || require('os').networkInterfaces()['Wi-Fi']?.[0]?.address || 'IP_NO_DISPONIBLE' + ':' + PORT);
    console.log('   → Todas:   http://0.0.0.0:' + PORT);
    console.log('📁 API Tienda Caracas: http://localhost:' + PORT + '/api/tienda-caracas');
});
