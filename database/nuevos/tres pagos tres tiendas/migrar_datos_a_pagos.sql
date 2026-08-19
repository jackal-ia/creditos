-- ============================================================
-- MIGRACION DE DATOS v6.8: Columnas planas -> Tablas de pagos
-- Traslada las cuotas 1-11 existentes a pagos_caracas/maracay/maracaibo
-- ============================================================

-- 1. MIGRAR TIENDA CARACAS
-- Para cada registro, extraer cuotas 1-11 y insertar en pagos_caracas
DO $$
DECLARE
    v_registro RECORD;
    v_insertados INT := 0;
    v_cuota_num INT;
    v_monto_bs NUMERIC;
    v_ref TEXT;
    v_fecha DATE;
    v_tasa NUMERIC;
    v_dolar NUMERIC;
BEGIN
    FOR v_registro IN 
        SELECT id, 
               cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
               cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
               cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
               cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
               cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
               cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
               cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
               cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
               cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9,
               cuota_10, ref_cuota_10, fecha_cuota_10, tasa_cuota_10, dolar_depositado_cuota_10,
               cuota_11, ref_cuota_11, fecha_cuota_11, tasa_cuota_11, dolar_depositado_cuota_11
        FROM tienda_caracas
        WHERE monto_depositados > 0 OR cuota_1 IS NOT NULL
    LOOP
        -- Cuota 1
        v_monto_bs := NULLIF(v_registro.cuota_1, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 1, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_1, ''), 
                    NULLIF(v_registro.fecha_cuota_1::date, NULL),
                    NULLIF(v_registro.tasa_cuota_1, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_1, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 2
        v_monto_bs := NULLIF(v_registro.cuota_2, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 2, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_2, ''), 
                    NULLIF(v_registro.fecha_cuota_2::date, NULL),
                    NULLIF(v_registro.tasa_cuota_2, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_2, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 3
        v_monto_bs := NULLIF(v_registro.cuota_3, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 3, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_3, ''), 
                    NULLIF(v_registro.fecha_cuota_3::date, NULL),
                    NULLIF(v_registro.tasa_cuota_3, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_3, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 4
        v_monto_bs := NULLIF(v_registro.cuota_4, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 4, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_4, ''), 
                    NULLIF(v_registro.fecha_cuota_4::date, NULL),
                    NULLIF(v_registro.tasa_cuota_4, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_4, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 5
        v_monto_bs := NULLIF(v_registro.cuota_5, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 5, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_5, ''), 
                    NULLIF(v_registro.fecha_cuota_5::date, NULL),
                    NULLIF(v_registro.tasa_cuota_5, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_5, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 6
        v_monto_bs := NULLIF(v_registro.cuota_6, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 6, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_6, ''), 
                    NULLIF(v_registro.fecha_cuota_6::date, NULL),
                    NULLIF(v_registro.tasa_cuota_6, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_6, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 7
        v_monto_bs := NULLIF(v_registro.cuota_7, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 7, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_7, ''), 
                    NULLIF(v_registro.fecha_cuota_7::date, NULL),
                    NULLIF(v_registro.tasa_cuota_7, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_7, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 8
        v_monto_bs := NULLIF(v_registro.cuota_8, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 8, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_8, ''), 
                    NULLIF(v_registro.fecha_cuota_8::date, NULL),
                    NULLIF(v_registro.tasa_cuota_8, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_8, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 9
        v_monto_bs := NULLIF(v_registro.cuota_9, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 9, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_9, ''), 
                    NULLIF(v_registro.fecha_cuota_9::date, NULL),
                    NULLIF(v_registro.tasa_cuota_9, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_9, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 10
        v_monto_bs := NULLIF(v_registro.cuota_10, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 10, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_10, ''), 
                    NULLIF(v_registro.fecha_cuota_10::date, NULL),
                    NULLIF(v_registro.tasa_cuota_10, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_10, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;

        -- Cuota 11
        v_monto_bs := NULLIF(v_registro.cuota_11, 0);
        IF v_monto_bs IS NOT NULL AND v_monto_bs > 0 THEN
            INSERT INTO pagos_caracas (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 11, v_monto_bs, 
                    NULLIF(v_registro.ref_cuota_11, ''), 
                    NULLIF(v_registro.fecha_cuota_11::date, NULL),
                    NULLIF(v_registro.tasa_cuota_11, 0),
                    NULLIF(v_registro.dolar_depositado_cuota_11, 0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING;
            v_insertados := v_insertados + 1;
        END IF;
    END LOOP;

    RAISE NOTICE 'pagos_caracas: % pagos insertados', v_insertados;
END $$;

-- 2. MIGRAR TIENDA MARACAY
DO $$
DECLARE
    v_registro RECORD;
    v_insertados INT := 0;
BEGIN
    FOR v_registro IN 
        SELECT id, 
               cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
               cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
               cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
               cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
               cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
               cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
               cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
               cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
               cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9,
               cuota_10, ref_cuota_10, fecha_cuota_10, tasa_cuota_10, dolar_depositado_cuota_10,
               cuota_11, ref_cuota_11, fecha_cuota_11, tasa_cuota_11, dolar_depositado_cuota_11
        FROM tienda_maracay
        WHERE monto_depositados > 0 OR cuota_1 IS NOT NULL
    LOOP
        IF NULLIF(v_registro.cuota_1, 0) IS NOT NULL AND NULLIF(v_registro.cuota_1, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 1, v_registro.cuota_1, NULLIF(v_registro.ref_cuota_1,''), NULLIF(v_registro.fecha_cuota_1::date,NULL), NULLIF(v_registro.tasa_cuota_1,0), NULLIF(v_registro.dolar_depositado_cuota_1,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_2, 0) IS NOT NULL AND NULLIF(v_registro.cuota_2, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 2, v_registro.cuota_2, NULLIF(v_registro.ref_cuota_2,''), NULLIF(v_registro.fecha_cuota_2::date,NULL), NULLIF(v_registro.tasa_cuota_2,0), NULLIF(v_registro.dolar_depositado_cuota_2,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_3, 0) IS NOT NULL AND NULLIF(v_registro.cuota_3, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 3, v_registro.cuota_3, NULLIF(v_registro.ref_cuota_3,''), NULLIF(v_registro.fecha_cuota_3::date,NULL), NULLIF(v_registro.tasa_cuota_3,0), NULLIF(v_registro.dolar_depositado_cuota_3,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_4, 0) IS NOT NULL AND NULLIF(v_registro.cuota_4, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 4, v_registro.cuota_4, NULLIF(v_registro.ref_cuota_4,''), NULLIF(v_registro.fecha_cuota_4::date,NULL), NULLIF(v_registro.tasa_cuota_4,0), NULLIF(v_registro.dolar_depositado_cuota_4,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_5, 0) IS NOT NULL AND NULLIF(v_registro.cuota_5, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 5, v_registro.cuota_5, NULLIF(v_registro.ref_cuota_5,''), NULLIF(v_registro.fecha_cuota_5::date,NULL), NULLIF(v_registro.tasa_cuota_5,0), NULLIF(v_registro.dolar_depositado_cuota_5,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_6, 0) IS NOT NULL AND NULLIF(v_registro.cuota_6, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 6, v_registro.cuota_6, NULLIF(v_registro.ref_cuota_6,''), NULLIF(v_registro.fecha_cuota_6::date,NULL), NULLIF(v_registro.tasa_cuota_6,0), NULLIF(v_registro.dolar_depositado_cuota_6,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_7, 0) IS NOT NULL AND NULLIF(v_registro.cuota_7, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 7, v_registro.cuota_7, NULLIF(v_registro.ref_cuota_7,''), NULLIF(v_registro.fecha_cuota_7::date,NULL), NULLIF(v_registro.tasa_cuota_7,0), NULLIF(v_registro.dolar_depositado_cuota_7,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_8, 0) IS NOT NULL AND NULLIF(v_registro.cuota_8, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 8, v_registro.cuota_8, NULLIF(v_registro.ref_cuota_8,''), NULLIF(v_registro.fecha_cuota_8::date,NULL), NULLIF(v_registro.tasa_cuota_8,0), NULLIF(v_registro.dolar_depositado_cuota_8,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_9, 0) IS NOT NULL AND NULLIF(v_registro.cuota_9, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 9, v_registro.cuota_9, NULLIF(v_registro.ref_cuota_9,''), NULLIF(v_registro.fecha_cuota_9::date,NULL), NULLIF(v_registro.tasa_cuota_9,0), NULLIF(v_registro.dolar_depositado_cuota_9,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_10, 0) IS NOT NULL AND NULLIF(v_registro.cuota_10, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 10, v_registro.cuota_10, NULLIF(v_registro.ref_cuota_10,''), NULLIF(v_registro.fecha_cuota_10::date,NULL), NULLIF(v_registro.tasa_cuota_10,0), NULLIF(v_registro.dolar_depositado_cuota_10,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_11, 0) IS NOT NULL AND NULLIF(v_registro.cuota_11, 0) > 0 THEN
            INSERT INTO pagos_maracay (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 11, v_registro.cuota_11, NULLIF(v_registro.ref_cuota_11,''), NULLIF(v_registro.fecha_cuota_11::date,NULL), NULLIF(v_registro.tasa_cuota_11,0), NULLIF(v_registro.dolar_depositado_cuota_11,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
    END LOOP;
    RAISE NOTICE 'pagos_maracay: % pagos insertados', v_insertados;
END $$;

-- 3. MIGRAR TIENDA MARACAIBO
DO $$
DECLARE
    v_registro RECORD;
    v_insertados INT := 0;
BEGIN
    FOR v_registro IN 
        SELECT id, 
               cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
               cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
               cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
               cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
               cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
               cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
               cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
               cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
               cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9,
               cuota_10, ref_cuota_10, fecha_cuota_10, tasa_cuota_10, dolar_depositado_cuota_10,
               cuota_11, ref_cuota_11, fecha_cuota_11, tasa_cuota_11, dolar_depositado_cuota_11
        FROM tienda_maracaibo
        WHERE monto_depositados > 0 OR cuota_1 IS NOT NULL
    LOOP
        IF NULLIF(v_registro.cuota_1, 0) IS NOT NULL AND NULLIF(v_registro.cuota_1, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 1, v_registro.cuota_1, NULLIF(v_registro.ref_cuota_1,''), NULLIF(v_registro.fecha_cuota_1::date,NULL), NULLIF(v_registro.tasa_cuota_1,0), NULLIF(v_registro.dolar_depositado_cuota_1,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_2, 0) IS NOT NULL AND NULLIF(v_registro.cuota_2, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 2, v_registro.cuota_2, NULLIF(v_registro.ref_cuota_2,''), NULLIF(v_registro.fecha_cuota_2::date,NULL), NULLIF(v_registro.tasa_cuota_2,0), NULLIF(v_registro.dolar_depositado_cuota_2,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_3, 0) IS NOT NULL AND NULLIF(v_registro.cuota_3, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 3, v_registro.cuota_3, NULLIF(v_registro.ref_cuota_3,''), NULLIF(v_registro.fecha_cuota_3::date,NULL), NULLIF(v_registro.tasa_cuota_3,0), NULLIF(v_registro.dolar_depositado_cuota_3,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_4, 0) IS NOT NULL AND NULLIF(v_registro.cuota_4, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 4, v_registro.cuota_4, NULLIF(v_registro.ref_cuota_4,''), NULLIF(v_registro.fecha_cuota_4::date,NULL), NULLIF(v_registro.tasa_cuota_4,0), NULLIF(v_registro.dolar_depositado_cuota_4,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_5, 0) IS NOT NULL AND NULLIF(v_registro.cuota_5, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 5, v_registro.cuota_5, NULLIF(v_registro.ref_cuota_5,''), NULLIF(v_registro.fecha_cuota_5::date,NULL), NULLIF(v_registro.tasa_cuota_5,0), NULLIF(v_registro.dolar_depositado_cuota_5,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_6, 0) IS NOT NULL AND NULLIF(v_registro.cuota_6, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 6, v_registro.cuota_6, NULLIF(v_registro.ref_cuota_6,''), NULLIF(v_registro.fecha_cuota_6::date,NULL), NULLIF(v_registro.tasa_cuota_6,0), NULLIF(v_registro.dolar_depositado_cuota_6,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_7, 0) IS NOT NULL AND NULLIF(v_registro.cuota_7, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 7, v_registro.cuota_7, NULLIF(v_registro.ref_cuota_7,''), NULLIF(v_registro.fecha_cuota_7::date,NULL), NULLIF(v_registro.tasa_cuota_7,0), NULLIF(v_registro.dolar_depositado_cuota_7,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_8, 0) IS NOT NULL AND NULLIF(v_registro.cuota_8, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 8, v_registro.cuota_8, NULLIF(v_registro.ref_cuota_8,''), NULLIF(v_registro.fecha_cuota_8::date,NULL), NULLIF(v_registro.tasa_cuota_8,0), NULLIF(v_registro.dolar_depositado_cuota_8,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_9, 0) IS NOT NULL AND NULLIF(v_registro.cuota_9, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 9, v_registro.cuota_9, NULLIF(v_registro.ref_cuota_9,''), NULLIF(v_registro.fecha_cuota_9::date,NULL), NULLIF(v_registro.tasa_cuota_9,0), NULLIF(v_registro.dolar_depositado_cuota_9,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_10, 0) IS NOT NULL AND NULLIF(v_registro.cuota_10, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 10, v_registro.cuota_10, NULLIF(v_registro.ref_cuota_10,''), NULLIF(v_registro.fecha_cuota_10::date,NULL), NULLIF(v_registro.tasa_cuota_10,0), NULLIF(v_registro.dolar_depositado_cuota_10,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
        IF NULLIF(v_registro.cuota_11, 0) IS NOT NULL AND NULLIF(v_registro.cuota_11, 0) > 0 THEN
            INSERT INTO pagos_maracaibo (factura_id, nro_cuota, monto_bs, referencia, fecha, tasa_bcv, monto_usd)
            VALUES (v_registro.id, 11, v_registro.cuota_11, NULLIF(v_registro.ref_cuota_11,''), NULLIF(v_registro.fecha_cuota_11::date,NULL), NULLIF(v_registro.tasa_cuota_11,0), NULLIF(v_registro.dolar_depositado_cuota_11,0))
            ON CONFLICT (factura_id, nro_cuota) DO NOTHING; v_insertados := v_insertados + 1; END IF;
    END LOOP;
    RAISE NOTICE 'pagos_maracaibo: % pagos insertados', v_insertados;
END $$;

-- 4. VERIFICACION
SELECT 'pagos_caracas' AS tabla, COUNT(*) AS total_pagos FROM pagos_caracas
UNION ALL
SELECT 'pagos_maracay' AS tabla, COUNT(*) AS total_pagos FROM pagos_maracay
UNION ALL
SELECT 'pagos_maracaibo' AS tabla, COUNT(*) AS total_pagos FROM pagos_maracaibo;

-- 5. EJEMPLO: Verificar que los datos se migraron correctamente
SELECT p.factura_id, p.nro_cuota, p.monto_bs, p.referencia, p.fecha,
       t.nro_factura, t.nombre_apellido
FROM pagos_caracas p
JOIN tienda_caracas t ON p.factura_id = t.id
ORDER BY p.factura_id, p.nro_cuota
LIMIT 10;
