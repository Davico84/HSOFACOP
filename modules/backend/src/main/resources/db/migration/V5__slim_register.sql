-- Registro mínimo: username, phone y country se difieren a la gestión de perfil
-- (capacidad `users`). Se eliminan las columnas introducidas en V4; se conserva
-- full_name (se captura en el registro). Se re-añadirán con la capacidad `users`.

DROP INDEX IF EXISTS ux_users_username;
ALTER TABLE users DROP COLUMN IF EXISTS username;
ALTER TABLE users DROP COLUMN IF EXISTS phone;
ALTER TABLE users DROP COLUMN IF EXISTS country;
