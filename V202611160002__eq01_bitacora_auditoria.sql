-- =====================================================================
-- Dueño: Equipo 1 (tabla común de la plataforma)
-- Tabla: bitacora_auditoria
-- PROPUESTA del Equipo 1: las columnas se ratifican en el Comité de
-- Integración con los equipos que escriben o leen la bitácora
-- (Administrador, Consultor, Reportes, etc.).
-- Depende de: usuarios (Equipo 2)
-- =====================================================================

CREATE TABLE IF NOT EXISTS bitacora_auditoria (
    id_bitacora   BIGSERIAL PRIMARY KEY,
    fecha_evento  TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    -- NULL permitido: eventos sin usuario identificado (p. ej. intento de login fallido)
    id_usuario    INT NULL,
    modulo        VARCHAR(30) NOT NULL,   -- p. ej. 'AUTH', 'ADMINISTRADOR', 'CAPTURISTA', 'CONSULTOR'
    accion        VARCHAR(50) NOT NULL,   -- p. ej. 'LOGIN', 'CREAR_CASO', 'CAMBIAR_ESTATUS'
    entidad       VARCHAR(50) NULL,       -- tabla o entidad afectada
    id_entidad    VARCHAR(50) NULL,       -- id del registro afectado
    -- Sin llave foránea a casos a propósito: la bitácora es común y no debe
    -- depender de las tablas de un módulo.
    id_caso       INT NULL,
    detalle       JSONB NULL,
    ip_origen     INET NULL,
    CONSTRAINT fk_bitacora_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_bitacora_fecha
    ON bitacora_auditoria (fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_usuario_fecha
    ON bitacora_auditoria (id_usuario, fecha_evento DESC);
CREATE INDEX IF NOT EXISTS idx_bitacora_caso
    ON bitacora_auditoria (id_caso)
    WHERE id_caso IS NOT NULL;

-- La bitácora es de solo inserción: un registro auditable no se edita ni se borra.
CREATE OR REPLACE FUNCTION fn_bitacora_solo_insercion()
RETURNS trigger AS $$
BEGIN
    RAISE EXCEPTION 'bitacora_auditoria es de solo inserción (operación %)', TG_OP;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_bitacora_solo_insercion ON bitacora_auditoria;
CREATE TRIGGER trg_bitacora_solo_insercion
    BEFORE UPDATE OR DELETE ON bitacora_auditoria
    FOR EACH ROW
    EXECUTE FUNCTION fn_bitacora_solo_insercion();
