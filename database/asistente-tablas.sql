-- ============================================================
-- TABLAS DEL ASISTENTE VIRTUAL IPSFA - FASE 1
-- ARCHIVO: database/asistente-tablas.sql
-- MOTOR: PostgreSQL (ejecutar en pgAdmin o con psql)
--
-- CARACTERÍSTICAS:
--   * Todo es IDEMPOTENTE: se puede ejecutar varias veces sin
--     errores (CREATE TABLE IF NOT EXISTS / CREATE INDEX IF NOT
--     EXISTS / ADD COLUMN IF NOT EXISTS).
--   * CORRECCIÓN OBLIGATORIA vs documento original:
--     PostgreSQL NO acepta la sintaxis "INDEX idx... (col)" dentro
--     del CREATE TABLE (eso es de MySQL). Aquí todos los índices se
--     crean con sentencias CREATE INDEX IF NOT EXISTS SEPARADAS.
--
-- ORDEN DE EJECUCIÓN: de arriba hacia abajo, en una sola pasada.
-- ============================================================


-- ------------------------------------------------------------
-- 1. RESUMENES DIARIOS GUARDADOS
--    Un resumen por usuario por día (UNIQUE(usuario_id, fecha)).
--    El contenido completo va en la columna JSONB "resumen".
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS resumenes_diarios (
    id          SERIAL PRIMARY KEY,                        -- Identificador autoincremental
    usuario_id  INTEGER REFERENCES usuarios(id),           -- Usuario dueño del resumen
    fecha       DATE NOT NULL,                             -- Día al que corresponde el resumen
    resumen     JSONB NOT NULL,                            -- Contenido del resumen (tareas, cartera, etc.)
    tienda      VARCHAR(50),                               -- Tienda del usuario (caracas/maracay/maracaibo)
    created_at  TIMESTAMP DEFAULT NOW(),                   -- Fecha/hora de creación del registro
    UNIQUE(usuario_id, fecha)                              -- Un solo resumen por usuario y día
);

-- Índice para consultas por usuario y fecha (CORRECCIÓN: va FUERA del CREATE TABLE)
CREATE INDEX IF NOT EXISTS idx_resumenes_usuario_fecha
    ON resumenes_diarios(usuario_id, fecha);


-- ------------------------------------------------------------
-- 2. NOTIFICACIONES DEL SISTEMA
--    Bandeja de notificaciones por usuario (resúmenes,
--    recordatorios, alertas de pagos pendientes, etc.).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notificaciones (
    id          SERIAL PRIMARY KEY,                        -- Identificador autoincremental
    usuario_id  INTEGER REFERENCES usuarios(id),           -- Usuario destinatario
    tipo        VARCHAR(50) NOT NULL,                      -- RESUMEN_DIARIO | RECORDATORIO_MEDIO_DIA | ALERTA_PAGOS_PENDIENTES | ...
    mensaje     TEXT NOT NULL,                             -- Texto visible para el usuario
    datos       JSONB,                                     -- Datos estructurados adicionales (opcional)
    leida       BOOLEAN DEFAULT FALSE,                     -- true cuando el usuario la marca como leída
    created_at  TIMESTAMP DEFAULT NOW()                    -- Fecha/hora de creación
);

-- Índice para listar rápido las notificaciones no leídas de un usuario
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_leida
    ON notificaciones(usuario_id, leida);


-- ------------------------------------------------------------
-- 3. LOGS DEL SISTEMA
--    Bitácora en BD de procesos automáticos (cron) y eventos
--    relevantes del asistente. Complementa los archivos físicos
--    en logs/YYYY-MM-DD.log.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS logs_sistema (
    id          SERIAL PRIMARY KEY,                        -- Identificador autoincremental
    tipo        VARCHAR(50) NOT NULL,                      -- CRON_RESUMEN | CRON_LIMPIEZA | ...
    mensaje     TEXT NOT NULL,                             -- Descripción del evento
    datos       JSONB,                                     -- Detalle estructurado (totales, errores, etc.)
    created_at  TIMESTAMP DEFAULT NOW()                    -- Fecha/hora del evento
);

-- Índice para consultas/depuración por tipo y fecha
CREATE INDEX IF NOT EXISTS idx_logs_sistema_tipo_created
    ON logs_sistema(tipo, created_at);


-- ------------------------------------------------------------
-- 4. ALERTAS CONFIGURADAS
--    Configuración de alertas por usuario. Una alerta de cada
--    tipo por usuario (UNIQUE(usuario_id, tipo)).
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS alertas_config (
    id            SERIAL PRIMARY KEY,                      -- Identificador autoincremental
    usuario_id    INTEGER REFERENCES usuarios(id),         -- Usuario dueño de la alerta
    tipo          VARCHAR(50) NOT NULL,                    -- Tipo de alerta (PAGOS_PENDIENTES, MOROSOS, ...)
    configuracion JSONB NOT NULL,                          -- Parámetros de la alerta (umbrales, horarios, ...)
    activa        BOOLEAN DEFAULT TRUE,                    -- false para desactivarla sin borrarla
    created_at    TIMESTAMP DEFAULT NOW(),                 -- Fecha/hora de creación
    updated_at    TIMESTAMP DEFAULT NOW(),                 -- Última modificación de la configuración
    UNIQUE(usuario_id, tipo)                               -- Una sola configuración por tipo y usuario
);

-- Índice para buscar alertas activas de un usuario
CREATE INDEX IF NOT EXISTS idx_alertas_config_usuario_activa
    ON alertas_config(usuario_id, activa);


-- ------------------------------------------------------------
-- 5. HISTORIAL DE CONVERSACIONES DEL ASISTENTE
--    Guarda cada pregunta/respuesta procesada por el NLP, con el
--    intent detectado y su nivel de confianza.
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversaciones_asistente (
    id          SERIAL PRIMARY KEY,                        -- Identificador autoincremental
    usuario_id  INTEGER REFERENCES usuarios(id),           -- Usuario que hizo la pregunta
    pregunta    TEXT NOT NULL,                             -- Pregunta original del usuario
    respuesta   TEXT,                                      -- Respuesta generada por el asistente
    intent      VARCHAR(50),                               -- Intent detectado (deuda_total, mayor_deudor, ...)
    confianza   INTEGER,                                   -- Nivel de confianza del intent (0-100)
    tienda      VARCHAR(50),                               -- Tienda sobre la que se consultó
    created_at  TIMESTAMP DEFAULT NOW()                    -- Fecha/hora de la interacción
);

-- Índice para el historial de conversaciones de un usuario
CREATE INDEX IF NOT EXISTS idx_conversaciones_usuario
    ON conversaciones_asistente(usuario_id, created_at);


-- ============================================================
-- MODIFICACIONES EN TABLAS EXISTENTES
-- ============================================================

-- ------------------------------------------------------------
-- 6. CAMPOS NUEVOS EN LA TABLA usuarios
--    ultimo_acceso: usado por el cron de medio día para saber
--                   quiénes están conectados recientemente.
--    preferencias_interaccion: JSONB con las preferencias del
--                   usuario sobre los mensajes automáticos del
--                   asistente (bienvenida, recordatorios, etc.).
-- ------------------------------------------------------------
ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS ultimo_acceso TIMESTAMP;

ALTER TABLE usuarios
    ADD COLUMN IF NOT EXISTS preferencias_interaccion JSONB DEFAULT '{
        "bienvenida": true,
        "resumen_diario": true,
        "recordatorio_mediodia": true,
        "despedida": true,
        "consejos": true,
        "recordatorio_cierre": true,
        "hora_recordatorio": "12:00",
        "hora_despedida": "17:30"
    }';

-- ============================================================
-- FIN DEL SCRIPT
-- Verificación rápida (opcional, ejecutar aparte si se desea):
--   SELECT tablename FROM pg_tables WHERE schemaname = 'public'
--     AND tablename IN ('resumenes_diarios','notificaciones',
--     'logs_sistema','alertas_config','conversaciones_asistente');
-- ============================================================
