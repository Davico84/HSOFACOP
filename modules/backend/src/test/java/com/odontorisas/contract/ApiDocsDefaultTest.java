package com.odontorisas.contract;

import org.junit.jupiter.api.Test;
import org.springframework.boot.env.YamlPropertySourceLoader;
import org.springframework.core.env.PropertySource;
import org.springframework.core.io.ClassPathResource;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Documentación deshabilitada por defecto": el valor por defecto de la configuración
 * versionada es {@code false}. Lee application.yml tal cual (sin resolver placeholders), así es
 * determinista en cualquier máquina, tenga o no SWAGGER_ENABLED en su entorno o secrets.properties.
 */
class ApiDocsDefaultTest {

    @Test
    void api_docs_and_swagger_ui_default_to_disabled() throws Exception {
        List<PropertySource<?>> sources = new YamlPropertySourceLoader()
            .load("application", new ClassPathResource("application.yml"));

        for (String key : List.of("springdoc.api-docs.enabled", "springdoc.swagger-ui.enabled")) {
            Object raw = sources.stream().map(s -> s.getProperty(key)).filter(v -> v != null).findFirst().orElse(null);
            assertThat(raw).as(key).isNotNull();
            assertThat(raw.toString()).as(key).isEqualTo("${SWAGGER_ENABLED:false}");
        }
    }
}
