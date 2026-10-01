package com.odontorisas.infra.security;

import org.springframework.boot.context.properties.ConfigurationProperties;

import java.time.Duration;
import java.util.List;

/**
 * Configuración de seguridad externalizada (prefijo {@code app.security}).
 * Valores en {@code application.yml}, todos como secretos/env con defaults.
 */
@ConfigurationProperties(prefix = "app.security")
public record SecurityProperties(Jwt jwt, Cookie cookie, Cors cors) {

    public record Jwt(String secret, String issuer, Duration accessTtl, Duration refreshTtl) {}

    public record Cookie(String refreshName, boolean secure) {}

    public record Cors(List<String> allowedOrigins) {}
}
