-- Capacidad: cohorts — turmas, turma del alumno y turmas de la coordinación.
-- name_key = nombre normalizado (minúsculas, espacios colapsados) para la unicidad sin distinguir
-- mayúsculas ni espacios; lo calcula el servicio. Las turmas no se borran (sin ON DELETE).
CREATE TABLE cohorts (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(80) NOT NULL,
    name_key   VARCHAR(80) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_cohorts_name_key UNIQUE (name_key)
);

ALTER TABLE users ADD COLUMN cohort_id BIGINT REFERENCES cohorts (id);
ALTER TABLE users ADD CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'USER', 'COORDINATOR'));
-- Solo un alumno (USER) tiene turma de alumno.
ALTER TABLE users ADD CONSTRAINT ck_users_cohort_only_user CHECK (cohort_id IS NULL OR role = 'USER');
CREATE INDEX ix_users_cohort ON users (cohort_id);

CREATE TABLE coordinator_cohorts (
    user_id   BIGINT NOT NULL REFERENCES users (id),
    cohort_id BIGINT NOT NULL REFERENCES cohorts (id),
    PRIMARY KEY (user_id, cohort_id)
);
CREATE INDEX ix_coordinator_cohorts_cohort ON coordinator_cohorts (cohort_id);
