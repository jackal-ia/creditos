-- ============================================================
-- MIGRACION: Cuota mas antigua (por fecha) -> Campo Inicial
-- Ejecutar en pgAdmin Query Tool
-- ============================================================

-- Paso 1: Crear funcion de migracion
CREATE OR REPLACE FUNCTION migrar_cuotas_a_inicial(p_tabla TEXT)
RETURNS TEXT AS $$
DECLARE
    rec RECORD;
    col_cuotas TEXT[];
    col_refs TEXT[];
    col_fechas TEXT[];
    col_tasas TEXT[];
    col_dolares TEXT[];
    num_cuotas INT;
    i INT;
    min_fecha DATE;
    min_idx INT;
    tmp_fecha DATE;
    tmp_monto NUMERIC;
    tmp_ref TEXT;
    tmp_tasa NUMERIC;
    tmp_dolar NUMERIC;
    arr_montos NUMERIC[];
    arr_refs TEXT[];
    arr_fechas DATE[];
    arr_tasas NUMERIC[];
    arr_dolares NUMERIC[];
    procesados INT := 0;
    sql_query TEXT;
BEGIN
    -- Detectar columnas de cuotas dinamicamente
    SELECT ARRAY_AGG(column_name ORDER BY (regexp_match(column_name, '^cuota_([0-9]+)$'))[1]::INT)
    INTO col_cuotas
    FROM information_schema.columns
    WHERE table_name = p_tabla
      AND column_name ~ '^cuota_[0-9]+$';

    IF col_cuotas IS NULL OR array_length(col_cuotas, 1) IS NULL THEN
        RETURN 'No se encontraron columnas de cuotas en ' || p_tabla;
    END IF;

    num_cuotas := array_length(col_cuotas, 1);

    -- Construir arrays de nombres de columnas relacionadas
    col_refs := ARRAY(SELECT 'ref_' || c FROM unnest(col_cuotas) c);
    col_fechas := ARRAY(SELECT 'fecha_' || c FROM unnest(col_cuotas) c);
    col_tasas := ARRAY(SELECT 'tasa_' || c FROM unnest(col_cuotas) c);
    col_dolares := ARRAY(SELECT 'dolar_depositado_' || c FROM unnest(col_cuotas) c);

    -- Iterar registros sin inicial
    sql_query := format('SELECT * FROM %I WHERE COALESCE(inicial_bs, 0) = 0', p_tabla);
    FOR rec IN EXECUTE sql_query LOOP
        -- Cargar arrays desde el registro
        arr_montos := ARRAY[]::NUMERIC[];
        arr_refs := ARRAY[]::TEXT[];
        arr_fechas := ARRAY[]::DATE[];
        arr_tasas := ARRAY[]::NUMERIC[];
        arr_dolares := ARRAY[]::NUMERIC[];

        FOR i IN 1..num_cuotas LOOP
            EXECUTE format('SELECT %I, %I, %I::DATE, %I, %I FROM %I WHERE id = $1',
                col_cuotas[i], col_refs[i], col_fechas[i], col_tasas[i], col_dolares[i], p_tabla)
            INTO tmp_monto, tmp_ref, tmp_fecha, tmp_tasa, tmp_dolar
            USING rec.id;

            arr_montos := array_append(arr_montos, COALESCE(tmp_monto, 0));
            arr_refs := array_append(arr_refs, tmp_ref);
            arr_fechas := array_append(arr_fechas, tmp_fecha);
            arr_tasas := array_append(arr_tasas, tmp_tasa);
            arr_dolares := array_append(arr_dolares, tmp_dolar);
        END LOOP;

        -- Encontrar cuota con fecha mas antigua
        min_fecha := NULL;
        min_idx := -1;
        FOR i IN 1..num_cuotas LOOP
            IF arr_fechas[i] IS NOT NULL AND arr_montos[i] > 0 THEN
                IF min_fecha IS NULL OR arr_fechas[i] < min_fecha THEN
                    min_fecha := arr_fechas[i];
                    min_idx := i;
                END IF;
            END IF;
        END LOOP;

        IF min_idx = -1 THEN
            CONTINUE;  -- Sin cuotas validas
        END IF;

        -- Guardar datos de la cuota mas antigua como inicial
        tmp_monto := arr_montos[min_idx];
        tmp_ref := arr_refs[min_idx];
        tmp_fecha := arr_fechas[min_idx];
        tmp_tasa := arr_tasas[min_idx];
        tmp_dolar := arr_dolares[min_idx];

        -- Eliminar del array (reordenar)
        arr_montos := arr_montos[1:min_idx-1] || arr_montos[min_idx+1:num_cuotas];
        arr_refs := arr_refs[1:min_idx-1] || arr_refs[min_idx+1:num_cuotas];
        arr_fechas := arr_fechas[1:min_idx-1] || arr_fechas[min_idx+1:num_cuotas];
        arr_tasas := arr_tasas[1:min_idx-1] || arr_tasas[min_idx+1:num_cuotas];
        arr_dolares := arr_dolares[1:min_idx-1] || arr_dolares[min_idx+1:num_cuotas];

        -- Agregar NULL al final para mantener tamano
        arr_montos := array_append(arr_montos, NULL);
        arr_refs := array_append(arr_refs, NULL);
        arr_fechas := array_append(arr_fechas, NULL);
        arr_tasas := array_append(arr_tasas, NULL);
        arr_dolares := array_append(arr_dolares, NULL);

        -- Construir y ejecutar UPDATE
        sql_query := format('UPDATE %I SET ', p_tabla);
        sql_query := sql_query || format('inicial_bs = %L, ', tmp_monto);
        sql_query := sql_query || format('ref_inicial = %L, ', tmp_ref);
        sql_query := sql_query || format('fecha_inicial = %L, ', tmp_fecha);
        sql_query := sql_query || format('tasa_inicial = %L, ', tmp_tasa);
        sql_query := sql_query || format('inicial_usd = %L, ', tmp_dolar);

        FOR i IN 1..num_cuotas LOOP
            sql_query := sql_query || format('%I = %L, ', col_cuotas[i], arr_montos[i]);
            sql_query := sql_query || format('%I = %L, ', col_refs[i], arr_refs[i]);
            sql_query := sql_query || format('%I = %L, ', col_fechas[i], arr_fechas[i]);
            sql_query := sql_query || format('%I = %L, ', col_tasas[i], arr_tasas[i]);
            sql_query := sql_query || format('%I = %L, ', col_dolares[i], arr_dolares[i]);
        END LOOP;

        -- Quitar ultima coma y agregar WHERE
        sql_query := LEFT(sql_query, LENGTH(sql_query) - 2);
        sql_query := sql_query || format(' WHERE id = %s', rec.id);

        EXECUTE sql_query;
        procesados := procesados + 1;
    END LOOP;

    RETURN format('Tabla %s: %s registros procesados', p_tabla, procesados);
END;
$$ LANGUAGE plpgsql;


-- ============================================================
-- Paso 2: Ejecutar migracion para cada tienda
-- ============================================================

SELECT migrar_cuotas_a_inicial('tienda_caracas');
SELECT migrar_cuotas_a_inicial('tienda_maracay');
SELECT migrar_cuotas_a_inicial('tienda_maracaibo');


-- ============================================================
-- Paso 3: Verificar resultados (opcional)
-- ============================================================

SELECT 'tienda_caracas' AS tabla, COUNT(*) AS con_inicial FROM tienda_caracas WHERE COALESCE(inicial_bs,0) > 0
UNION ALL
SELECT 'tienda_maracay', COUNT(*) FROM tienda_maracay WHERE COALESCE(inicial_bs,0) > 0
UNION ALL
SELECT 'tienda_maracaibo', COUNT(*) FROM tienda_maracaibo WHERE COALESCE(inicial_bs,0) > 0;
