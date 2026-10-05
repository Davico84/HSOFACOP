-- Capacidad: users + orthodontic-records — cupo de historias clínicas por tratante.
-- NULL = sin límite (valor de todas las cuentas existentes); 0 = no puede crear ninguna.
ALTER TABLE users ADD COLUMN record_quota INTEGER NULL;
ALTER TABLE users ADD CONSTRAINT ck_users_record_quota CHECK (record_quota IS NULL OR record_quota >= 0);
