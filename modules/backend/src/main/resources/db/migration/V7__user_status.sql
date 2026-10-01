-- Capacidad: users — estado administrativo de la cuenta (ACTIVE / DISABLED).
-- Aditiva, con DEFAULT: las cuentas existentes quedan activas. Independiente del
-- bloqueo temporal por intentos fallidos (failed_login_attempts / locked_until).

ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE';
ALTER TABLE users ADD CONSTRAINT ck_users_status CHECK (status IN ('ACTIVE', 'DISABLED'));
