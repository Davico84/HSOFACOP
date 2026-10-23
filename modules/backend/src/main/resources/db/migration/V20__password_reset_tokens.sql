-- Capacidades: authentication + users — enlaces de restablecimiento de contraseña que genera el
-- ADMIN. Solo se guarda el hash SHA-256 del token (nunca el valor en claro). Un enlace nuevo borra
-- los no usados de la cuenta; los usados quedan como registro.
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id),
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_by  BIGINT NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_password_reset_tokens_hash UNIQUE (token_hash)
);
CREATE INDEX ix_password_reset_tokens_user ON password_reset_tokens (user_id);
