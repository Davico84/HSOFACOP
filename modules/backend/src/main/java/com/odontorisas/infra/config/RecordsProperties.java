package com.odontorisas.infra.config;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.validation.annotation.Validated;

/**
 * Historias clínicas (prefijo {@code app.records}). Config inválida = la aplicación no arranca.
 *
 * @param defaultQuota cupo de historias con el que nace toda cuenta nueva (0–9999); nulo (variable
 *                     vacía) = las cuentas nuevas nacen sin límite. Las cuentas existentes no cambian.
 */
@Validated
@ConfigurationProperties(prefix = "app.records")
public record RecordsProperties(@Min(0) @Max(9999) Integer defaultQuota) {
}
