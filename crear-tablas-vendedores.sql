-- ============================================================
--  MÓDULO VENDEDORES v8.x — Creación de tablas faltantes (v9.3.6)
--  El respaldo de la BD es anterior al módulo vendedor, por eso
--  estas tablas no existen (error: relation "..." does not exist).
--  Ejecutar UNA SOLA VEZ. Es idempotente (IF NOT EXISTS).
--
--  Reproduce el esquema EXACTO que espera routes/vendedores.js:
--  clientes, inventario (con stock y vendidos), cotizaciones,
--  ítems (cascade) y notas de entrega (cronograma JSONB).
--  created_by usa ON DELETE SET NULL para no chocar con el
--  nuevo "eliminar usuario permanentemente".
-- ============================================================

CREATE TABLE IF NOT EXISTS vendedores_clientes_caracas (
    id            SERIAL PRIMARY KEY,
    nombres       VARCHAR(100) NOT NULL,
    apellidos     VARCHAR(100) NOT NULL,
    cedula_rif    VARCHAR(20)  NOT NULL,
    telefono      VARCHAR(30),
    ocupacion     VARCHAR(100),
    es_militar    INTEGER DEFAULT 0,
    direccion     VARCHAR(500),
    sexo          VARCHAR(20),
    email         VARCHAR(120),
    created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_vcc_cedula ON vendedores_clientes_caracas(cedula_rif);
CREATE INDEX IF NOT EXISTS idx_vcc_nombre ON vendedores_clientes_caracas(apellidos, nombres);

CREATE TABLE IF NOT EXISTS inventario_caracas (
    id                   SERIAL PRIMARY KEY,
    codigo               VARCHAR(30)  NOT NULL,
    descripcion          VARCHAR(200) NOT NULL,
    cantidad_disponible  INTEGER DEFAULT 0,
    precio_contado       NUMERIC(12,2) DEFAULT 0,
    precio_credito       NUMERIC(12,2) DEFAULT 0,
    vendido_contado      INTEGER DEFAULT 0,
    vendido_credito      INTEGER DEFAULT 0,
    activo               INTEGER DEFAULT 1,
    created_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at           TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_inv_codigo ON inventario_caracas(codigo);

CREATE TABLE IF NOT EXISTS cotizaciones_caracas (
    id                    SERIAL PRIMARY KEY,
    numero                INTEGER NOT NULL,
    fecha                 DATE DEFAULT CURRENT_DATE,
    cliente_id            INTEGER NOT NULL REFERENCES vendedores_clientes_caracas(id),
    tipo_precio           VARCHAR(10) DEFAULT 'contado',
    moneda                VARCHAR(5)  DEFAULT 'USD',
    tasa_bcv              NUMERIC(12,4),
    subtotal_usd          NUMERIC(14,2) DEFAULT 0,
    total_usd             NUMERIC(14,2) DEFAULT 0,
    total_bs              NUMERIC(14,2) DEFAULT 0,
    estado                VARCHAR(12) DEFAULT 'borrador',
    nota_entrega_generada INTEGER DEFAULT 0,
    observaciones         VARCHAR(500),
    created_by            INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_cot_cliente ON cotizaciones_caracas(cliente_id);

CREATE TABLE IF NOT EXISTS cotizaciones_items_caracas (
    id                   SERIAL PRIMARY KEY,
    cotizacion_id        INTEGER NOT NULL REFERENCES cotizaciones_caracas(id) ON DELETE CASCADE,
    inventario_id        INTEGER REFERENCES inventario_caracas(id) ON DELETE SET NULL,
    codigo               VARCHAR(30),
    descripcion          VARCHAR(200),
    cantidad             INTEGER DEFAULT 1,
    precio_unitario_usd  NUMERIC(12,2) DEFAULT 0,
    subtotal_usd         NUMERIC(14,2) DEFAULT 0
);
CREATE INDEX IF NOT EXISTS idx_items_cot ON cotizaciones_items_caracas(cotizacion_id);

CREATE TABLE IF NOT EXISTS notas_entrega_caracas (
    id                 SERIAL PRIMARY KEY,
    numero             INTEGER NOT NULL,
    cotizacion_id      INTEGER NOT NULL REFERENCES cotizaciones_caracas(id) ON DELETE CASCADE,
    forma_pago         VARCHAR(10) DEFAULT 'contado',
    inicial_usd        NUMERIC(12,2) DEFAULT 0,
    cuotas_quincenales INTEGER DEFAULT 0,
    monto_cuota_usd    NUMERIC(12,2) DEFAULT 0,
    cronograma         JSONB,
    created_by         INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at         TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notas_cot ON notas_entrega_caracas(cotizacion_id);

-- Fin del script. Debe responder: CREATE TABLE ×5 + CREATE INDEX ×6
