package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.TestRecordNumbers;
import com.odontorisas.common.Role;
import com.odontorisas.common.text.SearchNormalizer;
import com.odontorisas.persistence.entity.OrthodonticRecord;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.OrthodonticRecordRepository;
import com.odontorisas.persistence.repository.UserRepository;
import com.odontorisas.persistence.specification.OrthodonticRecordSpecifications;
import jakarta.persistence.EntityManager;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Persistencia de las historias contra PostgreSQL real, acotada al repositorio (sin service):
 * JSONB de ida y vuelta, correlativo único por autor, búsqueda normalizada, alcance y orden.
 */
@SpringBootTest
@Transactional
class OrthodonticRecordRepositoryIT extends AbstractIntegrationTest {

    @Autowired OrthodonticRecordRepository records;
    @Autowired UserRepository users;
    @Autowired JdbcTemplate jdbc;
    @Autowired EntityManager em;

    private User user() {
        return users.save(User.builder().email("rec-" + UUID.randomUUID() + "@empresa.test")
            .passwordHash("h").fullName("Dra. Torres").role(Role.USER).build());
    }

    private OrthodonticRecord record(User author, int seq, String patient) {
        String number = seq >= 9000 ? "AOC-%04d".formatted(seq) : TestRecordNumbers.next();
        return records.saveAndFlush(OrthodonticRecord.builder().author(author).recordNumber(number)
            .patientName(patient).searchText(SearchNormalizer.normalize(patient + " " + number))
            .content("{\"schemaVersion\":1,\"anamnesis\":{\"chiefComplaint\":\"Dientes \\\"salidos\\\"\"}}")
            .build());
    }

    @Test
    void jsonb_content_round_trips() {
        OrthodonticRecord saved = record(user(), 1, "Ana Quispe");
        em.clear();

        String content = records.findById(saved.getId()).orElseThrow().getContent();

        assertThat(content).contains("\"chiefComplaint\"").contains("salidos");
        assertThat(jdbc.queryForObject("SELECT content->'anamnesis'->>'chiefComplaint' FROM orthodontic_records WHERE id = ?",
            String.class, saved.getId())).isEqualTo("Dientes \"salidos\"");
    }

    @Test
    void the_same_number_is_rejected_even_for_another_author() {
        User ana = user();
        User beto = user();
        OrthodonticRecord first = record(ana, 1, "Paciente 1");

        assertThatThrownBy(() -> records.saveAndFlush(OrthodonticRecord.builder().author(beto)
            .recordNumber(first.getRecordNumber()).patientName("Paciente 2").searchText("paciente 2").content("{}").build()))
            .isInstanceOf(DataIntegrityViolationException.class)
            .hasMessageContaining("ux_orthodontic_records_record_number");
    }

    @Test
    void number_in_another_record_is_global_and_excludes_the_record_itself() {
        User ana = user();
        User beto = user();
        OrthodonticRecord own = record(ana, 9001, "P1");
        record(beto, 9002, "P2");

        assertThat(records.existsNumberInOtherRecord("AOC-9002", null)).isTrue();
        assertThat(records.existsNumberInOtherRecord("AOC-9002", own.getId())).isTrue();
        assertThat(records.existsNumberInOtherRecord("AOC-9001", own.getId())).isFalse();
        assertThat(records.existsNumberInOtherRecord("AOC-9003", null)).isFalse();
    }

    @Test
    void search_is_accent_and_case_insensitive_and_scoped_by_author() {
        User ana = user();
        User beto = user();
        OrthodonticRecord quispe = record(ana, 1, "Ana QUÍSPE");
        record(beto, 1, "Rosa Quispe");

        var mine = records.findAll(OrthodonticRecordSpecifications.authoredBy(ana.getId())
            .and(OrthodonticRecordSpecifications.searchTextContains(SearchNormalizer.normalize("quispe"))),
            PageRequest.of(0, 10));

        assertThat(mine.getContent()).extracting(OrthodonticRecord::getId).containsExactly(quispe.getId());
        assertThat(mine.getContent().getFirst().getAuthor().getFullName()).isEqualTo("Dra. Torres");
    }

    @Test
    void like_wildcards_typed_by_the_user_are_literal() {
        User ana = user();
        record(ana, 1, "Ana Quispe");

        var result = records.findAll(OrthodonticRecordSpecifications.authoredBy(ana.getId())
            .and(OrthodonticRecordSpecifications.searchTextContains("%")), PageRequest.of(0, 10));

        assertThat(result.getContent()).isEmpty();
    }

    @Test
    void list_is_ordered_by_last_update_desc() {
        User ana = user();
        OrthodonticRecord older = record(ana, 1, "Antigua");
        OrthodonticRecord newer = record(ana, 2, "Reciente");
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        jdbc.update("UPDATE orthodontic_records SET updated_at = ? WHERE id = ?", Timestamp.from(now.minusSeconds(60)), newer.getId());
        jdbc.update("UPDATE orthodontic_records SET updated_at = ? WHERE id = ?", Timestamp.from(now), older.getId());
        em.clear();

        var page = records.findAll(OrthodonticRecordSpecifications.authoredBy(ana.getId()),
            PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "updatedAt")));

        assertThat(page.getContent()).extracting(OrthodonticRecord::getId).containsExactly(older.getId(), newer.getId());
    }
}
