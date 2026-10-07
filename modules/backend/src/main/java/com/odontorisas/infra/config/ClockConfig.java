package com.odontorisas.infra.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.validation.autoconfigure.ValidationConfigurationCustomizer;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.time.Clock;
import java.time.ZoneId;

/**
 * Reloj de la aplicación en la zona de la clínica ({@code app.time-zone}, por defecto
 * America/Lima): "hoy", "impreso el" y los meses del panel no dependen de la zona del servidor
 * (en Render es UTC). Inyectable para que las reglas que dependen de "hoy" se prueben con fechas
 * fijas; la validación ({@code @PastOrPresent}, fechas de la historia) usa este mismo reloj.
 */
@Configuration(proxyBeanMethods = false)
public class ClockConfig {

    @Bean
    Clock clock(@Value("${app.time-zone:America/Lima}") String zone) {
        return Clock.system(ZoneId.of(zone));
    }

    @Bean
    ValidationConfigurationCustomizer validationClock(Clock clock) {
        return configuration -> configuration.clockProvider(() -> clock);
    }
}
