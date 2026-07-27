-- ============================================
-- ACTUALIZACION BASE DE DATOS - MODULO USUARIOS
-- ============================================

-- Tabla de auditoria (nueva)
CREATE TABLE IF NOT EXISTS auditoria_usuarios (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    usuario_accion_id INTEGER REFERENCES usuarios(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL,
    tabla_afectada VARCHAR(50) DEFAULT 'usuarios',
    datos_anteriores JSONB,
    datos_nuevos JSONB,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Tabla de sesiones (nueva)
CREATE TABLE IF NOT EXISTS sesiones (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    dispositivo VARCHAR(200),
    ip_address VARCHAR(45),
    ultima_actividad TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    expires_at TIMESTAMP NOT NULL,
    activa BOOLEAN DEFAULT true
);

-- Tabla de tokens de recuperacion (nueva)
CREATE TABLE IF NOT EXISTS reset_tokens (
    id SERIAL PRIMARY KEY,
    usuario_id INTEGER REFERENCES usuarios(id) ON DELETE CASCADE,
    token VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    used BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Indices para optimizacion
CREATE INDEX IF NOT EXISTS idx_auditoria_usuario ON auditoria_usuarios(usuario_id);
CREATE INDEX IF NOT EXISTS idx_auditoria_fecha ON auditoria_usuarios(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_sesiones_usuario ON sesiones(usuario_id);
CREATE INDEX IF NOT EXISTS idx_sesiones_token ON sesiones(token);

-- Verificar que existe el usuario admin
INSERT INTO usuarios (nombre, email, password, rol, activo)
VALUES (
    'Administrador',
    'admin@creditos.com',
    '$2a$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi',
    'administrador',
    true
)
ON CONFLICT (email) DO NOTHING;

-- Funcion para registrar auditoria automaticamente
CREATE OR REPLACE FUNCTION registrar_auditoria()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_nuevos)
        VALUES (NEW.id, NULL, 'CREAR', to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_anteriores, datos_nuevos)
        VALUES (NEW.id, NULL, 'ACTUALIZAR', to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        INSERT INTO auditoria_usuarios (usuario_id, usuario_accion_id, accion, datos_anteriores)
        VALUES (OLD.id, NULL, 'ELIMINAR', to_jsonb(OLD));
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger para auditoria automatica en usuarios
DROP TRIGGER IF EXISTS trg_auditoria_usuarios ON usuarios;
CREATE TRIGGER trg_auditoria_usuarios
    AFTER INSERT OR UPDATE OR DELETE ON usuarios
    FOR EACH ROW
    EXECUTE FUNCTION registrar_auditoria();

-- ============================================
-- FIN ACTUALIZACION
-- ============================================
