-- ============================================================
-- MIGRACION v6.8: Tablas de pagos separadas por tienda
-- 3 tablas: pagos_caracas, pagos_maracay, pagos_maracaibo
-- Cada pago extra (cuota > 11) se guarda aqui
-- ============================================================

-- 1.1 Tabla pagos_caracas
CREATE TABLE IF NOT EXISTS pagos_caracas (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL,
    nro_cuota INTEGER NOT NULL,
    monto_bs NUMERIC(15,2),
    referencia VARCHAR(100),
    fecha DATE,
    tasa_bcv NUMERIC(15,4),
    monto_usd NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(factura_id, nro_cuota)
);

CREATE INDEX IF NOT EXISTS idx_pagos_caracas_factura ON pagos_caracas(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_caracas_cuota ON pagos_caracas(factura_id, nro_cuota);

-- 1.2 Tabla pagos_maracay
CREATE TABLE IF NOT EXISTS pagos_maracay (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL,
    nro_cuota INTEGER NOT NULL,
    monto_bs NUMERIC(15,2),
    referencia VARCHAR(100),
    fecha DATE,
    tasa_bcv NUMERIC(15,4),
    monto_usd NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(factura_id, nro_cuota)
);

CREATE INDEX IF NOT EXISTS idx_pagos_maracay_factura ON pagos_maracay(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_maracay_cuota ON pagos_maracay(factura_id, nro_cuota);

-- 1.3 Tabla pagos_maracaibo
CREATE TABLE IF NOT EXISTS pagos_maracaibo (
    id SERIAL PRIMARY KEY,
    factura_id INTEGER NOT NULL,
    nro_cuota INTEGER NOT NULL,
    monto_bs NUMERIC(15,2),
    referencia VARCHAR(100),
    fecha DATE,
    tasa_bcv NUMERIC(15,4),
    monto_usd NUMERIC(15,2),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(factura_id, nro_cuota)
);

CREATE INDEX IF NOT EXISTS idx_pagos_maracaibo_factura ON pagos_maracaibo(factura_id);
CREATE INDEX IF NOT EXISTS idx_pagos_maracaibo_cuota ON pagos_maracaibo(factura_id, nro_cuota);

-- 2. Verificacion
SELECT 'pagos_caracas' AS tabla, COUNT(*) AS registros FROM pagos_caracas
UNION ALL
SELECT 'pagos_maracay' AS tabla, COUNT(*) AS registros FROM pagos_maracay
UNION ALL
SELECT 'pagos_maracaibo' AS tabla, COUNT(*) AS registros FROM pagos_maracaibo;
