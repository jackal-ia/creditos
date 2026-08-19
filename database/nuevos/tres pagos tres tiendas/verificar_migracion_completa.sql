-- ============================================================
-- VERIFICACION COMPLETA: Migracion tienda_caracas -> pagos_caracas
-- Compara cada cuota (1-11) entre columnas planas y tabla de pagos
-- ============================================================

-- 1. VERIFICAR CUOTAS 1-11: Comparar columnas planas vs tabla pagos
-- Muestra SOLO las discrepancias (si todo está bien, no devuelve filas)
SELECT 
    t.id AS factura_id,
    t.nro_factura,
    t.nombre_apellido,
    'cuota_' || n.nro AS cuota_numero,
    CASE n.nro
        WHEN 1 THEN t.cuota_1 WHEN 2 THEN t.cuota_2 WHEN 3 THEN t.cuota_3
        WHEN 4 THEN t.cuota_4 WHEN 5 THEN t.cuota_5 WHEN 6 THEN t.cuota_6
        WHEN 7 THEN t.cuota_7 WHEN 8 THEN t.cuota_8 WHEN 9 THEN t.cuota_9
        WHEN 10 THEN t.cuota_10 WHEN 11 THEN t.cuota_11
    END AS monto_original,
    p.monto_bs AS monto_migrado,
    CASE n.nro
        WHEN 1 THEN t.ref_cuota_1 WHEN 2 THEN t.ref_cuota_2 WHEN 3 THEN t.ref_cuota_3
        WHEN 4 THEN t.ref_cuota_4 WHEN 5 THEN t.ref_cuota_5 WHEN 6 THEN t.ref_cuota_6
        WHEN 7 THEN t.ref_cuota_7 WHEN 8 THEN t.ref_cuota_8 WHEN 9 THEN t.ref_cuota_9
        WHEN 10 THEN t.ref_cuota_10 WHEN 11 THEN t.ref_cuota_11
    END AS ref_original,
    p.referencia AS ref_migrada
FROM tienda_caracas t
CROSS JOIN (SELECT generate_series(1,11) AS nro) n
LEFT JOIN pagos_caracas p ON p.factura_id = t.id AND p.nro_cuota = n.nro
WHERE 
    -- Solo donde la columna plana tiene valor > 0
    CASE n.nro
        WHEN 1 THEN COALESCE(t.cuota_1,0) WHEN 2 THEN COALESCE(t.cuota_2,0)
        WHEN 3 THEN COALESCE(t.cuota_3,0) WHEN 4 THEN COALESCE(t.cuota_4,0)
        WHEN 5 THEN COALESCE(t.cuota_5,0) WHEN 6 THEN COALESCE(t.cuota_6,0)
        WHEN 7 THEN COALESCE(t.cuota_7,0) WHEN 8 THEN COALESCE(t.cuota_8,0)
        WHEN 9 THEN COALESCE(t.cuota_9,0) WHEN 10 THEN COALESCE(t.cuota_10,0)
        WHEN 11 THEN COALESCE(t.cuota_11,0)
    END > 0
    AND (
        -- Discrepancia: no existe en pagos_caracas O el monto no coincide
        p.id IS NULL 
        OR ABS(
            CASE n.nro
                WHEN 1 THEN COALESCE(t.cuota_1,0) WHEN 2 THEN COALESCE(t.cuota_2,0)
                WHEN 3 THEN COALESCE(t.cuota_3,0) WHEN 4 THEN COALESCE(t.cuota_4,0)
                WHEN 5 THEN COALESCE(t.cuota_5,0) WHEN 6 THEN COALESCE(t.cuota_6,0)
                WHEN 7 THEN COALESCE(t.cuota_7,0) WHEN 8 THEN COALESCE(t.cuota_8,0)
                WHEN 9 THEN COALESCE(t.cuota_9,0) WHEN 10 THEN COALESCE(t.cuota_10,0)
                WHEN 11 THEN COALESCE(t.cuota_11,0)
            END - COALESCE(p.monto_bs,0)
        ) > 0.01
    )
ORDER BY t.id, n.nro;

-- 2. RESUMEN: Cuantas cuotas deberian estar vs cuantas hay
WITH cuotas_originales AS (
    SELECT 
        t.id,
        (CASE WHEN COALESCE(t.cuota_1,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_2,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_3,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_4,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_5,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_6,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_7,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_8,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_9,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_10,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_11,0) > 0 THEN 1 ELSE 0 END) AS total_originales
    FROM tienda_caracas t
),
cuotas_migradas AS (
    SELECT factura_id, COUNT(*) AS total_migradas
    FROM pagos_caracas
    WHERE nro_cuota BETWEEN 1 AND 11
    GROUP BY factura_id
)
SELECT 
    'Caracas' AS tienda,
    (SELECT SUM(total_originales) FROM cuotas_originales) AS cuotas_en_columnas,
    (SELECT COALESCE(SUM(total_migradas),0) FROM cuotas_migradas) AS cuotas_en_pagos,
    (SELECT SUM(total_originales) FROM cuotas_originales) - 
    (SELECT COALESCE(SUM(total_migradas),0) FROM cuotas_migradas) AS faltantes;

-- 3. DETALLE POR CLIENTE: Cuotas que faltan migrar
WITH cuotas_originales AS (
    SELECT 
        t.id,
        t.nro_factura,
        t.nombre_apellido,
        (CASE WHEN COALESCE(t.cuota_1,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_2,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_3,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_4,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_5,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_6,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_7,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_8,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_9,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_10,0) > 0 THEN 1 ELSE 0 END +
         CASE WHEN COALESCE(t.cuota_11,0) > 0 THEN 1 ELSE 0 END) AS total_originales
    FROM tienda_caracas t
),
cuotas_migradas AS (
    SELECT factura_id, COUNT(*) AS total_migradas
    FROM pagos_caracas
    WHERE nro_cuota BETWEEN 1 AND 11
    GROUP BY factura_id
)
SELECT 
    o.id AS factura_id,
    o.nro_factura,
    o.nombre_apellido,
    o.total_originales AS cuotas_originales,
    COALESCE(m.total_migradas, 0) AS cuotas_migradas,
    o.total_originales - COALESCE(m.total_migradas, 0) AS faltan
FROM cuotas_originales o
LEFT JOIN cuotas_migradas m ON o.id = m.factura_id
WHERE o.total_originales != COALESCE(m.total_migradas, 0)
ORDER BY (o.total_originales - COALESCE(m.total_migradas, 0)) DESC
LIMIT 20;

-- 4. VERIFICAR MONTOS TOTALES: Suma de columnas vs suma de pagos
SELECT 
    'Columnas planas (1-11)' AS origen,
    COALESCE(SUM(
        COALESCE(cuota_1,0) + COALESCE(cuota_2,0) + COALESCE(cuota_3,0) +
        COALESCE(cuota_4,0) + COALESCE(cuota_5,0) + COALESCE(cuota_6,0) +
        COALESCE(cuota_7,0) + COALESCE(cuota_8,0) + COALESCE(cuota_9,0) +
        COALESCE(cuota_10,0) + COALESCE(cuota_11,0)
    ), 0) AS total_bs
FROM tienda_caracas
UNION ALL
SELECT 
    'Tabla pagos_caracas (1-11)' AS origen,
    COALESCE(SUM(monto_bs), 0) AS total_bs
FROM pagos_caracas
WHERE nro_cuota BETWEEN 1 AND 11;
