-- ============================================================
-- ACTUALIZAR: Campo cuotas = 4 en TODA la base de datos
-- ============================================================

UPDATE tienda_caracas SET cuotas = 4;
UPDATE tienda_maracay SET cuotas = 4;
UPDATE tienda_maracaibo SET cuotas = 4;

-- Verificar
SELECT 'tienda_caracas' AS tabla, COUNT(*) AS total, COUNT(*) FILTER (WHERE cuotas = 4) AS con_4 FROM tienda_caracas
UNION ALL
SELECT 'tienda_maracay', COUNT(*), COUNT(*) FILTER (WHERE cuotas = 4) FROM tienda_maracay
UNION ALL
SELECT 'tienda_maracaibo', COUNT(*), COUNT(*) FILTER (WHERE cuotas = 4) FROM tienda_maracaibo;
