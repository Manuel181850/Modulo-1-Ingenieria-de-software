-- =====================================================================
-- Dueño: Equipo 2 (por confirmar)
-- PROVISIONAL: solo contiene la llave primaria que referencian los demás
-- esquemas (id_usuario, tal como aparece en el diagrama del Equipo 3).
-- Sirve únicamente para probar llaves foráneas en local y en CI.
-- Se sustituye por la migración real del Equipo 2 antes de la primera
-- integración en develop.
-- =====================================================================

CREATE TABLE IF NOT EXISTS usuarios (
    id_usuario SERIAL PRIMARY KEY
);
