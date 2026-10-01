-- Capacidad: authentication — datos básicos de perfil capturados en el registro.
-- Se añaden con DEFAULT '' para no romper filas existentes (greenfield/dev).
-- username es nullable a nivel de esquema (el índice único permite múltiples NULL
-- en Postgres); la app garantiza que siempre se informa en el registro.

ALTER TABLE users ADD COLUMN full_name VARCHAR(120) NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN username  VARCHAR(30);
ALTER TABLE users ADD COLUMN phone     VARCHAR(20)  NOT NULL DEFAULT '';
ALTER TABLE users ADD COLUMN country   VARCHAR(56)  NOT NULL DEFAULT '';

CREATE UNIQUE INDEX ux_users_username ON users (username);
