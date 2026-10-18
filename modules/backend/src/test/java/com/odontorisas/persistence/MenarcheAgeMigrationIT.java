package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
import org.flywaydb.core.Flyway;
import org.flywaydb.core.api.MigrationVersion;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * V17 en un schema propio (migrado hasta V16 con Flyway) para no tocar la base que comparten los
 * demás tests: el año de la primera menstruación pasa a edad = año − año de nacimiento; sin fecha
 * de nacimiento o con resultado no positivo queda vacía; el contenido pasa a schemaVersion 10 y,
 * con un año inválido, aborta sin cambiar nada.
 */
@SpringBootTest
class MenarcheAgeMigrationIT extends AbstractIntegrationTest {

    @Autowired DataSource dataSource;

    private Flyway flyway(String schema, String target) {
        return Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).createSchemas(true)
            .locations("classpath:db/migration").target(MigrationVersion.fromVersion(target)).load();
    }

    private String schemaAt16() {
        String schema = "v17_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        flyway(schema, "16").migrate();
        return schema;
    }

    private long user(JdbcTemplate jdbc, String schema) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".users (email, password_hash, role, full_name) "
            + "VALUES (?, 'h', 'USER', 'Dra. Torres') RETURNING id", Long.class, "v17-" + UUID.randomUUID() + "@empresa.test");
    }

    private long record(JdbcTemplate jdbc, String schema, long author, String number, String birthDate, String content) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".orthodontic_records "
            + "(author_id, record_number, patient_name, birth_date, search_text, content) "
            + "VALUES (?, ?, 'Ana', CAST(? AS date), 'ana', CAST(? AS jsonb)) RETURNING id",
            Long.class, author, number, birthDate, content);
    }

    private String content(JdbcTemplate jdbc, String schema, long id) {
        return jdbc.queryForObject("SELECT content::text FROM " + schema + ".orthodontic_records WHERE id = ?", String.class, id);
    }

    @Test
    void the_menarche_year_becomes_the_age_using_the_birth_year() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        String schema = schemaAt16();
        long ana = user(jdbc, schema);
        long withBirth = record(jdbc, schema, ana, "AEO-0001", "2010-05-20",
            "{\"schemaVersion\":9,\"anamnesis\":{\"menarche\":\"YES\",\"menarcheYear\":2023}}");
        long withoutBirth = record(jdbc, schema, ana, "AEO-0002", null,
            "{\"schemaVersion\":9,\"anamnesis\":{\"menarche\":\"YES\",\"menarcheYear\":2023}}");
        long notPositive = record(jdbc, schema, ana, "AEO-0003", "2010-05-20",
            "{\"schemaVersion\":9,\"anamnesis\":{\"menarche\":\"YES\",\"menarcheYear\":1900}}");
        long nullYear = record(jdbc, schema, ana, "AEO-0004", "2010-05-20",
            "{\"schemaVersion\":9,\"anamnesis\":{\"menarcheYear\":null}}");
        long noAnamnesis = record(jdbc, schema, ana, "AEO-0005", null, "{\"schemaVersion\":9}");

        flyway(schema, "17").migrate();

        assertThat(content(jdbc, schema, withBirth)).contains("\"menarcheAge\": 13").doesNotContain("menarcheYear")
            .contains("\"menarche\": \"YES\"").contains("\"schemaVersion\": 10");
        assertThat(content(jdbc, schema, withoutBirth)).doesNotContain("menarcheAge").doesNotContain("menarcheYear")
            .contains("\"menarche\": \"YES\"");
        assertThat(content(jdbc, schema, notPositive)).doesNotContain("menarcheAge").doesNotContain("menarcheYear");
        assertThat(content(jdbc, schema, nullYear)).doesNotContain("menarche");
        assertThat(content(jdbc, schema, noAnamnesis)).isEqualTo("{\"schemaVersion\": 10}");

        jdbc.execute("DROP SCHEMA " + schema + " CASCADE");
    }

    @Test
    void an_invalid_year_aborts_without_changing_anything() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        for (String bad : java.util.List.of("\"2023\"", "2023.5")) {
            String schema = schemaAt16();
            long ana = user(jdbc, schema);
            long ok = record(jdbc, schema, ana, "AEO-0001", "2010-05-20",
                "{\"schemaVersion\":9,\"anamnesis\":{\"menarcheYear\":2023}}");
            long broken = record(jdbc, schema, ana, "AEO-0002", "2010-05-20",
                "{\"schemaVersion\":9,\"anamnesis\":{\"menarcheYear\":" + bad + "}}");

            assertThatThrownBy(() -> flyway(schema, "17").migrate()).as(bad)
                .hasStackTraceContaining("V17: menarcheYear inválido").hasStackTraceContaining("{" + broken + "}");
            assertThat(content(jdbc, schema, ok)).as(bad).contains("\"menarcheYear\": 2023");

            jdbc.execute("DROP SCHEMA " + schema + " CASCADE");
        }
    }
}
