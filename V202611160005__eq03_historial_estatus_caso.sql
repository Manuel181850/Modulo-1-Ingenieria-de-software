-- =====================================================================
-- Dueño: Equipo 3
-- Tabla: historial_estatus_caso (registro auditable de cambios de estatus)
-- Depende de: casos (Equipo 3), usuarios (Equipo 2)
--
-- Cambios del Equipo 1 respecto a la propuesta original (marcados AJUSTE Eq1):
--   * estatus_anterior admite NULL: el primer registro (al crear el caso)
--     no tiene estatus anterior.
--   * CHECK sobre los valores de estatus, iguales a los de casos.estatus.
--   * fk_hist_caso usa ON DELETE RESTRICT en lugar de CASCADE: el historial
--     es auditable y no debe desaparecer si se intenta borrar un caso.
--   * Índice por (id_caso, fecha_cambio) para consultar el historial de un caso.
-- =====================================================================

CREATE TABLE IF NOT EXISTS historial_estatus_caso (
    id_historial         SERIAL PRIMARY KEY,
    id_caso              INT NOT NULL,
    estatus_anterior     VARCHAR(25) NULL,
    estatus_nuevo        VARCHAR(25) NOT NULL,
    motivo_cambio        TEXT NOT NULL,
    fecha_cambio         TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    id_usuario_modifico  INT NOT NULL,
    CONSTRAINT ck_hist_estatus_anterior
        CHECK (estatus_anterior IS NULL
               OR estatus_anterior IN ('ABIERTO', 'EN INVESTIGACION', 'EN PAUSA', 'CERRADO')),
    CONSTRAINT ck_hist_estatus_nuevo
        CHECK (estatus_nuevo IN ('ABIERTO', 'EN INVESTIGACION', 'EN PAUSA', 'CERRADO')),
    CONSTRAINT fk_hist_caso
        FOREIGN KEY (id_caso)
        REFERENCES casos (id_caso)
        ON DELETE RESTRICT,
    CONSTRAINT fk_hist_usuario
        FOREIGN KEY (id_usuario_modifico)
        REFERENCES usuarios (id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_hist_caso_fecha
    ON historial_estatus_caso (id_caso, fecha_cambio DESC);
