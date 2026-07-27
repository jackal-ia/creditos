-- ============================================================
-- CARGA DE DATOS EXCEL → POSTGRESQL
-- Tabla: tienda_caracas
-- Base de datos: creditos
-- ============================================================

-- Limpiar tabla antes de insertar (opcional, quitar si no se desea)
-- TRUNCATE TABLE tienda_caracas RESTART IDENTITY;

BEGIN;

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (1.00, '7693', 'ANDRES AELINO MANZANO SOTO', 10836.23, '2025-02-17', '7959439', NULL, NULL, NULL, 1862.10, NULL, '2025-02-17', 62.07, 30.00, 2460.00, '1562761', '2025-03-17', 66.55, 36.96, 2850.00, '1563982', '2025-04-15', 78.59, 36.26, 3440.00, '1565190', '2025-05-19', 94.76, 36.30, 224.19, '414133', '2026-01-20', 344.50, 0.65, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (2.00, '7965', 'JAIER ENRIQUE CASTILLO ILLEGAS', 14318.24, '2025-03-06', '14247261', NULL, NULL, NULL, 4352.00, '59582859', '2025-03-06', 64.45, 67.53, 2729.00, '503000338', '2025-03-28', 69.27, 39.40, 3427.00, '504000298', '2025-04-30', 86.63, 39.56, 3766.20, '505000306', '2025-05-30', 96.62, 38.98, 44.04, '506000328', '2025-06-30', 107.36, 0.41, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (3.00, '8526', 'RICARDO ANTONIO GARCIA GONZALEZ', 30202.15, '2025-04-01', '19941544', NULL, NULL, NULL, 27494.28, NULL, '2025-03-28', 69.27, 396.91, 24920.80, '592833', '2026-06-30', 623.02, 40.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (4.00, '9642', 'MARIA NATIIDAD MATUZALEN BLANCO', 12741.43, '2025-05-30', '11129236', NULL, NULL, NULL, 12711.36, '0', '2025-05-28', 95.57, 133.01, 30.07, '414133', '2026-01-20', 344.51, 0.09, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (5.00, '9716', 'YAZMIN SOLEDAD', 25981.77, '2025-06-03', '1331277', NULL, NULL, NULL, 14596.50, '231417', '2025-06-03', 96.74, 150.88, 2043.00, '2489990', '2025-06-17', 100.96, 20.24, 2072.60, '963271', '2025-06-20', 104.28, 19.88, 2242.40, '600707', '2025-07-08', 111.85, 20.05, 2347.99, '65548580', '2025-07-21', 118.85, 19.76, 1254.20, '507000325', '2025-07-31', 123.56, 10.15, 1383.63, '508000338', '2025-08-29', 146.71, 9.43, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (6.00, '9605', 'LIBIA CARIOLIS CARDENAS MUJICA', 39708.48, '2025-05-30', '16795332', NULL, NULL, NULL, 9432.00, '819942', '2025-05-19', 94.53, 99.78, 8659.21, '505000306', '2025-05-30', 96.62, 89.62, 8851.00, '29353', '2025-09-04', 151.38, 58.47, 8880.50, '220477', '2025-09-30', 177.17, 50.12, 1568.89, '772167', '2025-11-20', 239.72, 6.54, 2316.88, '121663', '2026-06-17', 596.78, 3.88, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (7.00, '9981', 'INERSIONES FONDOEFA C.A', 64427.99, '2025-06-11', '407325922', NULL, NULL, NULL, 57763.02, '10558487', '2025-06-12', 100.09, 577.11, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (8.00, '10131', 'SERGIO RAFAEL ZAPATA', 45826.00, '2025-06-18', '16804706', NULL, NULL, NULL, 2282.06, '653459', '2025-06-19', 103.42, 22.07, 3763.20, '510982', '2025-06-17', 100.96, 37.27, 7133.86, '506000328', '2025-06-30', 107.36, 66.45, 3680.00, '1566191', '2025-06-17', 100.96, 36.45, 3680.00, '1566191', '2025-06-17', 100.96, 36.45, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (9.00, '10364', 'YULECSI JEARBILEC LUGO DE SOLARTE', 43812.60, '2025-06-30', '25455965', NULL, NULL, NULL, 35263.80, '0', '2025-06-27', 106.59, 330.84, 2000.00, '404839', '2025-07-15', 115.56, 17.31, 5000.00, '831673', '2026-06-17', 596.78, 8.38, 2000.00, '635644', '2025-08-19', 135.47, 14.76, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (10.00, '10362', 'PETER MANUEL GONZALEZ GONZALEZ', 35263.80, '2025-06-30', '16452189', NULL, NULL, NULL, 32912.88, '0', '2025-06-27', 106.59, 308.78, 2350.92, '611405', '2026-06-19', 605.39, 3.88, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (11.00, '11275', 'MARIELA DEL CARMEN OSORIO MONTILLA', 46060.94, '2025-08-22', '20705077', NULL, NULL, NULL, 9212.19, '80568', '2025-08-13', 133.18, 69.17, 32775.00, '7093352', '2026-04-08', 475.01, 69.00, 2000.00, '635644', '2025-08-19', 135.47, 14.76, 5000.00, '831673', '2026-06-17', 596.78, 8.38, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (12.00, '11481', 'REINALDO MIGUEL AREALO CARABALLO', 62668.20, '2025-08-29', '26159292', NULL, NULL, NULL, 51300.48, '0', '2025-08-28', 145.38, 352.87, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (13.00, '11561', 'MATIAS FARFAN', 80075.55, '2025-09-03', '21024647', NULL, NULL, NULL, 8699.34, '563029', '2025-09-04', 151.38, 57.47, 5518.00, '510000005', '2025-09-30', 177.17, 31.15, 6991.80, '000384', '2025-10-31', 223.09, 31.34, 9720.49, '511000443', '2025-11-28', 245.06, 39.67, 10193.37, '512000459', '2025-12-30', 298.14, 34.19, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (14.00, '11779', 'FRANCISCO JAIER CASTRO ILLAMIZAR', 660477.17, '2025-09-19', '12737953', NULL, NULL, NULL, 44096.00, '592441', '2026-03-12', 440.73, 100.05, 150000.00, '67365369', '2025-09-02', 148.07, 1013.03, 48275.00, '630331', '2026-04-22', 482.54, 100.04, 50050.47, '604016', '2026-05-25', 530.50, 94.35, 60223.00, '22144', '2026-06-18', 602.33, 99.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (15.00, '11847', 'MAYRA AURISTELA ARTEAGA CARRILLO', 80439.81, '2025-09-29', '16029785', NULL, NULL, NULL, 64977.30, '0', '2025-09-26', 169.76, 382.76, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (16.00, '11973', 'NELSON ALBERTO ERDE CORONADO', 76508.59, '2025-10-03', '15217941', NULL, NULL, NULL, 1340.48, '000384', '2025-10-31', 223.09, 6.01, 9065.00, '720818', '2025-10-02', 178.98, 50.65, 2705.64, '601000297', '2026-01-30', 367.31, 7.37, 6420.00, '602000371', '2026-02-27', 417.36, 15.38, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (17.00, '12247', 'DIOGENES ALEXANDER ILLEGAS RIERO', 73086.95, '2025-10-30', '24020249', NULL, NULL, NULL, 71996.10, '0', '2025-10-28', 217.62, 330.83, 1090.85, '414133', '2026-01-20', 344.51, 3.17, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (18.00, '12507', 'PEDRO RAFAEL HERNANDEZ SABARIEGO', 596762.39, '2025-11-18', '20292712', NULL, NULL, NULL, 30000.00, '927115', '2025-10-31', 223.09, 134.47, 14560.00, '200491', '2025-10-31', 223.09, 65.27, 140.00, '739925', '2025-10-31', 223.09, 0.63, 68189.20, '761895', '2025-11-12', 232.46, 293.34, 84400.29, '496458', '2025-12-23', 287.00, 294.08, 42187.42, '194098', '2026-03-03', 423.68, 99.57, 48275.86, '175688', '2026-04-21', 481.88, 100.18, 48522.51, '886406', '2026-04-28', 485.23, 100.00, 59251.63, '150588', '2026-06-16', 592.52, 100.00);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (19.00, '12349', 'JOSE ALEXANDER GONZALEZ CASTILLO', 45975.00, '2025-11-05', '26316891', NULL, NULL, NULL, 23067.88, '94365', '2025-11-03', 223.40, 103.26, 8902.80, '511000443', '2025-11-28', 245.06, 36.33, 594.84, '512000459', '2025-12-30', 298.14, 2.00, 12467.46, '601000297', '2026-01-30', 367.31, 33.94, 14195.00, '602000371', '2026-02-27', 417.36, 34.01, 17580.96, '605000344', '2026-05-29', 547.04, 32.14, 495.35, '414133', '2026-01-20', 344.51, 1.44, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (20.00, '11504', 'OSORIO RODRIGUEZ YUDITH MAITEE', 45890.00, '2025-09-29', '10335782', NULL, NULL, NULL, 5619.00, '780784', '2025-10-07', 186.82, 30.08, 4360.00, '466189', '2025-10-28', 217.62, 20.03, 7700.00, '22194', '2025-10-29', 219.32, 35.11, 600.00, '87184', '2025-11-05', 225.57, 2.66, 8367.20, '414133', '2026-01-20', 344.51, 24.29, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (21.00, '12836', 'JESULIDE ABACHE', 97184.10, '2025-12-09', '20400262', NULL, NULL, NULL, 29156.00, '558801', '2025-12-03', 248.58, 117.29, 14271.27, '601000297', '2026-01-30', 367.31, 38.85, 12246.00, '602000371', '2026-02-27', 417.36, 29.34, 17148.67, '605000344', '2026-05-29', 547.04, 31.35, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (22.00, '12845', 'JOSE BRICEÑO', 111138.75, '2025-12-09', '28096310', NULL, NULL, NULL, 28906.04, '380771', '2025-12-03', 248.58, 116.28, 9291.24, '512000459', '2025-12-30', 298.14, 31.16, 17183.04, '601000297', '2026-01-30', 367.31, 46.78, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (23.00, '12923', 'MANUEL IANA', 159301.06, '2025-12-16', '14032082', NULL, NULL, NULL, 47975.86, '124015', '2025-12-11', 264.40, 181.45, 37025.00, '574356', '2026-02-02', 373.53, 99.12, 34018.97, '464138', '2026-03-02', 422.10, 80.59, 7979.76, '487008', '2026-03-02', 422.10, 18.90, 2187.84, '604000300', '2026-05-05', 490.04, 4.46, 24498.10, '605000344', '2026-05-29', 547.04, 44.78, 29378.16, '606000327', '2026-06-30', 623.02, 47.15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (24.00, '13207', 'JAIER ALEXIS PIÑANGO MANZANO', 97336.79, '2025-12-29', '164132192', NULL, NULL, NULL, 28843.65, '195949', '2025-12-26', 291.77, 98.86, 23594.00, '94537', '2026-02-13', 396.37, 59.53, 28902.00, '800923', '2026-04-21', 481.88, 59.98, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (25.00, '13102', 'ABRAHAM MOISES RIERO GUEARA', 77914.20, '2025-12-23', '26205776', NULL, NULL, NULL, 22883.31, '150816', '2025-12-19', 282.51, 81.00, 11516.00, '601000297', '2026-01-30', 367.31, 31.35, 149175.10, '131020', '2026-04-20', 481.22, 309.99, 5187.81, '605000344', '2026-05-29', 547.04, 9.48, 15872.70, '603000477', '2026-03-31', 472.05, 33.63, 17723.68, '604000300', '2026-05-05', 490.04, 36.17, 18157.44, '605000344', '2026-05-29', 547.04, 33.19, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (26.00, '13101', 'ALEXIS JOSE BENITEZ ROMERO', 220614.19, '2025-12-23', '6331950', NULL, NULL, NULL, 28844.94, '0', '2025-12-22', 285.40, 101.07, 13001.94, '601000297', '2026-01-30', 367.31, 35.40, 14706.00, '602000371', '2026-02-27', 417.36, 35.24, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (27.00, '13100', 'YESENIA COROMOTO GUEARA', 94182.00, '2025-12-23', '12688632', NULL, NULL, NULL, 27968.49, '150067', '2025-12-19', 282.51, 99.00, 5250.30, '601000297', '2026-01-30', 367.31, 14.29, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (28.00, '13173', 'EDWAR ANTONIO CHIRINOS CAMACHO', 128359.97, '2025-12-26', '18607275', NULL, NULL, NULL, 114225.96, '0', '2025-12-23', 287.00, 398.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (29.00, '13414', 'JOSE ANGEL BALDAN', 139645.44, '2026-01-30', '27195733', NULL, NULL, NULL, 128009.13, '0', '2026-01-29', 365.08, 350.63, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (30.00, '13457', 'DOUGLAS JOSE ARTEAGA MENDEZ', 72436.41, '2026-02-04', '15900786', NULL, NULL, NULL, 22123.18, '34295', '2026-01-29', 365.08, 60.60, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (31.00, '13464', 'LIBIA CARIOLIS CARDENAS MUJICA', 207861.20, '2026-02-05', '16795332', NULL, NULL, NULL, 37500.00, '859314', '2026-01-13', 333.34, 112.50, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (32.00, '13005', 'LIBIA CARIOLIS CARDENAS MUJICA', 158198.04, '2025-12-18', '16795332', NULL, NULL, NULL, 10000.00, '204277', '2026-02-02', 373.53, 26.77, 20000.00, '465469', '2026-03-13', 443.26, 45.12, 20000.00, '625994', '2026-02-27', 417.36, 47.92, 20000.00, '511363', '2026-03-31', 472.05, 42.37, 20000.00, '690336', '2026-04-17', 480.26, 41.64, 20000.00, '603936', '2026-04-30', 489.55, 40.85, 20000.00, '827004', '2026-05-29', 547.04, 36.56, 20000.00, '512537', '2026-06-09', 567.68, 35.23, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (33.00, '13626', 'MANUEL EDUARDO GUTIERREZ', 176798.58, '2026-02-27', '17578855', NULL, NULL, NULL, 149850.14, '0', '2026-02-24', 407.38, 367.84, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (34.00, '13625', 'CARLOS GERMAN ASQUEZ ORTEGA', 148282.68, '2026-02-27', '16177593', NULL, NULL, NULL, 125472.61, '0', '2026-02-24', 407.38, 308.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (35.00, '13845', 'CESAR ABDON SILA MONTES', 742057.50, '2026-03-20', '15228037', NULL, NULL, NULL, 46851.00, '19079', '2026-03-27', 468.51, 100.00, 95000.00, '150274', '2026-04-08', 475.01, 200.00, 103036.00, '725645', '2026-05-15', 515.18, 200.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (36.00, '13986', 'LUIS FELIPE MAGO HERRERA', 237285.97, '2026-03-30', '18242929', NULL, NULL, NULL, 71179.52, '767262', '2026-03-30', 471.70, 150.90, 41509.50, '603000477', '2026-03-31', 472.05, 87.93, 42784.50, '604000300', '2026-05-05', 490.04, 87.31, 47523.45, '606000327', '2026-06-30', 623.02, 76.28, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (37.00, '13976', 'DAIELIS NELASLLY LABRADOR', 101415.51, '2026-03-30', '20329646', NULL, NULL, NULL, 30329.00, '26255', '2026-03-26', 466.62, 65.00, 10304.00, '719089', '2026-05-19', 517.96, 19.89, 9483.65, '632307', '2026-05-25', 530.50, 17.88, 10139.21, '345790', '2026-06-09', 567.68, 17.86, 11850.33, '84906', '2026-06-16', 592.52, 20.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (38.00, '13974', 'JENNIFFER PIMENTEL AGUILAR', 126415.61, '2026-03-30', '12953882', NULL, NULL, NULL, 37480.80, '862626', '2026-03-27', 468.51, 80.00, 22549.54, '438848', '2026-04-16', 479.78, 47.00, 24482.97, '268342', '2026-05-20', 520.91, 47.00, 27848.27, '318995', '2026-06-17', 596.78, 46.66, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (39.00, '13973', 'KISSBELL NAIROBIS GONZALEZ', 75471.99, '2026-03-30', '27449390', NULL, NULL, NULL, 22608.00, '218004', '2026-03-30', 471.70, 47.93, 3026.22, '605000344', '2026-05-29', 547.04, 5.53, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (40.00, '13887', 'JESUS EDUARDO ROSALES TORRES', 209584.98, '2026-03-25', '18030264', NULL, NULL, NULL, 413.52, '469816', '2025-09-22', 166.17, 2.49, 0.01, '173536', '2025-09-24', 169.55, 0.00, 35000.00, '408284', '2026-04-08', 475.01, 73.68, 35000.00, '408284', '2026-04-08', 475.01, 73.68, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (41.00, '13888', 'JOSE GREGORIO LEAL ROJO', 2106028.31, '2026-03-25', '20867934', NULL, NULL, NULL, 463241.90, '90372439', '2026-03-11', 438.21, 1057.12, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (42.00, '13850', 'DURAN JAIME JOSE ANTONIO', 91202.99, '2026-03-20', '20482925', NULL, NULL, NULL, 27360.90, '228752', '2026-03-18', 451.51, 60.60, 9605.20, '404954', '2026-04-17', 480.26, 20.00, 7272.00, '772904', '2026-04-27', 484.74, 15.00, 18031.30, '544126', '2026-05-19', 517.96, 34.81, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (43.00, '13849', 'DENIS DIMAS', 108054.75, '2026-03-20', '26532807', NULL, NULL, NULL, 29722.29, '291614', '2026-03-17', 449.16, 66.17, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (44.00, '13847', 'HILDEMARO ALEJANDRO SOLIS', 173754.00, '2026-03-20', '26484277', NULL, NULL, NULL, 52722.40, '488303', '2026-03-16', 446.80, 118.00, 32624.26, '610152', '2026-04-16', 479.78, 68.00, 35480.26, '237989', '2026-05-19', 517.96, 68.50, 40150.00, '894646', '2026-06-23', 617.64, 65.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (45.00, '13843', 'CLAUDIA CAMACHO', 34972.07, '2026-03-20', '15604309', NULL, NULL, NULL, 9863.92, '250436', '2026-03-17', 449.16, 21.96, 6603.80, '603000477', '2026-03-31', 472.05, 13.99, 2722.56, '604000300', '2026-05-05', 490.04, 5.56, 7565.55, '605000344', '2026-05-29', 547.04, 13.83, 7560.45, '606000327', '2026-06-30', 623.02, 12.14, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (46.00, '13842', 'YENNY YERILEE ROJAS CHACON', 54179.99, '2026-03-20', '18677439', NULL, NULL, NULL, 16254.00, '946238', '2026-03-18', 451.51, 36.00, 9905.70, '603000477', '2026-03-31', 472.05, 20.98, 11348.40, '605000344', '2026-05-29', 547.04, 20.75, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (47.00, '13841', 'JUAN JOSE MEZA RIAS', 70392.52, '2026-03-20', '188084567', NULL, NULL, NULL, 21072.92, '756278', '2026-03-17', 449.16, 46.92, 445.67, '604000300', '2026-05-05', 490.04, 0.91, 15131.10, '605000344', '2026-05-29', 547.04, 27.66, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (48.00, '13840', 'GLORIELA YANILY TORRES', 97958.25, '2026-03-20', '13564564', NULL, NULL, NULL, 27658.80, '592236', '2026-03-13', 443.26, 62.40, 11244.35, '631027', '2026-03-30', 471.70, 23.84, 11514.66, '413168', '2026-04-16', 479.78, 24.00, 11526.17, '70036', '2026-04-20', 481.22, 23.95, 11612.87, '979123', '2026-04-27', 484.74, 23.96, 24401.40, '175446', '2026-06-19', 605.39, 40.31, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (49.00, '13803', 'ARIANNA LUNA SOTO', 68797.40, '2026-03-16', '27752203', NULL, NULL, NULL, 17528.00, '442389', '2026-03-11', 438.21, 40.00, 13586.92, '456217', '2026-03-27', 468.51, 29.00, 30558.43, '756359', '2026-05-22', 526.87, 58.00, 7124.05, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (50.00, '13801', 'JOSE CLEMENTE MORFEE', 31027.49, '2026-03-16', '20278833', NULL, NULL, NULL, 9309.00, '837505', '2026-03-13', 443.26, 21.00, 577.83, '603000477', '2026-03-31', 472.05, 1.22, 1786.68, '604000300', '2026-05-05', 490.04, 3.65, 432.31, '605000344', '2026-05-29', 547.04, 0.79, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (51.00, '13799', 'YERLEING TOAR GONZALEZ', 38562.75, '2026-03-16', '27475406', NULL, NULL, NULL, 11524.50, '606377', '2026-03-13', 443.26, 26.00, 7203.90, '429861', '2026-04-20', 481.22, 14.97, 7727.70, '535174', '2026-05-19', 517.96, 14.92, 8887.74, '643044', '2026-06-16', 592.52, 15.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (52.00, '13797', 'TONY ABRAHAM SANDOAL', 188102.80, '2026-03-16', '15485970', NULL, NULL, NULL, 56297.00, '38828', '2026-03-16', 446.80, 126.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (53.00, '13796', 'ELAYNE YORALIS BENITEZ', 37977.99, '2026-03-16', '14277220', NULL, NULL, NULL, 9383.00, '909754', '2026-03-16', 446.80, 21.00, 9491.00, '838324', '2026-04-07', 474.53, 20.00, 10000.00, '191454', '2026-05-21', 523.68, 19.10, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (54.00, '13706', 'JAIRO ANTONIO MALDONADO', 259045.38, '2026-03-10', '11049856', NULL, NULL, NULL, 77189.11, '558534', '2026-03-09', 433.17, 178.20, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (55.00, '13705', 'MARLYN NIÑO CARRILLO', 68489.68, '2026-03-10', '16870377', NULL, NULL, NULL, 20000.00, '883928', '2026-03-09', 433.17, 46.17, 401.83, '890992', '2026-03-09', 433.17, 0.93, 9124.75, '299614', '2026-04-17', 480.26, 19.00, 9841.24, '331217', '2026-05-19', 517.96, 19.00, 11338.82, '176674', '2026-06-17', 596.78, 19.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (56.00, '13691', 'LIBIA CARIOLIS CARDENAS MUJICA', 176714.10, '2026-03-09', '16795332', NULL, NULL, NULL, 10500.00, '705002', '2026-03-06', 428.42, 24.51, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (57.00, '13690', 'JULIO RAFAEL FREITEZ', 13792.32, '2026-03-09', '7225971', NULL, NULL, NULL, 3879.09, '402194', '2026-03-06', 428.42, 9.05, 3773.60, '254076', '2026-03-27', 468.51, 8.05, 3897.20, '271136', '2026-04-30', 489.55, 7.96, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (58.00, '13688', 'JHYNETH JOHANNA RIAS', 67668.57, '2026-03-09', '16184228', NULL, NULL, NULL, 20688.48, '100111', '2026-03-06', 428.42, 48.29, 12853.75, '603000477', '2026-03-31', 472.05, 27.23, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (59.00, '13686', 'ANDRWS RAFAEL RONDON', 112062.60, '2026-03-09', '14170120', NULL, NULL, NULL, 33618.78, '67699', '2026-03-06', 428.42, 78.47, 21828.38, '418248', '2026-04-07', 474.53, 46.00, 22519.30, '772292', '2026-05-04', 489.31, 46.02, 26002.88, '535667', '2026-06-05', 563.29, 46.16, 28658.92, '612656', '2026-06-30', 623.02, 46.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (60.00, '13685', 'MAIKEL EDUARDO MONACO', 118527.74, '2026-03-09', '23188510', NULL, NULL, NULL, 15516.36, '100111', '2026-03-06', 428.42, 36.22, 20257.47, '99710', '2026-03-09', 433.17, 46.77, 22971.84, '464541', '2026-04-15', 479.18, 47.94, 24860.00, '347069', '2026-05-19', 517.96, 48.00, 22888.50, '240227', '2026-06-18', 602.33, 38.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (61.00, '13595', 'MARY CARMEN RODRIGUEZ POZO', 66246.39, '2026-02-27', '14458541', NULL, NULL, NULL, 19872.00, '635287', '2026-02-26', 414.05, 47.99, 8940.00, '500082', NULL, NULL, NULL, 8000.00, '492328', '2026-04-17', 480.26, 16.66, 10360.00, '96665', '2026-05-19', 517.96, 20.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (62.00, '13594', 'GRATERON MARQUEZ RODOLFO', 70475.01, '2026-02-27', '12193543', NULL, NULL, NULL, 20000.00, '89808089', '2026-03-06', 428.42, 46.68, 65288.23, '121663', '2026-06-17', 596.78, 109.40, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (63.00, '13519', 'ANDRY SOSA', 12773.62, '2026-02-11', '23628773', NULL, NULL, NULL, 2500.00, '390973', '2026-03-13', 443.26, 5.64, 5000.00, '657450', '2026-05-19', 517.96, 9.65, 5273.62, '121663', '2026-06-17', 596.78, 8.84, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (64.00, '13971', 'EDWIN ROBERTSON ORTEGA', 182076.20, '2026-03-30', '17274642', NULL, NULL, NULL, 53668.56, '901950', '2026-03-27', 468.51, 114.55, 9386.81, '603000477', '2026-03-31', 472.05, 19.89, 10728.89, '604000300', '2026-05-05', 490.04, 21.89, 10728.89, '604000300', '2026-05-05', 490.04, 21.89, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (65.00, '14044', 'SORELYS EULALIA BRITO', 377904.30, '2026-04-09', '15550662', NULL, NULL, NULL, 113412.67, '1701', '2026-04-07', 474.53, 239.00, 45301.23, '886888', '2026-04-30', 489.55, 92.54, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (66.00, '14182', 'JORGE JONAIKER PUELLO MONTAÑEZ', 146876.22, '2026-04-28', '27319845', NULL, NULL, NULL, 4412.25, '421743', '2026-04-27', 484.74, 9.10, 26525.00, '298836', '2026-05-12', 504.53, 52.57, 26525.00, '298836', '2026-05-12', 504.53, 52.57, 31923.62, '107488', '2026-06-18', 602.33, 53.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (67.00, '14183', 'KEYDER RAFAEL GUTIERREZ MARTINEZ', 136696.67, '2026-04-28', '19671438', NULL, NULL, NULL, 41128.91, '519374', '2026-04-27', 484.74, 84.85, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (68.00, '14184', 'MARIA EUGENIA TEXIER DIAZ', 30053.88, '2026-04-28', '6863610', NULL, NULL, NULL, 8907.48, '644991', '2026-04-24', 483.87, 18.41, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (69.00, '14045', 'JOSE RAFAEL CASTRO HERNANDEZ', 215692.74, '2026-04-09', '11152240', NULL, NULL, NULL, 64764.01, '76876758', '2026-04-27', 484.74, 133.61, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (70.00, '14140', 'JAIR ANTONIO RAMOS ALAREZ', 183444.99, '2026-04-22', '26321193', NULL, NULL, NULL, 52451.89, '285375', '2026-04-20', 481.22, 109.00, 2406.05, '326668', '2026-04-20', 481.22, 5.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (71.00, '14139', 'DAICY COROMOTO CARDENAS', 129377.00, '2026-04-22', '19334015', NULL, NULL, NULL, 38496.08, '898889', '2026-04-20', 481.22, 80.00, 24213.46, '416157', '2026-05-19', 517.96, 46.75, 21330.36, '141569', '2026-06-17', 596.78, 35.74, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (72.00, '14138', 'YOHERIS GABRIEL SARMIENTO', 198410.25, '2026-04-22', '20892033', NULL, NULL, NULL, 72412.50, '893835', '2026-04-22', 482.54, 150.07, 2214.16, '605000345', '2026-05-29', 547.04, 4.05, 15563.46, '605000344', '2026-05-29', 547.04, 28.45, 5184.38, '606000327', '2026-06-30', 623.02, 8.32, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (73.00, '14095', 'KENNIA LISBETH MARTINEZ', 108272.24, '2026-04-20', '22014189', NULL, NULL, NULL, 31600.00, '197418', '2026-04-17', 480.26, 65.80, 820.00, '736896', '2026-04-17', 480.26, 1.71, 24093.00, '333233', '2026-06-18', 602.33, 40.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (74.00, '13848', 'LEONOR OSWARLEE ARELO', 77296.40, '2026-03-20', '31664422', NULL, NULL, NULL, 24060.50, '366466', '2026-04-20', 481.22, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (75.00, '13972', 'DELINTHON JOSE TORO', 242453.80, '2026-03-30', '12501930', NULL, NULL, NULL, 62076.09, '994892', '2026-04-20', 481.22, 129.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (76.00, '14052', 'JESUS ANTONIO RIERA GALLARDO', 29538.66, '2026-04-13', '30165064', NULL, NULL, NULL, 9124.75, '871155', '2026-04-20', 481.22, 18.96, 5176.60, '823740', '2026-05-19', 517.96, 9.99, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (77.00, '14091', 'JOHAN JOSE CORREA', 57745.19, '2026-04-20', '23621739', NULL, NULL, NULL, 17323.56, '255166', '2026-04-20', 481.22, 36.00, 340.33, '604000300', '2026-05-05', 490.04, 0.69, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (78.00, '14094', 'CARLOS ESTEBAN CASTILLO LEON', 496608.71, '2026-04-20', '13164057', NULL, NULL, NULL, 149175.10, '131020', '2026-04-20', 481.22, 309.99, 87757.20, '604000300', '2026-05-05', 490.04, 179.08, 6520.82, '605000344', '2026-05-29', 547.04, 11.92, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (79.00, '14092', 'LUIS EDIKSON CAÑAS ZAMBRANO', 439344.72, '2026-04-20', '13990023', NULL, NULL, NULL, 87405.50, '959172', '2026-04-20', 481.22, 181.63, 55442.58, '249209', '2026-06-01', 554.43, 100.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (80.00, '14270', 'JHOANCY YIRANNY CAMACHO', 46142.00, '2026-04-30', '23481875', NULL, NULL, NULL, 192149.14, '0', '2026-04-28', 485.23, 396.00, 6370.52, '356087', '2026-05-05', 490.04, 13.00, 5.26, '611405', '2026-06-19', 605.39, 0.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (81.00, '13687', 'JESUS RAMON ROJAS SOTILLO', 178007.14, '2026-03-09', '13533595', NULL, NULL, NULL, 160746.00, '876580', '2026-04-30', 489.55, 328.35, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (82.00, '14386', 'MIGUEL ALEXANDER PEREIRA', 49934.09, '2026-05-13', '28059857', NULL, NULL, NULL, 15176.05, '899606', '2026-05-04', 489.31, 31.02, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (83.00, '14384', 'ANDRY SOSA', 39035.88, '2026-05-13', '23628773', NULL, NULL, NULL, 5200.00, '52185', '2025-05-19', 94.53, 55.01, 4000.00, '777324', '2026-06-18', 602.33, 6.64, 2500.00, '727798', '2026-06-22', 614.58, 4.07, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (84.00, '14387', 'MARCELI MAIRETT MENDOZA', 31533.20, '2026-05-13', '26573762', NULL, NULL, NULL, 9273.24, '904007', '2025-05-19', 94.53, 98.10, 22524.17, '529319', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (85.00, '14358', 'JESUS EDUARDO ROSALES TORRES', 183581.25, '2026-05-11', '18030264', NULL, NULL, NULL, 4541.28, '654442', '2026-05-11', 500.46, 9.07, 179039.97, '78455771', '2025-06-04', 97.18, 1842.35, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (86.00, '14383', 'RAFAEL JOSE RODUIGUEZ ESCALONA', 81074.52, '2026-05-13', '18689211', NULL, NULL, NULL, 23993.76, '664179', '2026-05-11', 500.46, 47.94, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (87.00, '14403', 'MOISES SEGUNDO ELASQUEZ', 222258.19, '2026-05-14', '31934804', NULL, NULL, NULL, 64620.06, '166162', '2026-05-04', 489.31, 132.06, 41178.00, '605000345', '2026-05-29', 547.04, 75.27, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (88.00, '14440', 'JARRY YUNIOR TORREALBA', 266231.44, '2026-05-18', '19965348', NULL, NULL, NULL, 49440.75, '383253', '2026-05-19', 517.96, 95.45, 48603.60, '940567', '2026-05-27', 540.04, 90.00, 3240.24, '605000345', '2026-05-29', 547.04, 5.92, 30000.00, '384224', '2026-05-19', 517.96, 57.92, 56071.80, '738300', '2026-06-30', 623.02, 90.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (89.00, '14441', 'JESUS ANTONIO RIERA GALLARDO', 29527.13, '2026-05-18', '30165064', NULL, NULL, NULL, 7769.40, '826301', '2026-05-19', 517.96, 15.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (90.00, '14442', 'DILCIA MARGARITA PEREZ', 108190.54, '2026-05-18', '6222850', NULL, NULL, NULL, 32310.30, '34092', '2026-05-04', 489.31, 66.03, 15970.58, '277421', '2026-05-15', 515.18, 31.00, 18368.12, '572631', '2026-06-16', 592.52, 31.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (91.00, '14343', 'DIEGO ALEXANDER MATINEZ', 114554.70, '2026-05-11', '11685553', NULL, NULL, NULL, 34097.70, '698734', '2026-04-30', 489.55, 69.65, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (92.00, '14342', 'FRANJHERTH ANTONIO RAMIREZ', 71474.29, '2026-05-11', '27938172', NULL, NULL, NULL, 21432.84, '35371', '2026-04-30', 489.55, 43.78, 14041.12, '489', '2026-05-27', 540.04, 26.00, 16198.58, '361028', '2026-06-30', 623.02, 26.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (93.00, '14341', 'MAYRA RAQUEL CASTILLO', 429335.35, '2026-05-11', '20978858', NULL, NULL, NULL, 129327.70, '982872', '2026-04-30', 489.55, 264.18, 16566.24, '605000345', '2026-05-29', 547.04, 30.28, 66264.96, '606000329', '2026-06-30', 623.02, 106.36, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (94.00, '14340', 'JHONNY ARON GARCIA', 68537.00, '2026-05-11', '25968936', NULL, NULL, NULL, 20458.62, '75569', '2026-04-30', 489.55, 41.79, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (95.00, '14339', 'YULEXI JOSELIN ROMERO', 127772.55, '2026-05-11', '24420307', NULL, NULL, NULL, 24350.00, '73762', '2026-04-30', 489.55, 49.74, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (96.00, '14338', 'DAN FRANCOIS PERAZA', 76369.79, '2026-05-11', '19816908', NULL, NULL, NULL, 22407.06, '350082', '2026-04-30', 489.55, 45.77, 14851.05, '605000345', '2026-05-29', 547.04, 27.15, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (97.00, '14345', 'LADIMIR ALFONSO MARAPACUTO', 112106.95, '2026-05-11', '10576813', NULL, NULL, NULL, 33610.59, '20067', '2026-04-30', 489.55, 68.66, 18721.30, '605000345', '2026-05-29', 547.04, 34.22, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (98.00, '14346', 'RAMON ALFONSO ARAUJO', 99378.65, '2026-05-11', '10397079-9', NULL, NULL, NULL, 29862.55, '309117', '2026-05-04', 489.31, 61.03, 14323.00, '870705', '2026-06-17', 596.78, 24.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (99.00, '14347', 'NOHELIN DEL ALLE MENDEZ', 63151.95, '2026-05-11', '31096358', NULL, NULL, NULL, 14686.50, '122279', '2026-05-04', 489.31, 30.01, 13365.90, '605000345', '2026-05-29', 547.04, 24.43, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (100.00, '14348', 'MARCELI MAIRETT MENDOZA', 15176.05, '2026-05-11', '26573762', NULL, NULL, NULL, 4406.00, '61532', '2026-05-04', 489.31, 9.00, 5667.00, '276063', '2026-05-15', 515.18, 11.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (101.00, '14349', 'YERBERSON ALEJANDRO JIMENEZ', 170363.40, '2026-05-11', '27759085', NULL, NULL, NULL, 51402.75, '232516', '2026-05-04', 489.31, 105.05, 33797.35, '14077', '2026-06-09', 567.68, 59.54, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (102.00, '14350', 'ALEXANDER JOSUE PEREZ FALCON', 175748.44, '2026-05-11', '31692661', NULL, NULL, NULL, 52871.40, '230351', '2026-05-04', 489.31, 108.05, 15814.12, '605000345', '2026-05-29', 547.04, 28.91, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (103.00, '14351', 'RAIMER ALEXANDER PALENCIA MONTES', 101336.85, '2026-05-11', '28414265', NULL, NULL, NULL, 30352.10, '371344', '2026-05-04', 489.31, 62.03, 14355.99, '605000345', '2026-05-29', 547.04, 26.24, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (104.00, '14352', 'JOSE MANUEL DURAN PEREZ', 46017.70, '2026-05-11', '24710766', NULL, NULL, NULL, 13707.40, '423695', '2026-05-04', 489.31, 28.01, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (105.00, '14353', 'JAIER ALEJANDRO MORALES PEREZ', 90077.20, '2026-05-11', '19722361', NULL, NULL, NULL, 26925.25, '489926', '2026-05-04', 489.31, 55.03, 17416.20, '605000345', '2026-05-29', 547.04, 31.84, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (106.00, '14354', 'FRANCO SUPERANI JESUS ALBERTO', 140990.39, '2026-05-11', '28600911', NULL, NULL, NULL, 42101.30, '844788', '2026-05-04', 489.31, 86.04, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (107.00, '14355', 'TOMAS ALFONZO MARCANO', 25456.59, '2026-05-11', '25657438', NULL, NULL, NULL, 9302.00, '888971', '2026-05-04', 489.31, 19.01, 5940.30, '605000345', '2026-05-29', 547.04, 10.86, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (108.00, '14356', 'FREDDY SALOMON FIGUERA', 36226.71, '2026-05-11', '32807252', NULL, NULL, NULL, 10868.01, '588035', '2026-05-04', 489.31, 22.21, 6993.45, '605000345', '2026-05-29', 547.04, 12.78, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (109.00, '14360', 'GRAICY ALEJANDRA ROMERO PACHECO', 281491.24, '2026-05-11', '16113972', NULL, NULL, NULL, 72986.50, '944256', '2026-05-04', 489.31, 149.16, 43790.30, '598231', '2026-05-15', 515.18, 85.00, 50363.89, '593259', '2026-06-16', 592.52, 85.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (110.00, '14361', 'YENNIREET DEL ALLE PORTILLO GONZALEZ', 188467.33, '2026-05-11', '22927242', NULL, NULL, NULL, 56354.60, '626367', '2026-05-05', 490.04, 115.00, 36047.55, '605000345', '2026-05-29', 547.04, 65.90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (111.00, '14362', 'ANGELIMAR ANDREINA AILA RIAS', 32296.42, '2026-05-11', '27745578', NULL, NULL, NULL, 14686.50, '533723', '2026-05-04', 489.31, 30.01, 9450.60, '605000345', '2026-05-29', 547.04, 17.28, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (112.00, '14363', 'ANGEL GABRIEL LEAL CARMONA', 154642.13, '2026-05-11', '29894018', NULL, NULL, NULL, 45988.04, '99031', '2026-05-08', 496.29, 92.66, 29666.07, '277040', '2025-06-01', 96.62, 307.04, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (113.00, '14364', 'BARBARA ELIZABETH SOLORZANO', 92585.10, '2026-05-11', '26601452', NULL, NULL, NULL, 28991.93, '902503', '2026-05-08', 496.29, 58.42, 29880.44, '912500', '2026-05-19', 517.96, 57.69, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (114.00, '14530', 'YOHAN ANTONIO PEREZ GARCIA', 48701.31, '2026-05-21', '17783627', NULL, NULL, NULL, 14610.39, '399644', '2026-05-21', 523.68, 27.90, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (115.00, '14632', 'ISRAEL ROJAS', 21622.38, '2026-05-29', '30795283', NULL, NULL, NULL, 6600.00, '117906', '2026-05-29', 547.04, 12.06, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (116.00, '14640', 'SNYKER ADRIAN FLORES SANCHEZ', 159672.96, '2026-05-29', '33213417', NULL, NULL, NULL, 47245.82, '24840', '2026-05-29', 547.04, 86.37, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (117.00, '14637', 'FABY ARDILLA', 23840.05, '2026-05-29', '14872855', NULL, NULL, NULL, 7141.81, '953164', '2026-05-29', 547.04, 13.06, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (118.00, '14634', 'CELENNY AREALO', 167434.84, '2026-05-29', '26117958', NULL, NULL, NULL, 49992.67, '564782', '2026-05-29', 547.04, 91.39, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (119.00, '14635', 'RONNY CEDEÑO', 17187.01, '2026-05-29', '28760873', NULL, NULL, NULL, 5493.72, '85199', '2026-05-29', 547.04, 10.04, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (120.00, '14641', 'IAN CASTRO', 158564.11, '2026-05-29', '30459460', NULL, NULL, NULL, 43949.73, '128401', '2026-05-29', 547.04, 80.34, 31110.68, '447038', '2026-06-30', 623.02, 49.94, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (121.00, '14633', 'YURI RICO', 83163.00, '2026-05-29', '24093179', NULL, NULL, NULL, 24721.65, '107503', '2026-05-29', 547.04, 45.19, 27793.75, '975819', '2026-06-23', 617.64, 45.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (122.00, '14636', 'ERICKA GUEARA', 18850.28, '2026-05-29', '31776749', NULL, NULL, NULL, 54390.37, '458813', '2026-05-29', 547.04, 99.43, 14933.12, '362201', '2026-06-30', 623.02, 23.97, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (123.00, '14639', 'EMANUEL JOSUE HURTADO BRAO', 170206.94, '2026-05-29', '24029406', NULL, NULL, NULL, 50540.00, '29568', '2026-05-29', 547.04, 92.39, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (124.00, '14642', 'JOSE RAFAEL MORALES CHIRINOS', 32129.62, '2026-05-29', '10002920', NULL, NULL, NULL, 9802.26, '1712', '2026-05-28', 544.58, 18.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (125.00, '14643', 'RAMON ERNESTO GIL REYES', 130689.68, '2026-05-29', '26346141', NULL, NULL, NULL, 38900.00, '713933', '2026-05-27', 540.04, 72.03, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (126.00, '14644', 'OROPEZA TRUJILLO YETZAMY', 154189.44, '2026-05-29', '24934141', NULL, NULL, NULL, 26525.00, '316313', '2026-05-25', 530.50, 50.00, 36443.61, '2026-06-22 00:00:00', '1982-10-27', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (127.00, '14522', 'JESUS AMADOR DURAN GUTIERREZ', 127251.81, '2026-05-21', '11323980', NULL, NULL, NULL, 12502.00, '970675', '2026-05-20', 520.91, 24.00, 17740.26, '605000345', '2026-05-29', 547.04, 32.43, 83695.50, '35458539', '2026-06-05', 563.29, 148.58, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (128.00, '14473', 'DULCE MARIA GUILLEN OLIARES', 170926.79, '2026-05-20', '28225121', NULL, NULL, NULL, 51002.82, '732885', '2026-05-15', 515.18, 99.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (129.00, '14439', 'DURAN JAIME JOSE ANTONIO', 121202.63, '2026-05-18', '20482925', NULL, NULL, NULL, 36257.20, '759651', '2026-05-19', 517.96, 70.00, 24293.32, '692881', '2026-06-16', 592.52, 41.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

INSERT INTO tienda_caracas (
    numero, nro_factura, nombre_apellido, monto_factura, fecha_factura, cedula,
    monto_pendiente, monto_depositados, deuda,
    cuota_1, ref_cuota_1, fecha_cuota_1, tasa_cuota_1, dolar_depositado_cuota_1,
    cuota_2, ref_cuota_2, fecha_cuota_2, tasa_cuota_2, dolar_depositado_cuota_2,
    cuota_3, ref_cuota_3, fecha_cuota_3, tasa_cuota_3, dolar_depositado_cuota_3,
    cuota_4, ref_cuota_4, fecha_cuota_4, tasa_cuota_4, dolar_depositado_cuota_4,
    cuota_5, ref_cuota_5, fecha_cuota_5, tasa_cuota_5, dolar_depositado_cuota_5,
    cuota_6, ref_cuota_6, fecha_cuota_6, tasa_cuota_6, dolar_depositado_cuota_6,
    cuota_7, ref_cuota_7, fecha_cuota_7, tasa_cuota_7, dolar_depositado_cuota_7,
    cuota_8, ref_cuota_8, fecha_cuota_8, tasa_cuota_8, dolar_depositado_cuota_8,
    cuota_9, ref_cuota_9, fecha_cuota_9, tasa_cuota_9, dolar_depositado_cuota_9
) VALUES (130.00, '14382', 'DANIELA ROMERO', 76798.62, '2026-05-13', '26040051', NULL, NULL, NULL, 27468.50, '427451', '2026-05-29', 547.04, 50.21, 31151.00, '210921', '2026-06-30', 623.02, 50.00, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL);

COMMIT;

-- ============================================================
-- Total registros: 130
-- Errores: 0
-- ============================================================