-- ============================================================
-- MÓDULO DE ESTADÍSTICAS v3 — Sistema de Créditos IPSFA
-- CORRECCIÓN: Lee TODAS las cuotas desde las tablas de pagos
-- (pagos_caracas, pagos_maracay, pagos_maracaibo)
-- Ya NO usa columnas planas cuota_1...cuota_11
-- ============================================================
-- Ejecutar en pgAdmin Query Editor sobre la BD 'creditos'
-- ============================================================

-- ------------------------------------------------------------
-- VISTA: una fila por crédito, con totales desde tablas de pagos
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW v_resumen_cuotas_mes AS
WITH pagos_por_tienda AS (
    SELECT 'caracas' AS tienda, factura_id, 
           COUNT(*) AS cuotas_pagadas,
           COALESCE(SUM(monto_usd), 0) AS monto_cancelado
    FROM pagos_caracas
    GROUP BY factura_id
    UNION ALL
    SELECT 'maracay' AS tienda, factura_id,
           COUNT(*) AS cuotas_pagadas,
           COALESCE(SUM(monto_usd), 0) AS monto_cancelado
    FROM pagos_maracay
    GROUP BY factura_id
    UNION ALL
    SELECT 'maracaibo' AS tienda, factura_id,
           COUNT(*) AS cuotas_pagadas,
           COALESCE(SUM(monto_usd), 0) AS monto_cancelado
    FROM pagos_maracaibo
    GROUP BY factura_id
)
SELECT 
    c.tienda,
    c.id,
    c.nombre_apellido,
    c.cedula,
    c.fecha_factura,
    c.cuotas,
    COALESCE(p.cuotas_pagadas, 0) AS cuotas_completas,
    COALESCE(p.monto_cancelado, 0) AS monto_cancelado,
    COALESCE(c.monto_facturado_divisa, 0) - COALESCE(c.inicial_usd, 0) AS monto_esperado,
    CASE WHEN COALESCE(p.monto_cancelado, 0) > 0 
         AND COALESCE(p.monto_cancelado, 0) < COALESCE(c.monto_facturado_divisa, 0) - COALESCE(c.inicial_usd, 0)
         THEN 1 ELSE 0 END AS cuotas_incompletas,
    CASE WHEN COALESCE(p.monto_cancelado, 0) < COALESCE(c.monto_facturado_divisa, 0) - COALESCE(c.inicial_usd, 0)
         AND COALESCE(c.monto_facturado_divisa, 0) - COALESCE(c.inicial_usd, 0) > 0
         THEN 1 ELSE 0 END AS es_deudor
FROM (
    SELECT 'caracas' AS tienda, id, nombre_apellido, cedula, fecha_factura, cuotas, monto_facturado_divisa, inicial_usd
    FROM tienda_caracas
    UNION ALL
    SELECT 'maracay' AS tienda, id, nombre_apellido, cedula, fecha_factura, cuotas, monto_facturado_divisa, inicial_usd
    FROM tienda_maracay
    UNION ALL
    SELECT 'maracaibo' AS tienda, id, nombre_apellido, cedula, fecha_factura, cuotas, monto_facturado_divisa, inicial_usd
    FROM tienda_maracaibo
) c
LEFT JOIN pagos_por_tienda p ON c.id = p.factura_id AND c.tienda = p.tienda;

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
SELECT proname AS funcion, pronargs AS parametros
FROM pg_proc
WHERE proname IN ('f_estadisticas_periodo', 'f_deudores_mes', 'f_evolucion_pagos', 'f_distribucion_pagos')
ORDER BY proname;

-- Prueba rápida:
-- SELECT * FROM f_estadisticas_periodo(8, 2026, NULL);
-- SELECT * FROM f_deudores_mes(8, 2026, 'caracas');

-- ============================================================
-- FIN ESTADÍSTICAS v3
-- ============================================================
