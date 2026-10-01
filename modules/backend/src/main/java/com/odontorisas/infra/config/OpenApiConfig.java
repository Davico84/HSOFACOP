package com.odontorisas.infra.config;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Info;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * Metadatos del contrato OpenAPI. springdoc expone el documento en
 * {@code /v3/api-docs} (y la UI en {@code /swagger-ui.html}); ese documento es
 * la fuente del codegen del frontend (ver capacidad {@code api-type-contracts}).
 * Título y descripción salen de {@link ProjectProperties} (identidad del proyecto).
 */
@Configuration
@EnableConfigurationProperties(ProjectProperties.class)
class OpenApiConfig {

    @Bean
    OpenAPI openAPI(ProjectProperties project) {
        return new OpenAPI().info(new Info()
            .title(project.name() + " API")
            .description(project.description())
            .version("v1"));
    }
}
