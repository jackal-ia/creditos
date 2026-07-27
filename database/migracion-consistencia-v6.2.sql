-- ============================================================
-- MIGRACIÓN DE CONSISTENCIA v6.2 — Sistema de Créditos IPSFA
-- ============================================================
-- Corrige los hallazgos de esquema H-06, H-07 y H-08 del Informe
-- Técnico v6.1 (sección 11). Es idempotente: puede ejecutarse
-- varias veces sin error (IF NOT EXISTS / OR REPLACE / DROP IF EXISTS).
--
-- Instalación (Windows, desde la carpeta del proyecto):
--   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d creditos -f database\migracion-consistencia-v6.2.sql
-- ============================================================

-- ------------------------------------------------------------
-- H-06: tienda_maracaibo carece de created_at
-- (sus pares caracas y maracay sí la tienen)
-- ------------------------------------------------------------
ALTER TABLE tienda_maracaibo
    ADD COLUMN IF NOT EXISTS created_at timestamp without time zone DEFAULT CURRENT_TIMESTAMP;

-- ------------------------------------------------------------
-- H-07: el trigger que actualiza updated_at existe solo en Maracay.
-- Se generaliza la función y se crea para Caracas y Maracaibo.
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION update_tienda_updated_at()
RETURNS trigger AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_tienda_caracas ON tienda_caracas;
CREATE TRIGGER trigger_update_tienda_caracas
    BEFORE UPDATE ON tienda_caracas
    FOR EACH ROW EXECUTE FUNCTION update_tienda_updated_at();

DROP TRIGGER IF EXISTS trigger_update_tienda_maracaibo ON tienda_maracaibo;
CREATE TRIGGER trigger_update_tienda_maracaibo
    BEFORE UPDATE ON tienda_maracaibo
    FOR EACH ROW EXECUTE FUNCTION update_tienda_updated_at();

-- ------------------------------------------------------------
-- H-08: cobertura de índices desigual entre tiendas.
-- Se homologan los índices de búsqueda más usados por el módulo.
-- ------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_maracaibo_nombre ON tienda_maracaibo(nombre_apellido);
CREATE INDEX IF NOT EXISTS idx_maracaibo_deuda  ON tienda_maracaibo(deuda);
CREATE INDEX IF NOT EXISTS idx_caracas_deuda    ON tienda_caracas(deuda);
CREATE INDEX IF NOT EXISTS idx_caracas_fecha    ON tienda_caracas(fecha_factura);

-- ------------------------------------------------------------
-- VERIFICACIÓN POST-MIGRACIÓN
-- ------------------------------------------------------------
-- Debe devolver 1 fila (la columna ya existe):
SELECT column_name FROM information_schema.columns
WHERE table_name = 'tienda_maracaibo' AND column_name = 'created_at';

-- Debe devolver 3 filas (un trigger por tienda):
SELECT event_object_table AS tabla, trigger_name
FROM information_schema.triggers
WHERE trigger_name LIKE 'trigger_update_tienda%'
ORDER BY event_object_table;

-- ============================================================
-- FIN MIGRACIÓN v6.2
-- ============================================================
