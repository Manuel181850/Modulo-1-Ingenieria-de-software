-- =====================================================================
-- Dueño: Equipo 3
-- Tabla: casos (esquema propuesto por el Equipo 3, integrado por el Equipo 1)
-- Depende de: usuarios (Equipo 2)
--
-- Cambios del Equipo 1 respecto a la propuesta original (marcados AJUSTE Eq1):
--   * Trigger que actualiza fecha_ultima_modificacion en cada UPDATE.
--   * Se omite idx_casos_numero_caso: la restricción UNIQUE de numero_caso
--     ya crea un índice equivalente.
--
-- Nota: la secuencia del folio no se reinicia cada año; el año del folio
-- sale de CURRENT_DATE, pero el consecutivo es global.
-- =====================================================================

CREATE SEQUENCE IF NOT EXISTS seq_casos_folio
    START WITH 1
    INCREMENT BY 1;

CREATE TABLE IF NOT EXISTS casos (
    id_caso                   SERIAL PRIMARY KEY,
    numero_caso               VARCHAR(30) NOT NULL UNIQUE
        DEFAULT (
            'UDINT-' ||
            TO_CHAR(CURRENT_DATE, 'YYYY') || '-' ||
            LPAD(NEXTVAL('seq_casos_folio')::TEXT, 4, '0')
        ),
    titulo                    VARCHAR(150) NOT NULL,
    descripcion               TEXT NOT NULL,
    entidad_afectada          VARCHAR(100),
    categoria_delito          VARCHAR(50) NOT NULL,
    prioridad                 VARCHAR(15) NOT NULL
        CHECK (prioridad IN ('BAJA', 'MEDIA', 'ALTA', 'CRITICA')),
    estatus                   VARCHAR(25) NOT NULL DEFAULT 'ABIERTO'
        CHECK (estatus IN ('ABIERTO', 'EN INVESTIGACION', 'EN PAUSA', 'CERRADO')),
    fecha_apertura            TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    fecha_cierre              TIMESTAMP WITH TIME ZONE NULL,
    id_usuario_creador        INT NOT NULL,
    fecha_ultima_modificacion TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_casos_usuario_creador
        FOREIGN KEY (id_usuario_creador)
        REFERENCES usuarios (id_usuario)
);

-- AJUSTE Eq1: mantener fecha_ultima_modificacion al día
CREATE OR REPLACE FUNCTION fn_casos_actualizar_modificacion()
RETURNS trigger AS $$
BEGIN
    NEW.fecha_ultima_modificacion := CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_casos_modificacion ON casos;
CREATE TRIGGER trg_casos_modificacion
    BEFORE UPDATE ON casos
    FOR EACH ROW
    EXECUTE FUNCTION fn_casos_actualizar_modificacion();

-- Índices de rendimiento (RNF-02: < 3 s con más de 500 casos)
CREATE INDEX IF NOT EXISTS idx_casos_estatus_prioridad
    ON casos (estatus, prioridad, fecha_apertura DESC);

CREATE INDEX IF NOT EXISTS idx_casos_busqueda_fulltext
    ON casos
    USING GIN (to_tsvector('spanish', titulo || ' ' || COALESCE(descripcion, '')));
