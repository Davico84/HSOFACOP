package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Migración inicial en base limpia": Flyway aplica las migraciones de
 * db/migration sobre un PostgreSQL limpio y Hibernate no crea tablas por su cuenta
 * (ddl-auto=none).
 */
@SpringBootTest
class FlywayMigrationTest extends AbstractIntegrationTest {

    @Autowired
    JdbcTemplate jdbcTemplate;

    @Test
    void should_apply_flyway_migrations_on_clean_database() {
        Integer migrations = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM flyway_schema_history WHERE success = true", Integer.class);
        assertThat(migrations).isGreaterThanOrEqualTo(1);
    }

    @Test
    void should_have_created_schema_from_migration() {
        // La tabla proviene de V1__init.sql, no de Hibernate.
        Integer rows = jdbcTemplate.queryForObject(
            "SELECT COUNT(*) FROM app_metadata WHERE key = 'schema_initialized'", Integer.class);
        assertThat(rows).isEqualTo(1);
    }
}
