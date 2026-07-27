-- ============================================================
-- VISTAS Y FUNCIONES PARA MÓDULO ESTADÍSTICAS
-- ============================================================

-- Vista: Resumen de cuotas por mes
CREATE OR REPLACE VIEW v_resumen_cuotas_mes AS
WITH cuotas_desglosadas AS (
    SELECT 
        id,
        nombre_apellido,
        cedula,
        fecha_factura,
        cuotas,
        -- Cuota 1
        COALESCE(cuota_1, 0) as c1_monto,
        CASE WHEN cuota_1 IS NOT NULL AND cuota_1 > 0 THEN 1 ELSE 0 END as c1_pagada,
        COALESCE(dolar_depositado_cuota_1, 0) as c1_depositado,
        -- Cuota 2
        COALESCE(cuota_2, 0) as c2_monto,
        CASE WHEN cuota_2 IS NOT NULL AND cuota_2 > 0 THEN 1 ELSE 0 END as c2_pagada,
        COALESCE(dolar_depositado_cuota_2, 0) as c2_depositado,
        -- Cuota 3
        COALESCE(cuota_3, 0) as c3_monto,
        CASE WHEN cuota_3 IS NOT NULL AND cuota_3 > 0 THEN 1 ELSE 0 END as c3_pagada,
        COALESCE(dolar_depositado_cuota_3, 0) as c3_depositado,
        -- Cuota 4
        COALESCE(cuota_4, 0) as c4_monto,
        CASE WHEN cuota_4 IS NOT NULL AND cuota_4 > 0 THEN 1 ELSE 0 END as c4_pagada,
        COALESCE(dolar_depositado_cuota_4, 0) as c4_depositado,
        -- Cuota 5
        COALESCE(cuota_5, 0) as c5_monto,
        CASE WHEN cuota_5 IS NOT NULL AND cuota_5 > 0 THEN 1 ELSE 0 END as c5_pagada,
        COALESCE(dolar_depositado_cuota_5, 0) as c5_depositado,
        -- Cuota 6
        COALESCE(cuota_6, 0) as c6_monto,
        CASE WHEN cuota_6 IS NOT NULL AND cuota_6 > 0 THEN 1 ELSE 0 END as c6_pagada,
        COALESCE(dolar_depositado_cuota_6, 0) as c6_depositado,
        -- Cuota 7
        COALESCE(cuota_7, 0) as c7_monto,
        CASE WHEN cuota_7 IS NOT NULL AND cuota_7 > 0 THEN 1 ELSE 0 END as c7_pagada,
        COALESCE(dolar_depositado_cuota_7, 0) as c7_depositado,
        -- Cuota 8
        COALESCE(cuota_8, 0) as c8_monto,
        CASE WHEN cuota_8 IS NOT NULL AND cuota_8 > 0 THEN 1 ELSE 0 END as c8_pagada,
        COALESCE(dolar_depositado_cuota_8, 0) as c8_depositado,
        -- Cuota 9
        COALESCE(cuota_9, 0) as c9_monto,
        CASE WHEN cuota_9 IS NOT NULL AND cuota_9 > 0 THEN 1 ELSE 0 END as c9_pagada,
        COALESCE(dolar_depositado_cuota_9, 0) as c9_depositado,
        -- Cuota 10
        COALESCE(cuota_10, 0) as c10_monto,
        CASE WHEN cuota_10 IS NOT NULL AND cuota_10 > 0 THEN 1 ELSE 0 END as c10_pagada,
        COALESCE(dolar_depositado_cuota_10, 0) as c10_depositado,
        -- Cuota 11
        COALESCE(cuota_11, 0) as c11_monto,
        CASE WHEN cuota_11 IS NOT NULL AND cuota_11 > 0 THEN 1 ELSE 0 END as c11_pagada,
        COALESCE(dolar_depositado_cuota_11, 0) as c11_depositado
    FROM tienda_caracas
)
SELECT 
    id,
    nombre_apellido,
    cedula,
    fecha_factura,
    cuotas,
    -- Total cuotas completas
    (c1_pagada + c2_pagada + c3_pagada + c4_pagada + c5_pagada + 
     c6_pagada + c7_pagada + c8_pagada + c9_pagada + c10_pagada + c11_pagada) as cuotas_completas,
    -- Total monto cancelado
    (c1_depositado + c2_depositado + c3_depositado + c4_depositado + c5_depositado +
     c6_depositado + c7_depositado + c8_depositado + c9_depositado + c10_depositado + c11_depositado) as monto_cancelado,
    -- Total monto esperado
    (c1_monto + c2_monto + c3_monto + c4_monto + c5_monto +
     c6_monto + c7_monto + c8_monto + c9_monto + c10_monto + c11_monto) as monto_esperado,
    -- Cuotas incompletas (depositado < monto esperado)
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
    CASE WHEN c11_depositado < c11_monto AND c11_monto > 0 THEN 1 ELSE 0 END as cuotas_incompletas,
    -- Es deudor (tiene cuotas pendientes)
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
         THEN 1 ELSE 0 END as es_deudor
FROM cuotas_desglosadas;

-- Función: Estadísticas por período
CREATE OR REPLACE FUNCTION f_estadisticas_periodo(
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
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
        COALESCE(SUM(cuotas_completas), 0)::NUMERIC as total_cuotas_canceladas,
        COALESCE(SUM(cuotas_incompletas), 0)::NUMERIC as total_cuotas_incompletas,
        COALESCE(SUM(es_deudor), 0)::INTEGER as total_deudores,
        COUNT(*)::INTEGER as total_creditos_activos,
        COALESCE(SUM(monto_cancelado), 0)::NUMERIC as monto_total_cancelado,
        COALESCE(SUM(monto_esperado - monto_cancelado), 0)::NUMERIC as monto_total_pendiente
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio;
END;
$$ LANGUAGE plpgsql;

-- Función: Deudores del mes
CREATE OR REPLACE FUNCTION f_deudores_mes(
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
)
RETURNS TABLE (
    id INTEGER,
    nombre_apellido VARCHAR,
    cedula VARCHAR,
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
        v.monto_esperado / NULLIF(v.cuotas, 0) as cuota_mensual,
        v.monto_cancelado as pagado,
        (v.monto_esperado - v.monto_cancelado) as deuda,
        CASE 
            WHEN v.monto_cancelado = 0 THEN 'No pagó'
            WHEN v.monto_cancelado < v.monto_esperado THEN 'Incompleto'
            ELSE 'Al día'
        END::VARCHAR as estado
    FROM v_resumen_cuotas_mes v
    WHERE EXTRACT(MONTH FROM v.fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM v.fecha_factura) = p_anio
      AND v.es_deudor = 1
    ORDER BY (v.monto_esperado - v.monto_cancelado) DESC;
END;
$$ LANGUAGE plpgsql;

-- Función: Evolución mensual de pagos
CREATE OR REPLACE FUNCTION f_evolucion_pagos(
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
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
        EXTRACT(MONTH FROM v.fecha_factura)::INTEGER as mes,
        TO_CHAR(v.fecha_factura, 'Month')::VARCHAR as nombre_mes,
        COALESCE(SUM(v.cuotas_completas), 0)::NUMERIC as cuotas_canceladas,
        COALESCE(SUM(v.cuotas_incompletas), 0)::NUMERIC as cuotas_incompletas,
        COALESCE(SUM(v.monto_cancelado), 0)::NUMERIC as monto_cancelado,
        COALESCE(SUM(v.monto_esperado - v.monto_cancelado), 0)::NUMERIC as monto_pendiente
    FROM v_resumen_cuotas_mes v
    WHERE EXTRACT(YEAR FROM v.fecha_factura) = p_anio
    GROUP BY EXTRACT(MONTH FROM v.fecha_factura), TO_CHAR(v.fecha_factura, 'Month')
    ORDER BY mes;
END;
$$ LANGUAGE plpgsql;

-- Función: Distribución de pagos (para gráfico circular)
CREATE OR REPLACE FUNCTION f_distribucion_pagos(
    p_mes INTEGER DEFAULT EXTRACT(MONTH FROM CURRENT_DATE),
    p_anio INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)
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
    SELECT COALESCE(SUM(es_deudor), 0) INTO v_total
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio;

    RETURN QUERY
    SELECT 
        'Al día'::VARCHAR as categoria,
        COUNT(*)::INTEGER as cantidad,
        COALESCE(SUM(monto_cancelado), 0)::NUMERIC as monto,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 2) ELSE 0 END as porcentaje
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND monto_cancelado >= monto_esperado
      AND monto_esperado > 0

    UNION ALL

    SELECT 
        'Incompleto'::VARCHAR,
        COUNT(*)::INTEGER,
        COALESCE(SUM(monto_cancelado), 0)::NUMERIC,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 2) ELSE 0 END
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND monto_cancelado > 0
      AND monto_cancelado < monto_esperado

    UNION ALL

    SELECT 
        'No pagó'::VARCHAR,
        COUNT(*)::INTEGER,
        COALESCE(SUM(monto_esperado), 0)::NUMERIC,
        CASE WHEN v_total > 0 THEN ROUND((COUNT(*)::NUMERIC / v_total) * 100, 2) ELSE 0 END
    FROM v_resumen_cuotas_mes
    WHERE EXTRACT(MONTH FROM fecha_factura) = p_mes
      AND EXTRACT(YEAR FROM fecha_factura) = p_anio
      AND monto_cancelado = 0
      AND monto_esperado > 0;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- FIN SQL ESTADÍSTICAS
-- ============================================================
