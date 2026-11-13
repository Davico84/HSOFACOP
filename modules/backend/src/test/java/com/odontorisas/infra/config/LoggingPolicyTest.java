package com.odontorisas.infra.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.ConfigDataApplicationContextInitializer;
import org.springframework.core.env.Environment;
import org.springframework.test.context.ContextConfiguration;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Sentencias SQL": con la configuración por defecto, el registro de sentencias y de
 * valores enlazados de Hibernate no baja de {@code WARN} (llevarían datos de pacientes).
 * Carga solo {@code application.yml}, sin contexto completo ni base de datos.
 */
@SpringJUnitConfig
@ContextConfiguration(initializers = ConfigDataApplicationContextInitializer.class)
class LoggingPolicyTest {

    @Autowired
    Environment env;

    @Test
    void hibernate_sql_and_bind_logging_is_warn_or_stricter() {
        assertThat(env.getProperty("logging.level.org.hibernate.SQL")).isIn("WARN", "ERROR", "OFF");
        assertThat(env.getProperty("logging.level.org.hibernate.orm.jdbc.bind")).isIn("WARN", "ERROR", "OFF");
    }

    @Test
    void jpa_sql_display_is_not_enabled() {
        assertThat(env.getProperty("spring.jpa.show-sql", Boolean.class, false)).isFalse();
    }
}
