-- Capacidad: authentication — bloqueo temporal por intentos fallidos de login.
-- Aditiva, con DEFAULT, sin backfill. Independiente de cualquier estado
-- administrativo futuro (un bloqueo manual de admin irá en otro campo).

ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMPTZ NULL;
