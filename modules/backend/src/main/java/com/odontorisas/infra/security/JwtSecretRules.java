package com.odontorisas.infra.security;

import java.nio.charset.StandardCharsets;

/**
 * Reglas del secreto con el que se firman los access tokens (HMAC-256). Se validan al crear
 * {@link TokenService}, no durante el binding de {@link SecurityProperties}: un fallo de binding
 * lo describe el {@code BindFailureAnalyzer} de Spring Boot con "Value: …", que imprimiría el
 * secreto en el log de arranque. Ningún mensaje de esta clase incluye el valor.
 */
public final class JwtSecretRules {

    static final String PROPERTY = "app.security.jwt.secret";

    /** Mínimo para HMAC-256: una clave al menos tan larga como la salida del hash (RFC 7518 §3.2). */
    static final int MIN_SECRET_BYTES = 32;

    /** Valor de {@code JWT_SECRET} en secrets.properties.example ({@code JwtSecretRulesTest} vigila la sincronía). */
    static final String EXAMPLE_SECRET = "cambia-este-secreto-largo-y-aleatorio";

    private JwtSecretRules() {
    }

    /** Lanza {@link IllegalStateException} si el secreto no es seguro. */
    public static void validate(String secret) {
        if (secret == null || secret.isBlank()) {
            throw new IllegalStateException(PROPERTY + " es obligatorio: define JWT_SECRET");
        }
        if (secret.contains("${")) {
            throw new IllegalStateException(PROPERTY + " no está resuelto: define la variable JWT_SECRET");
        }
        if (secret.equals(EXAMPLE_SECRET)) {
            throw new IllegalStateException(PROPERTY + " usa el valor de ejemplo de secrets.properties.example:"
                + " genera uno propio (openssl rand -base64 48)");
        }
        int bytes = secret.getBytes(StandardCharsets.UTF_8).length;
        if (bytes < MIN_SECRET_BYTES) {
            throw new IllegalStateException(PROPERTY + " debe tener al menos " + MIN_SECRET_BYTES
                + " bytes (tiene " + bytes + "); genera uno con openssl rand -base64 48");
        }
    }
}
