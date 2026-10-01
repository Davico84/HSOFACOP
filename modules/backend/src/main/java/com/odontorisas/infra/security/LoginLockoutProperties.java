package com.odontorisas.infra.security;

import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.boot.context.properties.bind.DefaultValue;
import org.springframework.validation.annotation.Validated;

import java.time.Duration;

/**
 * Bloqueo temporal de cuenta por intentos fallidos de login (prefijo
 * {@code app.auth.lockout}). Config inválida = la aplicación no arranca.
 *
 * @param maxAttempts fallos consecutivos que bloquean la cuenta (≥ 1)
 * @param window      duración del bloqueo (ISO-8601, positiva)
 */
@Validated
@ConfigurationProperties(prefix = "app.auth.lockout")
public record LoginLockoutProperties(
    @DefaultValue("5") @Min(1) int maxAttempts,
    @DefaultValue("PT15M") Duration window) {

    public LoginLockoutProperties {
        // Bean Validation no trae una restricción estándar para Duration positiva.
        if (window == null || window.isZero() || window.isNegative()) {
            throw new IllegalArgumentException(
                "app.auth.lockout.window debe ser una duración positiva (ISO-8601), recibido: " + window);
        }
    }
}
