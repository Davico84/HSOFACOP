package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.core.io.support.EncodedResource;
import org.springframework.jdbc.datasource.DataSourceUtils;
import org.springframework.jdbc.datasource.init.ScriptUtils;
import org.springframework.transaction.annotation.Transactional;

import javax.sql.DataSource;
import java.nio.charset.StandardCharsets;
import java.sql.Connection;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * V9 (contenido schemaVersion 2): las historias guardadas con el formato anterior del análisis
 * facial pasan a presenta / no presenta + texto, conservando el detalle eliminado como texto.
 * Se reaplica el script sobre una fila con el formato viejo (es idempotente: solo toca versión 1).
 */
@SpringBootTest
@Transactional
class FacialContentMigrationIT extends AbstractIntegrationTest {

    @Autowired JdbcTemplate jdbc;
    @Autowired DataSource dataSource;

    private long insertV1(String facialJson) {
        Long author = jdbc.queryForObject(
            "INSERT INTO users (email, password_hash, role, full_name) VALUES (?, 'h', 'USER', 'Dra. Torres') RETURNING id",
            Long.class, "mig-" + UUID.randomUUID() + "@empresa.test");
        return jdbc.queryForObject("""
            INSERT INTO orthodontic_records (author_id, record_seq, record_number, patient_name, search_text, content)
            VALUES (?, 1, 'AEO-001', 'Ana', 'ana aeo-001', CAST(? AS jsonb)) RETURNING id
            """, Long.class, author, "{\"schemaVersion\":1,\"facial\":" + facialJson + "}");
    }

    private String facial(long id, String key) {
        return jdbc.queryForObject("SELECT content->'facial'->>? FROM orthodontic_records WHERE id = ?", String.class, key, id);
    }

    private void runV9() {
        // La conexión de la transacción del test: ve las filas insertadas y se revierte al terminar.
        Connection connection = DataSourceUtils.getConnection(dataSource);
        ScriptUtils.executeSqlScript(connection,
            new EncodedResource(new ClassPathResource("db/migration/V9__facial_presence_notes.sql"), StandardCharsets.UTF_8));
    }

    @Test
    void old_facial_detail_becomes_presence_and_notes() {
        long id = insertV1("""
            {"facialType":"MESOFACIAL","facialThirds":"ABSENT_INCREASED","facialThirdsAffected":["UPPER","LOWER"],
             "restSymmetry":"ABSENT","restAsymmetrySides":["LEFT"],"openingSymmetry":"PRESENT","openingAsymmetrySides":[]}
            """);

        runV9();

        assertThat(facial(id, "facialThirds")).isEqualTo("ABSENT");
        assertThat(facial(id, "facialThirdsNotes")).isEqualTo("Tercio aumentado: superior, inferior");
        assertThat(facial(id, "restSymmetryNotes")).isEqualTo("Lado asimétrico: izquierdo");
        assertThat(facial(id, "openingSymmetryNotes")).isNull();
        assertThat(facial(id, "facialThirdsAffected")).isNull();
        assertThat(facial(id, "restAsymmetrySides")).isNull();
        assertThat(facial(id, "facialType")).isEqualTo("MESOFACIAL");
        assertThat(jdbc.queryForObject("SELECT content->>'schemaVersion' FROM orthodontic_records WHERE id = ?", String.class, id))
            .isEqualTo("2");
    }

    @Test
    void present_thirds_stay_present_and_version_2_rows_are_untouched() {
        long old = insertV1("{\"facialThirds\":\"PRESENT\"}");
        long current = jdbc.queryForObject("""
            INSERT INTO orthodontic_records (author_id, record_seq, record_number, patient_name, search_text, content)
            SELECT author_id, 2, 'AEO-002', 'Luis', 'luis aeo-002',
                   CAST('{"schemaVersion":2,"facial":{"facialThirds":"ABSENT","facialThirdsNotes":"Escrita por el usuario"}}' AS jsonb)
            FROM orthodontic_records WHERE id = ? RETURNING id
            """, Long.class, old);

        runV9();

        assertThat(facial(old, "facialThirds")).isEqualTo("PRESENT");
        assertThat(facial(old, "facialThirdsNotes")).isNull();
        assertThat(facial(current, "facialThirdsNotes")).isEqualTo("Escrita por el usuario");
    }
}
