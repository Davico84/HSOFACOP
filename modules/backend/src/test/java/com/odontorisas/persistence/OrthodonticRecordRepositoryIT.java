package com.odontorisas.persistence;

import com.odontorisas.AbstractIntegrationTest;
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
        String number = "AEO-%03d".formatted(seq);
        return records.saveAndFlush(OrthodonticRecord.builder().author(author).recordSeq(seq).recordNumber(number)
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
    void same_seq_is_rejected_for_the_same_author_but_allowed_for_another() {
        User ana = user();
        User beto = user();
        record(ana, 1, "Paciente 1");
        record(beto, 1, "Paciente 2");

        assertThatThrownBy(() -> record(ana, 1, "Paciente 3")).isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    void max_seq_is_per_author() {
        User ana = user();
        User beto = user();
        record(ana, 1, "P1");
        record(ana, 2, "P2");

        assertThat(records.findMaxRecordSeq(ana.getId())).isEqualTo(2);
        assertThat(records.findMaxRecordSeq(beto.getId())).isZero();
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
