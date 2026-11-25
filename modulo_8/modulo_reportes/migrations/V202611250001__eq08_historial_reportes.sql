CREATE TABLE IF NOT EXISTS rep_historial_reportes_generados (
    id_reporte_generado    SERIAL PRIMARY KEY,
    id_usuario_solicitante INT NOT NULL,
    tipo_reporte           VARCHAR(50) NOT NULL,
    formato_exportacion    VARCHAR(10) NOT NULL,
    parametros_filtro      JSONB NULL,
    fecha_generacion       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_rep_usuario_solicitante
        FOREIGN KEY (id_usuario_solicitante)
        REFERENCES usuarios (id_usuario)
);

CREATE INDEX IF NOT EXISTS idx_rep_historial_usuario_fecha
    ON rep_historial_reportes_generados (id_usuario_solicitante, fecha_generacion DESC);