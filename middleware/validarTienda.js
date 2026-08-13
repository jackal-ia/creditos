// ============================================================
// MIDDLEWARE: validarTienda.js  (v6.7.2-rev9)
// Sanitización de parámetro tienda contra whitelist.
// Aplicar a TODAS las rutas de tiendas para prevenir inyección.
// ============================================================

const TIENDAS_PERMITIDAS = ['caracas', 'maracay', 'maracaibo'];

function validarTienda(req, res, next) {
    const tienda = req.params.tienda ? req.params.tienda.toLowerCase().trim() : '';
    if (!TIENDAS_PERMITIDAS.includes(tienda)) {
        return res.status(400).json({ error: 'Tienda no válida', tiendas_disponibles: TIENDAS_PERMITIDAS });
    }
    req.params.tienda = tienda;
    next();
}

module.exports = { validarTienda, TIENDAS_PERMITIDAS };
