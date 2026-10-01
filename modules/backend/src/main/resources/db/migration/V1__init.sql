-- Migración inicial del esquema de OdontoRisas.
-- El esquema lo gestiona exclusivamente Flyway (ddl-auto=none).
-- Las entidades de negocio se añadirán en migraciones posteriores por capacidad.

CREATE TABLE app_metadata (
    key   VARCHAR(100) PRIMARY KEY,
    value VARCHAR(255) NOT NULL
);

INSERT INTO app_metadata (key, value) VALUES ('schema_initialized', 'true');
