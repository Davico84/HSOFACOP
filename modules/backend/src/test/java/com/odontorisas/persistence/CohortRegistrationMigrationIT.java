package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * V19 en un schema propio (migrado hasta V18) para no tocar la base que comparten los demás tests:
 * cada turma existente recibe un código válido y distinto y queda abierta; los datos de contacto de
 * las cuentas solo admiten nulo o el formato correcto.
 */
@SpringBootTest
class CohortRegistrationMigrationIT extends AbstractIntegrationTest {

    @Autowired DataSource dataSource;

    private Flyway flyway(String schema, String target) {
        return Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).createSchemas(true)
            .locations("classpath:db/migration").target(MigrationVersion.fromVersion(target)).load();
    }

    private String schemaAt(String version) {
        String schema = "v19_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        flyway(schema, version).migrate();
        return schema;
    }

    private long user(JdbcTemplate jdbc, String schema) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".users (email, password_hash, role, full_name) "
            + "VALUES (?, 'h', 'USER', 'Ana') RETURNING id", Long.class, "v19-" + UUID.randomUUID() + "@empresa.test");
    }

    @Test
    void existing_cohorts_get_a_valid_distinct_code_and_stay_open() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        String schema = schemaAt("18");
        for (int i = 1; i <= 25; i++) {
            jdbc.update("INSERT INTO " + schema + ".cohorts (name, name_key) VALUES (?, ?)", "Turma " + i, "turma " + i);
        }

        flyway(schema, "19").migrate();

        List<String> codes = jdbc.queryForList("SELECT registration_code FROM " + schema + ".cohorts", String.class);
        assertThat(codes).hasSize(25).doesNotHaveDuplicates()
            .allSatisfy(code -> assertThat(code).matches("[A-HJ-NP-Z2-9]{8}"));
        assertThat(jdbc.queryForObject("SELECT bool_and(registration_open) FROM " + schema + ".cohorts", Boolean.class))
            .isTrue();
    }

    @Test
    void contact_checks_accept_null_or_the_right_format() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        String schema = schemaAt("19");
        long ana = user(jdbc, schema);
        String update = "UPDATE " + schema + ".users SET phone = ?, document_type = ?, document_number = ?, cop_number = ? WHERE id = ?";

        jdbc.update(update, "987654321", "FOREIGNER_CARD", "001234567", "12345", ana);
        jdbc.update(update, null, null, null, null, ana);

        assertThatThrownBy(() -> jdbc.update(update, "887654321", null, null, null, ana)).hasMessageContaining("ck_users_phone");
        assertThatThrownBy(() -> jdbc.update(update, "", null, null, null, ana)).hasMessageContaining("ck_users_phone");
        assertThatThrownBy(() -> jdbc.update(update, null, "DNI", null, null, ana)).hasMessageContaining("ck_users_document");
        assertThatThrownBy(() -> jdbc.update(update, null, "DNI", "7412589", null, ana))
            .hasMessageContaining("ck_users_document_number");
        assertThatThrownBy(() -> jdbc.update(update, null, null, null, "12a", ana)).hasMessageContaining("ck_users_cop");
        assertThatThrownBy(() -> jdbc.update("INSERT INTO " + schema
                + ".cohorts (name, name_key, registration_code) VALUES ('X', 'x', 'ABCDEFG0')"))
            .hasMessageContaining("ck_cohorts_registration_code");
    }
}
