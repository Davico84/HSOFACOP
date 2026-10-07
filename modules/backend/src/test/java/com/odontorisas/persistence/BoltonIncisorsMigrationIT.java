package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.TestRecordNumbers;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V10 (contenido schemaVersion 7): los incisivos que la historia tenga en Nance se copian a Bolton
 * (ahora propios de Bolton), con o sin Bolton guardado. Idempotente: no pisa lo que Bolton ya tiene.
 */
@SpringBootTest
@Transactional
class BoltonIncisorsMigrationIT extends AbstractIntegrationTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;

    private long insert(String contentJson) {
        Long author = jdbc.queryForObject(
            "INSERT INTO users (email, password_hash, role, full_name) VALUES (?, 'h', 'USER', 'Dra. Torres') RETURNING id",
            Long.class, "mig-" + UUID.randomUUID() + "@empresa.test");
        return jdbc.queryForObject("""
            INSERT INTO orthodontic_records (author_id, record_number, patient_name, search_text, content)
            VALUES (?, ?, 'Ana', 'ana', CAST(? AS jsonb)) RETURNING id
            """, Long.class, author, TestRecordNumbers.next(), contentJson);
    }

    private String at(long id, String path) {
        return jdbc.queryForObject("SELECT content #>> CAST(? AS text[]) FROM orthodontic_records WHERE id = ?",
            String.class, "{" + path + "}", id);
    }

    private void runV10() {
        ScriptUtils.executeSqlScript(DataSourceUtils.getConnection(dataSource),
            new EncodedResource(new ClassPathResource("db/migration/V10__bolton_incisors.sql"), StandardCharsets.UTF_8));
    }

    @Test
    void nance_incisors_are_copied_to_bolton_with_or_without_bolton() {
        long withBolton = insert("""
            {"schemaVersion":6,"models":{"nance":{"upperWidths":{"tooth11":8.6,"tooth15":7.0},"lowerWidths":{"tooth31":5.4}},
             "bolton":{"firstMolars":{"tooth16":10.2}}}}
            """);
        long withoutBolton = insert("{\"schemaVersion\":5,\"models\":{\"nance\":{\"upperWidths\":{\"tooth21\":8.5}}}}");

        runV10();

        assertThat(at(withBolton, "models,bolton,incisors,tooth11")).isEqualTo("8.6");
        assertThat(at(withBolton, "models,bolton,incisors,tooth31")).isEqualTo("5.4");
        assertThat(at(withBolton, "models,bolton,incisors,tooth15")).isNull();
        assertThat(at(withBolton, "models,bolton,firstMolars,tooth16")).isEqualTo("10.2");
        assertThat(at(withBolton, "models,nance,upperWidths,tooth11")).isEqualTo("8.6");
        assertThat(at(withBolton, "schemaVersion")).isEqualTo("7");
        assertThat(at(withoutBolton, "models,bolton,incisors,tooth21")).isEqualTo("8.5");
        assertThat(at(withoutBolton, "schemaVersion")).isEqualTo("7");
    }

    @Test
    void records_without_nance_incisors_or_already_migrated_are_untouched() {
        long noIncisors = insert("{\"schemaVersion\":6,\"models\":{\"nance\":{\"upperWidths\":{\"tooth15\":7.0}}}}");
        long migrated = insert("""
            {"schemaVersion":7,"models":{"nance":{"upperWidths":{"tooth11":8.6}},"bolton":{"incisors":{"tooth11":8.9}}}}
            """);

        runV10();
        runV10();

        assertThat(at(noIncisors, "models,bolton")).isNull();
        assertThat(at(noIncisors, "schemaVersion")).isEqualTo("6");
        assertThat(at(migrated, "models,bolton,incisors,tooth11")).isEqualTo("8.9");
    }
}
