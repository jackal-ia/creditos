-- ============================================================
-- MIGRACION v6.7.6: Calcular monto_cuota_usd faltante
-- Ejecutar en pgAdmin Query Editor (pestaña Query, NO Console)
-- ============================================================

-- 1. Funcion helper para redondear a 2 decimales
CREATE OR REPLACE FUNCTION round2(numeric)
RETURNS numeric AS $$
BEGIN
    RETURN ROUND($1::numeric, 2);
END;
$$ LANGUAGE plpgsql;

-- 2. TIENDA CARACAS
UPDATE tienda_caracas
SET monto_cuota_usd = round2(
    (COALESCE(monto_facturado_divisa, 0) - COALESCE(inicial_usd, 0)) 
    / NULLIF(cuotas, 0)
)
WHERE (
    monto_cuota_usd IS NULL 
    OR monto_cuota_usd = 0 
    OR monto_cuota_usd::text IN ('0.0','0.00','0.000','0.0000')
)
AND monto_facturado_divisa > 0
AND cuotas > 0;

-- 3. TIENDA MARACAY
UPDATE tienda_maracay
SET monto_cuota_usd = round2(
    (COALESCE(monto_facturado_divisa, 0) - COALESCE(inicial_usd, 0)) 
    / NULLIF(cuotas, 0)
)
WHERE (
    monto_cuota_usd IS NULL 
    OR monto_cuota_usd = 0 
    OR monto_cuota_usd::text IN ('0.0','0.00','0.000','0.0000')
)
AND monto_facturado_divisa > 0
AND cuotas > 0;

-- 4. TIENDA MARACAIBO
UPDATE tienda_maracaibo
SET monto_cuota_usd = round2(
    (COALESCE(monto_facturado_divisa, 0) - COALESCE(inicial_usd, 0)) 
    / NULLIF(cuotas, 0)
)
WHERE (
    monto_cuota_usd IS NULL 
    OR monto_cuota_usd = 0 
    OR monto_cuota_usd::text IN ('0.0','0.00','0.000','0.0000')
)
AND monto_facturado_divisa > 0
AND cuotas > 0;

-- 5. VERIFICACION: registros que aun quedan sin monto_cuota_usd
SELECT 'tienda_caracas'  AS tabla, COUNT(*) AS sin_monto_cuota 
FROM tienda_caracas  
WHERE monto_cuota_usd IS NULL OR monto_cuota_usd = 0
UNION ALL
SELECT 'tienda_maracay'  AS tabla, COUNT(*) AS sin_monto_cuota 
FROM tienda_maracay  
WHERE monto_cuota_usd IS NULL OR monto_cuota_usd = 0
UNION ALL
SELECT 'tienda_maracaibo' AS tabla, COUNT(*) AS sin_monto_cuota 
FROM tienda_maracaibo 
WHERE monto_cuota_usd IS NULL OR monto_cuota_usd = 0;

-- 6. VERIFICACION: 5 ejemplos actualizados por tienda
SELECT 'CARACAS' AS tienda, id, nro_factura, nombre_apellido, 
       monto_facturado_divisa, inicial_usd, cuotas, monto_cuota_usd
FROM tienda_caracas 
WHERE monto_cuota_usd > 0 
ORDER BY id DESC 
LIMIT 5;

SELECT 'MARACAY' AS tienda, id, nro_factura, nombre_apellido, 
       monto_facturado_divisa, inicial_usd, cuotas, monto_cuota_usd
FROM tienda_maracay 
WHERE monto_cuota_usd > 0 
ORDER BY id DESC 
LIMIT 5;

SELECT 'MARACAIBO' AS tienda, id, nro_factura, nombre_apellido, 
       monto_facturado_divisa, inicial_usd, cuotas, monto_cuota_usd
FROM tienda_maracaibo 
WHERE monto_cuota_usd > 0 
ORDER BY id DESC 
LIMIT 5;
