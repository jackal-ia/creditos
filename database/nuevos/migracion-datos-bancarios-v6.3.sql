-- ============================================================
-- MIGRACIÓN DATOS BANCARIOS v6.3 — Sistema de Créditos IPSFA
-- ============================================================
-- Agrega a las TRES tablas de tienda los campos:
--   * numero_cuenta  VARCHAR(20)  — cuenta bancaria del cliente
--   * banco          VARCHAR(100) — nombre del banco (se detecta
--                                   automáticamente en el frontend
--                                   por los primeros 4 dígitos)
-- Es idempotente (IF NOT EXISTS): puede ejecutarse varias veces.
--
-- Instalación (Windows, desde la raíz del proyecto):
--   "C:\Program Files\PostgreSQL\<tu-version>\bin\psql.exe" -U postgres -d creditos -f database\migracion-datos-bancarios-v6.3.sql
-- (o doble clic en instalar-datos-bancarios.bat)
-- ============================================================

ALTER TABLE tienda_caracas
    ADD COLUMN IF NOT EXISTS numero_cuenta VARCHAR(20),
    ADD COLUMN IF NOT EXISTS banco VARCHAR(100);

ALTER TABLE tienda_maracay
    ADD COLUMN IF NOT EXISTS numero_cuenta VARCHAR(20),
    ADD COLUMN IF NOT EXISTS banco VARCHAR(100);

ALTER TABLE tienda_maracaibo
    ADD COLUMN IF NOT EXISTS numero_cuenta VARCHAR(20),
    ADD COLUMN IF NOT EXISTS banco VARCHAR(100);

-- Índice opcional para búsquedas por número de cuenta (una por tabla)
CREATE INDEX IF NOT EXISTS idx_caracas_cuenta   ON tienda_caracas(numero_cuenta);
CREATE INDEX IF NOT EXISTS idx_maracay_cuenta   ON tienda_maracay(numero_cuenta);
CREATE INDEX IF NOT EXISTS idx_maracaibo_cuenta ON tienda_maracaibo(numero_cuenta);

-- ------------------------------------------------------------
-- VERIFICACIÓN: debe devolver 6 filas (2 columnas × 3 tablas)
-- ------------------------------------------------------------
SELECT table_name, column_name, data_type, character_maximum_length AS largo
FROM information_schema.columns
WHERE table_name IN ('tienda_caracas', 'tienda_maracay', 'tienda_maracaibo')
  AND column_name IN ('numero_cuenta', 'banco')
ORDER BY table_name, column_name;

-- ============================================================
-- FIN MIGRACIÓN v6.3
-- ============================================================
