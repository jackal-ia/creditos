-- ============================================================
-- MÓDULO DE ESTADÍSTICAS v2 — Sistema de Créditos IPSFA
-- ============================================================
-- Instala la capa de analítica en la base de datos "creditos":
--   * Vista  v_resumen_cuotas_mes  (las 3 tiendas unificadas)
--   * f_estadisticas_periodo(mes, anio, tienda)
--   * f_deudores_mes(mes, anio, tienda)
--   * f_evolucion_pagos(anio, tienda)
--   * f_distribucion_pagos(mes, anio, tienda)
--
-- Diferencias vs el estadisticas.sql original:
--   1. MULTI-TIENDA: la vista original leía SOLO tienda_caracas;
--      ahora unifica Caracas, Maracay y Maracaibo con columna "tienda".
--   2. Las 4 funciones aceptan p_tienda opcional (NULL = todas).
--   3. Es idempotente: puede ejecutarse varias veces (CREATE OR REPLACE).
--
-- NOTA DE UNIDADES (heredada del diseño original): monto_cancelado
-- suma dolar_depositado_cuota_N (dólares) y monto_esperado suma
-- cuota_N (bolívares). Se conserva la fórmula original a propósito;
-- valide con datos reales si la convención de campos es la esperada.
--
-- Instalación (Windows, desde la carpeta del proyecto):
--   "C:\Program Files\PostgreSQL\16\bin\psql.exe" -U postgres -d creditos -f database\estadisticas-v2.sql
-- ============================================================

-- ------------------------------------------------------------
-- VISTA: una fila por crédito, con sus 11 cuotas desglosadas
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_resumen_cuotas_mes AS
WITH cuotas_desglosadas AS (
    SELECT 'caracas'::VARCHAR AS tienda, id, nombre_apellido, cedula, fecha_factura, cuotas,
        COALESCE(cuota_1, 0) AS c1_monto,
        CASE WHEN cuota_1 IS NOT NULL AND cuota_1 > 0 THEN 1 ELSE 0 END AS c1_pagada,
        COALESCE(dolar_depositado_cuota_1, 0) AS c1_depositado,
        COALESCE(cuota_2, 0) AS c2_monto,
        CASE WHEN cuota_2 IS NOT NULL AND cuota_2 > 0 THEN 1 ELSE 0 END AS c2_pagada,
        COALESCE(dolar_depositado_cuota_2, 0) AS c2_depositado,
        COALESCE(cuota_3, 0) AS c3_monto,
        CASE WHEN cuota_3 IS NOT NULL AND cuota_3 > 0 THEN 1 ELSE 0 END AS c3_pagada,
        COALESCE(dolar_depositado_cuota_3, 0) AS c3_depositado,
        COALESCE(cuota_4, 0) AS c4_monto,
        CASE WHEN cuota_4 IS NOT NULL AND cuota_4 > 0 THEN 1 ELSE 0 END AS c4_pagada,
        COALESCE(dolar_depositado_cuota_4, 0) AS c4_depositado,
        COALESCE(cuota_5, 0) AS c5_monto,
        CASE WHEN cuota_5 IS NOT NULL AND cuota_5 > 0 THEN 1 ELSE 0 END AS c5_pagada,
        COALESCE(dolar_depositado_cuota_5, 0) AS c5_depositado,
        COALESCE(cuota_6, 0) AS c6_monto,
        CASE WHEN cuota_6 IS NOT NULL AND cuota_6 > 0 THEN 1 ELSE 0 END AS c6_pagada,
        COALESCE(dolar_depositado_cuota_6, 0) AS c6_depositado,
        COALESCE(cuota_7, 0) AS c7_monto,
        CASE WHEN cuota_7 IS NOT NULL AND cuota_7 > 0 THEN 1 ELSE 0 END AS c7_pagada,
        COALESCE(dolar_depositado_cuota_7, 0) AS c7_depositado,
        COALESCE(cuota_8, 0) AS c8_monto,
        CASE WHEN cuota_8 IS NOT NULL AND cuota_8 > 0 THEN 1 ELSE 0 END AS c8_pagada,
        COALESCE(dolar_depositado_cuota_8, 0) AS c8_depositado,
        COALESCE(cuota_9, 0) AS c9_monto,
        CASE WHEN cuota_9 IS NOT NULL AND cuota_9 > 0 THEN 1 ELSE 0 END AS c9_pagada,
        COALESCE(dolar_depositado_cuota_9, 0) AS c9_depositado,
        COALESCE(cuota_10, 0) AS c10_monto,
        CASE WHEN cuota_10 IS NOT NULL AND cuota_10 > 0 THEN 1 ELSE 0 END AS c10_pagada,
        COALESCE(dolar_depositado_cuota_10, 0) AS c10_depositado,
        COALESCE(cuota_11, 0) AS c11_monto,
        CASE WHEN cuota_11 IS NOT NULL AND cuota_11 > 0 THEN 1 ELSE 0 END AS c11_pagada,
        COALESCE(dolar_depositado_cuota_11, 0) AS c11_depositado
    FROM tienda_caracas
    UNION ALL
    SELECT 'maracay'::VARCHAR AS tienda, id, nombre_apellido, cedula, fecha_factura, cuotas,
        COALESCE(cuota_1, 0) AS c1_monto,
        CASE WHEN cuota_1 IS NOT NULL AND cuota_1 > 0 THEN 1 ELSE 0 END AS c1_pagada,
        COALESCE(dolar_depositado_cuota_1, 0) AS c1_depositado,
        COALESCE(cuota_2, 0) AS c2_monto,
        CASE WHEN cuota_2 IS NOT NULL AND cuota_2 > 0 THEN 1 ELSE 0 END AS c2_pagada,
        COALESCE(dolar_depositado_cuota_2, 0) AS c2_depositado,
        COALESCE(cuota_3, 0) AS c3_monto,
        CASE WHEN cuota_3 IS NOT NULL AND cuota_3 > 0 THEN 1 ELSE 0 END AS c3_pagada,
        COALESCE(dolar_depositado_cuota_3, 0) AS c3_depositado,
        COALESCE(cuota_4, 0) AS c4_monto,
        CASE WHEN cuota_4 IS NOT NULL AND cuota_4 > 0 THEN 1 ELSE 0 END AS c4_pagada,
        COALESCE(dolar_depositado_cuota_4, 0) AS c4_depositado,
        COALESCE(cuota_5, 0) AS c5_monto,
        CASE WHEN cuota_5 IS NOT NULL AND cuota_5 > 0 THEN 1 ELSE 0 END AS c5_pagada,
        COALESCE(dolar_depositado_cuota_5, 0) AS c5_depositado,
        COALESCE(cuota_6, 0) AS c6_monto,
        CASE WHEN cuota_6 IS NOT NULL AND cuota_6 > 0 THEN 1 ELSE 0 END AS c6_pagada,
        COALESCE(dolar_depositado_cuota_6, 0) AS c6_depositado,
        COALESCE(cuota_7, 0) AS c7_monto,
        CASE WHEN cuota_7 IS NOT NULL AND cuota_7 > 0 THEN 1 ELSE 0 END AS c7_pagada,
        COALESCE(dolar_depositado_cuota_7, 0) AS c7_depositado,
        COALESCE(cuota_8, 0) AS c8_monto,
        CASE WHEN cuota_8 IS NOT NULL AND cuota_8 > 0 THEN 1 ELSE 0 END AS c8_pagada,
        COALESCE(dolar_depositado_cuota_8, 0) AS c8_depositado,
        COALESCE(cuota_9, 0) AS c9_monto,
        CASE WHEN cuota_9 IS NOT NULL AND cuota_9 > 0 THEN 1 ELSE 0 END AS c9_pagada,
        COALESCE(dolar_depositado_cuota_9, 0) AS c9_depositado,
        COALESCE(cuota_10, 0) AS c10_monto,
        CASE WHEN cuota_10 IS NOT NULL AND cuota_10 > 0 THEN 1 ELSE 0 END AS c10_pagada,
        COALESCE(dolar_depositado_cuota_10, 0) AS c10_depositado,
        COALESCE(cuota_11, 0) AS c11_monto,
        CASE WHEN cuota_11 IS NOT NULL AND cuota_11 > 0 THEN 1 ELSE 0 END AS c11_pagada,
        COALESCE(dolar_depositado_cuota_11, 0) AS c11_depositado
    FROM tienda_maracay
    UNION ALL
    SELECT 'maracaibo'::VARCHAR AS tienda, id, nombre_apellido, cedula, fecha_factura, cuotas,
        COALESCE(cuota_1, 0) AS c1_monto,
        CASE WHEN cuota_1 IS NOT NULL AND cuota_1 > 0 THEN 1 ELSE 0 END AS c1_pagada,
        COALESCE(dolar_depositado_cuota_1, 0) AS c1_depositado,
        COALESCE(cuota_2, 0) AS c2_monto,
        CASE WHEN cuota_2 IS NOT NULL AND cuota_2 > 0 THEN 1 ELSE 0 END AS c2_pagada,
        COALESCE(dolar_depositado_cuota_2, 0) AS c2_depositado,
        COALESCE(cuota_3, 0) AS c3_monto,
        CASE WHEN cuota_3 IS NOT NULL AND cuota_3 > 0 THEN 1 ELSE 0 END AS c3_pagada,
        COALESCE(dolar_depositado_cuota_3, 0) AS c3_depositado,
        COALESCE(cuota_4, 0) AS c4_monto,
        CASE WHEN cuota_4 IS NOT NULL AND cuota_4 > 0 THEN 1 ELSE 0 END AS c4_pagada,
        COALESCE(dolar_depositado_cuota_4, 0) AS c4_depositado,
        COALESCE(cuota_5, 0) AS c5_monto,
        CASE WHEN cuota_5 IS NOT NULL AND cuota_5 > 0 THEN 1 ELSE 0 END AS c5_pagada,
        COALESCE(dolar_depositado_cuota_5, 0) AS c5_depositado,
        COALESCE(cuota_6, 0) AS c6_monto,
        CASE WHEN cuota_6 IS NOT NULL AND cuota_6 > 0 THEN 1 ELSE 0 END AS c6_pagada,
        COALESCE(dolar_depositado_cuota_6, 0) AS c6_depositado,
        COALESCE(cuota_7, 0) AS c7_monto,
        CASE WHEN cuota_7 IS NOT NULL AND cuota_7 > 0 THEN 1 ELSE 0 END AS c7_pagada,
        COALESCE(dolar_depositado_cuota_7, 0) AS c7_depositado,
        COALESCE(cuota_8, 0) AS c8_monto,
        CASE WHEN cuota_8 IS NOT NULL AND cuota_8 > 0 THEN 1 ELSE 0 END AS c8_pagada,
        COALESCE(dolar_depositado_cuota_8, 0) AS c8_depositado,
        COALESCE(cuota_9, 0) AS c9_monto,
        CASE WHEN cuota_9 IS NOT NULL AND cuota_9 > 0 THEN 1 ELSE 0 END AS c9_pagada,
        COALESCE(dolar_depositado_cuota_9, 0) AS c9_depositado,
        COALESCE(cuota_10, 0) AS c10_monto,
        CASE WHEN cuota_10 IS NOT NULL AND cuota_10 > 0 THEN 1 ELSE 0 END AS c10_pagada,
        COALESCE(dolar_depositado_cuota_10, 0) AS c10_depositado,
        COALESCE(cuota_11, 0) AS c11_monto,
        CASE WHEN cuota_11 IS NOT NULL AND cuota_11 > 0 THEN 1 ELSE 0 END AS c11_pagada,
        COALESCE(dolar_depositado_cuota_11, 0) AS c11_depositado
    FROM tienda_maracaibo
)
SELECT
    tienda,
    id,
    nombre_apellido,
    cedula,
    fecha_factura,
    cuotas,
    -- Cuotas registradas como pagadas (monto cargado > 0)
    (c1_pagada + c2_pagada + c3_pagada + c4_pagada + c5_pagada + c6_pagada + c7_pagada + c8_pagada + c9_pagada + c10_pagada + c11_pagada) AS cuotas_completas,
    -- Total "cancelado" (suma de depósitos en divisas, según diseño original)
    (c1_depositado + c2_depositado + c3_depositado + c4_depositado + c5_depositado + c6_depositado + c7_depositado + c8_depositado + c9_depositado + c10_depositado + c11_depositado) AS monto_cancelado,
    -- Total esperado (suma de montos de las 11 cuotas)
    (c1_monto + c2_monto + c3_monto + c4_monto + c5_monto + c6_monto + c7_monto + c8_monto + c9_monto + c10_monto + c11_monto) AS monto_esperado,
    -- Cuotas incompletas (depositado < monto, con monto > 0)
    CASE WHEN c1_depositado < c1_monto AND c1_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c2_depositado < c2_monto AND c2_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c3_depositado < c3_monto AND c3_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c4_depositado < c4_monto AND c4_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c5_depositado < c5_monto AND c5_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c6_depositado < c6_monto AND c6_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c7_depositado < c7_monto AND c7_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c8_depositado < c8_monto AND c8_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c9_depositado < c9_monto AND c9_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c10_depositado < c10_monto AND c10_monto > 0 THEN 1 ELSE 0 END +
    CASE WHEN c11_depositado < c11_monto AND c11_monto > 0 THEN 1 ELSE 0 END AS cuotas_incompletas,
    -- Es deudor: alguna cuota con monto > 0 no cubierta
    CASE WHEN (c1_depositado < c1_monto AND c1_monto > 0) OR
              (c2_depositado < c2_monto AND c2_monto > 0) OR
              (c3_depositado < c3_monto AND c3_monto > 0) OR
              (c4_depositado < c4_monto AND c4_monto > 0) OR
              (c5_depositado < c5_monto AND c5_monto > 0) OR
              (c6_depositado < c6_monto AND c6_monto > 0) OR
              (c7_depositado < c7_monto AND c7_monto > 0) OR
              (c8_depositado < c8_monto AND c8_monto > 0) OR
              (c9_depositado < c9_monto AND c9_monto > 0) OR
              (c10_depositado < c10_monto AND c10_monto > 0) OR
              (c11_depositado < c11_monto AND c11_monto > 0)
         THEN 1 ELSE 0 END AS es_deudor
FROM cuotas_desglosadas;

-- ------------------------------------------------------------
-- FUNCIÓN: KPIs del período (mes/año, opcional tienda)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION f_estadisticas_periodo(
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_tienda VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    total_cuotas_canceladas NUMERIC,
    total_cuotas_incompletas NUMERIC,
    total_deudores INTEGER,
    total_creditos_activos INTEGER,
    monto_total_cancelado NUMERIC,
    monto_total_pendiente NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COALESCE(SUM(cuotas_completas), 0)::NUMERIC,
        COALESCE(SUM(cuotas_incompletas), 0)::NUMERIC,
        COALESCE(SUM(es_deudor), 0)::INTEGER,
        COUNT(*)::INTEGER,
        COALESCE(SUM(monto_cancelado), 0)::NUMERIC,
        COALESCE(SUM(monto_esperado - monto_cancelado), 0)::NUMERIC
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND (p_tienda IS NULL OR tienda = p_tienda);
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- FUNCIÓN: deudores del mes
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION f_deudores_mes(
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_tienda VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    id INTEGER,
    nombre_apellido VARCHAR,
    cedula VARCHAR,
    tienda VARCHAR,
    cuota_mensual NUMERIC,
    pagado NUMERIC,
    deuda NUMERIC,
    estado VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.nombre_apellido,
        v.cedula,
        v.tienda,
        (v.monto_esperado / NULLIF(v.cuotas, 0))::NUMERIC AS cuota_mensual,
        v.monto_cancelado AS pagado,
        (v.monto_esperado - v.monto_cancelado) AS deuda,
        CASE
            WHEN v.monto_cancelado = 0 THEN 'No pagó'
            WHEN v.monto_cancelado < v.monto_esperado THEN 'Incompleto'
            ELSE 'Al día'
        END::VARCHAR AS estado
    FROM v_resumen_cuotas_mes v
    WHERE EXTRACT(MONTH FROM v.fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM v.fecha_factura) = p_anio
      AND v.es_deudor = 1
      AND (p_tienda IS NULL OR v.tienda = p_tienda)
    ORDER BY (v.monto_esperado - v.monto_cancelado) DESC;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- FUNCIÓN: evolución mensual de pagos de un año
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION f_evolucion_pagos(
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_tienda VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    mes INTEGER,
    nombre_mes VARCHAR,
    cuotas_canceladas NUMERIC,
    cuotas_incompletas NUMERIC,
    monto_cancelado NUMERIC,
    monto_pendiente NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        EXTRACT(MONTH FROM v.fecha_factura)::INTEGER AS mes,
        TO_CHAR(v.fecha_factura, 'TMMonth')::VARCHAR AS nombre_mes,
        COALESCE(SUM(v.cuotas_completas), 0)::NUMERIC,
        COALESCE(SUM(v.cuotas_incompletas), 0)::NUMERIC,
        COALESCE(SUM(v.monto_cancelado), 0)::NUMERIC,
        COALESCE(SUM(v.monto_esperado - v.monto_cancelado), 0)::NUMERIC
    FROM v_resumen_cuotas_mes v
    WHERE EXTRACT(YEAR FROM v.fecha_factura) = p_anio
      AND (p_tienda IS NULL OR v.tienda = p_tienda)
    GROUP BY EXTRACT(MONTH FROM v.fecha_factura), TO_CHAR(v.fecha_factura, 'TMMonth')
    ORDER BY mes;
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- FUNCIÓN: distribución de pagos (gráfico circular)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION f_distribucion_pagos(
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE),
    p_tienda VARCHAR DEFAULT NULL
)
RETURNS TABLE (
    categoria VARCHAR,
    cantidad INTEGER,
    monto NUMERIC,
    porcentaje NUMERIC
) AS $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND (p_tienda IS NULL OR tienda = p_tienda);

    RETURN QUERY
    SELECT 'Al día'::VARCHAR,
        COUNT(*)::INTEGER,
        COALESCE(SUM(monto_cancelado), 0)::NUMERIC,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 2) ELSE 0 END
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND monto_cancelado >= monto_esperado AND monto_esperado > 0
      AND (p_tienda IS NULL OR tienda = p_tienda)

    UNION ALL

    SELECT 'Incompleto'::VARCHAR,
        COUNT(*)::INTEGER,
        COALESCE(SUM(monto_cancelado), 0)::NUMERIC,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 2) ELSE 0 END
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND monto_cancelado > 0 AND monto_cancelado < monto_esperado
      AND (p_tienda IS NULL OR tienda = p_tienda)

    UNION ALL

    SELECT 'No pagó'::VARCHAR,
        COUNT(*)::INTEGER,
        COALESCE(SUM(monto_esperado), 0)::NUMERIC,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 2) ELSE 0 END
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND monto_cancelado = 0 AND monto_esperado > 0
      AND (p_tienda IS NULL OR tienda = p_tienda);
END;
$$ LANGUAGE plpgsql;

-- ------------------------------------------------------------
-- VERIFICACIÓN POST-INSTALACIÓN
-- ------------------------------------------------------------
-- Debe listar la vista y las 4 funciones:
SELECT proname AS funcion, pronargs AS parametros
FROM pg_proc
WHERE proname IN ('f_estadisticas_periodo', 'f_deudores_mes', 'f_evolucion_pagos', 'f_distribucion_pagos')
ORDER BY proname;

-- Prueba rápida (mes y año con datos; ajuste si es necesario):
-- SELECT * FROM f_estadisticas_periodo(7, 2026, NULL);
-- SELECT * FROM f_deudores_mes(7, 2026, 'caracas');

-- ============================================================
-- FIN ESTADÍSTICAS v2
-- ============================================================
