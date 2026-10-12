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
 * V15 sobre datos con el formato anterior, en un schema propio (migrado hasta V14 con Flyway) para
 * no tocar la base que comparten los demás tests: números AEO- repetidos entre autores pasan a
 * números provisionales AOC- únicos, la búsqueda los sigue, la higiene oral Sí/No se quita y el
 * contenido queda en schemaVersion 8.
 */
@SpringBootTest
class RecordNumberMigrationIT extends AbstractIntegrationTest {

    @Autowired DataSource dataSource;

    private Flyway flyway(String schema, String target) {
        return Flyway.configure().dataSource(dataSource).schemas(schema).defaultSchema(schema).createSchemas(true)
            .locations("classpath:db/migration").target(MigrationVersion.fromVersion(target)).load();
    }

    private long user(JdbcTemplate jdbc, String schema) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".users (email, password_hash, role, full_name) "
            + "VALUES (?, 'h', 'USER', 'Dra. Torres') RETURNING id", Long.class, "v15-" + UUID.randomUUID() + "@empresa.test");
    }

    private long oldRecord(JdbcTemplate jdbc, String schema, long author, int seq, String content) {
        String number = "AEO-%03d".formatted(seq);
        return jdbc.queryForObject("INSERT INTO " + schema + ".orthodontic_records "
            + "(author_id, record_seq, record_number, patient_name, search_text, content) "
            + "VALUES (?, ?, ?, 'Ana Quispe', ?, CAST(? AS jsonb)) RETURNING id",
            Long.class, author, seq, number, "ana quispe " + number.toLowerCase(), content);
    }

    @Test
    void old_numbers_become_unique_provisional_aoc_numbers_and_old_hygiene_is_removed() {
        String schema = "v15_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        flyway(schema, "14").migrate();
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        long ana = user(jdbc, schema);
        long beto = user(jdbc, schema);
        long a1 = oldRecord(jdbc, schema, ana, 1, "{\"schemaVersion\":7,\"anamnesis\":{\"oralHygiene\":\"YES\",\"cooperation\":\"HIGH\"}}");
        long b1 = oldRecord(jdbc, schema, beto, 1, "{\"schemaVersion\":7,\"anamnesis\":{\"oralHygiene\":\"NO\"}}");

        flyway(schema, "15").migrate();

        String expectedA = "AOC-%04d".formatted(a1);
        String expectedB = "AOC-%04d".formatted(b1);
        assertThat(jdbc.queryForObject("SELECT record_number FROM " + schema + ".orthodontic_records WHERE id = ?", String.class, a1))
            .isEqualTo(expectedA);
        assertThat(jdbc.queryForObject("SELECT record_number FROM " + schema + ".orthodontic_records WHERE id = ?", String.class, b1))
            .isEqualTo(expectedB);
        assertThat(jdbc.queryForObject("SELECT search_text FROM " + schema + ".orthodontic_records WHERE id = ?", String.class, a1))
            .isEqualTo("ana quispe " + expectedA.toLowerCase());
        assertThat(jdbc.queryForObject("SELECT content::text FROM " + schema + ".orthodontic_records WHERE id = ?", String.class, a1))
            .doesNotContain("oralHygiene").contains("\"cooperation\": \"HIGH\"").contains("\"schemaVersion\": 8");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM information_schema.columns WHERE table_schema = ? "
            + "AND table_name = 'orthodontic_records' AND column_name = 'record_seq'", Long.class, schema)).isZero();
        // Unicidad global y formato.
        assertThatThrownBy(() -> jdbc.update("UPDATE " + schema + ".orthodontic_records SET record_number = ? WHERE id = ?", expectedA, b1))
            .hasMessageContaining("ux_orthodontic_records_record_number");
        assertThatThrownBy(() -> jdbc.update("UPDATE " + schema + ".orthodontic_records SET record_number = 'AEO-001' WHERE id = ?", b1))
            .hasMessageContaining("ck_orthodontic_records_record_number");

        jdbc.execute("DROP SCHEMA " + schema + " CASCADE");
    }

    // ---- V16: AOC -> AEO y año de la primera menstruación ----

    private String schemaAt15(JdbcTemplate jdbc) {
        String schema = "v16_" + UUID.randomUUID().toString().replace("-", "").substring(0, 12);
        flyway(schema, "15").migrate();
        return schema;
    }

    private long aocRecord(JdbcTemplate jdbc, String schema, long author, String number, String content) {
        return jdbc.queryForObject("INSERT INTO " + schema + ".orthodontic_records "
            + "(author_id, record_number, patient_name, search_text, content) "
            + "VALUES (?, ?, 'Ana Quispe', ?, CAST(? AS jsonb)) RETURNING id",
            Long.class, author, number, "ana quispe " + number.toLowerCase(), content);
    }

    private String text(JdbcTemplate jdbc, String schema, String column, long id) {
        return jdbc.queryForObject("SELECT " + column + " FROM " + schema + ".orthodontic_records WHERE id = ?", String.class, id);
    }

    @Test
    void v16_turns_aoc_into_aeo_and_the_menarche_date_into_its_year() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        String schema = schemaAt15(jdbc);
        long ana = user(jdbc, schema);
        long dated = aocRecord(jdbc, schema, ana, "AOC-0018",
            "{\"schemaVersion\":8,\"anamnesis\":{\"menarche\":\"YES\",\"menarcheDate\":\"2023-03-15\"}}");
        long nullDate = aocRecord(jdbc, schema, ana, "AOC-0019", "{\"schemaVersion\":8,\"anamnesis\":{\"menarcheDate\":null}}");
        long noAnamnesis = aocRecord(jdbc, schema, ana, "AOC-0020", "{\"schemaVersion\":8}");
        long noVersion = aocRecord(jdbc, schema, ana, "AOC-0021", "{\"anamnesis\":{}}");

        flyway(schema, "16").migrate();

        assertThat(text(jdbc, schema, "record_number", dated)).isEqualTo("AEO-0018");
        assertThat(text(jdbc, schema, "search_text", dated)).isEqualTo("ana quispe aeo-0018");
        assertThat(text(jdbc, schema, "content::text", dated))
            .contains("\"menarcheYear\": 2023").doesNotContain("menarcheDate").contains("\"schemaVersion\": 9");
        assertThat(text(jdbc, schema, "content::text", nullDate)).doesNotContain("menarche").contains("\"schemaVersion\": 9");
        assertThat(text(jdbc, schema, "content::text", noAnamnesis)).isEqualTo("{\"schemaVersion\": 9}");
        assertThat(text(jdbc, schema, "content::text", noVersion)).contains("\"schemaVersion\": 9");
        assertThat(text(jdbc, schema, "record_number", noVersion)).isEqualTo("AEO-0021");
        // El formato viejo ya no entra.
        assertThatThrownBy(() -> jdbc.update("UPDATE " + schema + ".orthodontic_records SET record_number = 'AOC-0099' WHERE id = ?", dated))
            .hasMessageContaining("ck_orthodontic_records_record_number");

        jdbc.execute("DROP SCHEMA " + schema + " CASCADE");
    }

    @Test
    void v16_aborts_without_changing_anything_when_the_content_is_invalid() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        for (String bad : java.util.List.of(
                "{\"schemaVersion\":8,\"anamnesis\":{\"menarcheDate\":\"2023-02-30\"}}",
                "{\"schemaVersion\":8,\"anamnesis\":{\"menarcheDate\":\"15/03/2023\"}}",
                "{\"schemaVersion\":8,\"anamnesis\":{\"menarcheDate\":2023}}",
                "{\"schemaVersion\":\"8\"}",
                "{\"schemaVersion\":8.0}")) {
            String schema = schemaAt15(jdbc);
            long ana = user(jdbc, schema);
            long ok = aocRecord(jdbc, schema, ana, "AOC-0018", "{\"schemaVersion\":8}");
            long broken = aocRecord(jdbc, schema, ana, "AOC-0019", bad);

            assertThatThrownBy(() -> flyway(schema, "16").migrate()).as(bad)
                .hasStackTraceContaining("V16: contenido inválido").hasStackTraceContaining("{" + broken + "}");
            assertThat(text(jdbc, schema, "record_number", ok)).as(bad).isEqualTo("AOC-0018");

            jdbc.execute("DROP SCHEMA " + schema + " CASCADE");
        }
    }
}
