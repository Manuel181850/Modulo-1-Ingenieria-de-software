-- =====================================================================
-- Dueño: Equipo 3
-- Tabla: asignaciones_caso (relación muchos a muchos casos <-> usuarios)
-- Depende de: casos (Equipo 3), usuarios (Equipo 2)
--
-- Cambios del Equipo 1 respecto a la propuesta original (marcados AJUSTE Eq1):
--   * fk_asig_caso usa ON DELETE RESTRICT en lugar de CASCADE: las
--     asignaciones son registros auditables y no deben desaparecer.
--   * UNIQUE (id_caso, id_usuario, rol_en_caso) se reemplaza por un índice
--     único parcial WHERE activo. Con el UNIQUE completo no se podía
--     reasignar a alguien con el mismo rol después de desasignarlo.
--   * Índice parcial por usuario para la vista "casos asignados" (Equipo 4).
-- =====================================================================

CREATE TABLE IF NOT EXISTS asignaciones_caso (
    id_asignacion      SERIAL PRIMARY KEY,
    id_caso            INT NOT NULL,
    id_usuario         INT NOT NULL,
    rol_en_caso        VARCHAR(20) NOT NULL
        CHECK (rol_en_caso IN ('INVESTIGADOR', 'CAPTURISTA')),
    fecha_asignacion   TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_usuario_asigno  INT NOT NULL,
    activo             BOOLEAN NOT NULL DEFAULT TRUE,
    CONSTRAINT fk_asig_caso
        FOREIGN KEY (id_caso)
        REFERENCES casos (id_caso)
        ON DELETE RESTRICT,
    CONSTRAINT fk_asig_usuario
        FOREIGN KEY (id_usuario)
        REFERENCES usuarios (id_usuario),
    CONSTRAINT fk_asig_asigno
        FOREIGN KEY (id_usuario_asigno)
        REFERENCES usuarios (id_usuario)
);

-- AJUSTE Eq1: una asignación activa por (caso, usuario, rol)
CREATE UNIQUE INDEX IF NOT EXISTS uk_asig_caso_usuario_rol_activo
    ON asignaciones_caso (id_caso, id_usuario, rol_en_caso)
    WHERE activo;

-- AJUSTE Eq1: consulta de casos asignados a un usuario
CREATE INDEX IF NOT EXISTS idx_asig_usuario_activo
    ON asignaciones_caso (id_usuario)
    WHERE activo;
