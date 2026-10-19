-- Capacidades: cohorts + authentication + users — código de inscripción de la turma, apertura de
-- la inscripción y datos opcionales de contacto e identificación de la cuenta.

-- Código de inscripción: 8 caracteres sin 0/O/1/I, guardado sin guion; lo genera el servicio.
ALTER TABLE cohorts ADD COLUMN registration_code VARCHAR(8);
ALTER TABLE cohorts ADD COLUMN registration_open BOOLEAN NOT NULL DEFAULT TRUE;

-- Código para las turmas existentes, uno por fila y sin repetir.
DO $$
DECLARE
    r RECORD;
    new_code VARCHAR(8);
BEGIN
    FOR r IN SELECT id FROM cohorts LOOP
        LOOP
            new_code := (SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
                         FROM generate_series(1, 8));
            EXIT WHEN NOT EXISTS (SELECT 1 FROM cohorts WHERE registration_code = new_code);
        END LOOP;
        UPDATE cohorts SET registration_code = new_code WHERE id = r.id;
    END LOOP;
END $$;

ALTER TABLE cohorts ALTER COLUMN registration_code SET NOT NULL;
ALTER TABLE cohorts ADD CONSTRAINT ux_cohorts_registration_code UNIQUE (registration_code);
ALTER TABLE cohorts ADD CONSTRAINT ck_cohorts_registration_code CHECK (registration_code ~ '^[A-HJ-NP-Z2-9]{8}$');

-- Datos de la cuenta (todos opcionales; nulo = sin registrar). Texto, nunca números.
ALTER TABLE users ADD COLUMN phone VARCHAR(9);
ALTER TABLE users ADD COLUMN document_type VARCHAR(20);
ALTER TABLE users ADD COLUMN document_number VARCHAR(12);
ALTER TABLE users ADD COLUMN cop_number VARCHAR(6);
ALTER TABLE users ADD CONSTRAINT ck_users_phone CHECK (phone IS NULL OR phone ~ '^9[0-9]{8}$');
ALTER TABLE users ADD CONSTRAINT ck_users_document CHECK ((document_type IS NULL) = (document_number IS NULL));
ALTER TABLE users ADD CONSTRAINT ck_users_document_type
    CHECK (document_type IS NULL OR document_type IN ('DNI', 'FOREIGNER_CARD', 'PASSPORT'));
ALTER TABLE users ADD CONSTRAINT ck_users_document_number CHECK (document_number IS NULL
    OR (document_type = 'DNI' AND document_number ~ '^[0-9]{8}$')
    OR (document_type = 'FOREIGNER_CARD' AND document_number ~ '^[0-9]{9}$')
    OR (document_type = 'PASSPORT' AND document_number ~ '^[0-9]{6,12}$'));
ALTER TABLE users ADD CONSTRAINT ck_users_cop CHECK (cop_number IS NULL OR cop_number ~ '^[0-9]{1,6}$');
