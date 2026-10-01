package com.odontorisas.infra.config;

import org.springframework.boot.context.properties.ConfigurationProperties;

/**
 * Identidad visible del proyecto (prefijo {@code app}): nombre y descripción que
 * se publican en el contrato OpenAPI. Los valores de {@code application.yml} los
 * escribe {@code pnpm project:apply} a partir de {@code project.config.json}.
 */
@ConfigurationProperties(prefix = "app")
public record ProjectProperties(String name, String description) {}
