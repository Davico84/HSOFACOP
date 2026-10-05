package com.odontorisas.service.records;

import com.odontorisas.persistence.repository.RecordUnlockEventRepository;
import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.common.Role;
import com.odontorisas.persistence.entity.OrthodonticRecord;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.OrthodonticRecordRepository;
import com.odontorisas.persistence.repository.UserRepository;
import com.odontorisas.service.records.content.Anamnesis;
import com.odontorisas.service.records.content.RecordContent;
import com.odontorisas.service.records.content.YesNo;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.orm.ObjectOptimisticLockingFailureException;
import tools.jackson.databind.json.JsonMapper;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneOffset;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/** Reglas del service de historias (alcance, correlativo, versión, normalización), sin Spring ni BD. */
@ExtendWith(MockitoExtension.class)
class OrthodonticRecordServiceTest {

    @Mock OrthodonticRecordRepository records;
    @Mock UserRepository users;
    @Mock RecordUnlockEventRepository unlockEvents;

    OrthodonticRecordService service;

    private final User torres = user(1L, "Dra. María Torres");
    private final User medina = user(2L, "Dr. Carlos Medina");
    private final RecordActor torresActor = new RecordActor(1L, false);
    private final RecordActor medinaActor = new RecordActor(2L, false);
    private final RecordActor admin = new RecordActor(9L, true);

    @BeforeEach
    void setUp() {
        Clock clock = Clock.fixed(LocalDate.of(2026, 10, 1).atStartOfDay().toInstant(ZoneOffset.UTC), ZoneOffset.UTC);
        service = new OrthodonticRecordService(records, users, new RecordAgeCalculator(clock), JsonMapper.builder().build(),
            unlockEvents, clock);
    }

    private static User user(Long id, String name) {
        return User.builder().id(id).email(id + "@empresa.test").fullName(name).passwordHash("h").role(Role.USER).build();
    }

    private static RecordData data(String patient) {
        return new RecordData(null, patient, null, null, null, null, null, null, null, null, null);
    }

    private OrthodonticRecord stored(User author, long version) {
        return OrthodonticRecord.builder().id(10L).author(author).recordSeq(1).recordNumber("AEO-001")
            .patientName("Ana Quispe").treatingDentist(author.getFullName()).searchText("ana quispe aeo-001")
            .content("{}").version(version).build();
    }

    private void saveReturnsArgument() {
        when(records.saveAndFlush(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    // --- Creación y correlativo ---

    @Test
    void first_record_of_a_user_is_aeo_001_with_author_as_treating_dentist() {
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(torres));
        when(records.findMaxRecordSeq(1L)).thenReturn(0);
        saveReturnsArgument();

        RecordView view = service.create(torresActor, data("  Ana Quispe "));

        assertThat(view.recordNumber()).isEqualTo("AEO-001");
        assertThat(view.authorId()).isEqualTo(1L);
        assertThat(view.treatingDentist()).isEqualTo("Dra. María Torres");
        assertThat(view.patientName()).isEqualTo("Ana Quispe");
        assertThat(view.content().functional().suckingHabitTypes()).isNotEmpty();
    }

    @Test
    void sequence_continues_per_author_and_grows_past_999() {
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(torres));
        when(records.findMaxRecordSeq(1L)).thenReturn(2, 999);
        saveReturnsArgument();

        assertThat(service.create(torresActor, data("P")).recordNumber()).isEqualTo("AEO-003");
        assertThat(service.create(torresActor, data("P")).recordNumber()).isEqualTo("AEO-1000");
    }

    @Test
    void creation_locks_the_author_row_before_reading_the_sequence() {
        when(users.findByIdForUpdate(1L)).thenReturn(Optional.of(torres));
        saveReturnsArgument();

        service.create(torresActor, data("P"));

        verify(users).findByIdForUpdate(1L);
        verify(records).findMaxRecordSeq(1L);
    }

    @Test
    void search_text_contains_normalized_patient_document_and_number() {
        assertThat(OrthodonticRecordService.searchText("Ana QUÍSPE", "74125896", "AEO-001"))
            .isEqualTo("ana quispe 74125896 aeo-001");
        assertThat(OrthodonticRecordService.searchText("Ana", null, "AEO-002")).isEqualTo("ana aeo-002");
    }

    // --- Alcance ---

    @Test
    void user_cannot_read_or_save_someone_elses_record() {
        when(records.findWithAuthorById(10L)).thenReturn(Optional.of(stored(torres, 0)));
        when(records.findByIdForUpdate(10L)).thenReturn(Optional.of(stored(torres, 0)));

        assertThatThrownBy(() -> service.get(medinaActor, 10L)).isInstanceOf(RecordNotFoundException.class);
        assertThatThrownBy(() -> service.update(medinaActor, 10L, 0, data("X"))).isInstanceOf(RecordNotFoundException.class);
        verify(records, never()).saveAndFlush(any());
    }

    @Test
    void missing_record_is_not_found() {
        when(records.findWithAuthorById(99L)).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.get(admin, 99L)).isInstanceOf(RecordNotFoundException.class);
    }

    @Test
    void admin_saves_any_record_keeping_author_and_number() {
        OrthodonticRecord record = stored(torres, 3);
        when(records.findByIdForUpdate(10L)).thenReturn(Optional.of(record));
        saveReturnsArgument();

        RecordView view = service.update(admin, 10L, 3, data("Ana Lucía Quispe"));

        assertThat(view.authorId()).isEqualTo(1L);
        assertThat(view.recordNumber()).isEqualTo("AEO-001");
        assertThat(view.patientName()).isEqualTo("Ana Lucía Quispe");
        assertThat(record.getSearchText()).isEqualTo("ana lucia quispe aeo-001");
    }

    // --- Versión ---

    @Test
    void stale_version_is_rejected_without_saving() {
        when(records.findByIdForUpdate(10L)).thenReturn(Optional.of(stored(torres, 4)));

        assertThatThrownBy(() -> service.update(torresActor, 10L, 3, data("X"))).isInstanceOf(StaleRecordException.class);
        verify(records, never()).saveAndFlush(any());
    }

    @Test
    void concurrent_write_detected_at_flush_is_stale() {
        when(records.findByIdForUpdate(10L)).thenReturn(Optional.of(stored(torres, 4)));
        when(records.saveAndFlush(any())).thenThrow(new ObjectOptimisticLockingFailureException(OrthodonticRecord.class, 10L));

        assertThatThrownBy(() -> service.update(torresActor, 10L, 4, data("X"))).isInstanceOf(StaleRecordException.class);
    }

    // --- Normalización y edad ---

    @Test
    void saves_normalized_content_and_returns_calculated_age() {
        when(records.findByIdForUpdate(10L)).thenReturn(Optional.of(stored(medina, 0)));
        ArgumentCaptor<OrthodonticRecord> saved = ArgumentCaptor.forClass(OrthodonticRecord.class);
        when(records.saveAndFlush(saved.capture())).thenAnswer(inv -> inv.getArgument(0));
        Anamnesis anamnesis = new Anamnesis(" Dientes salidos ", null, null, null, null, YesNo.NO,
            null, null, null, null, null);
        RecordContent e = RecordContent.empty();
        RecordData data = new RecordData(null, "Juan", DocumentType.DNI, "74125896", PatientSex.MALE,
            LocalDate.of(2012, 5, 20), null, null, null, LocalDate.of(2026, 5, 19),
            new RecordContent(null, anamnesis, e.facial(), e.functional(), e.occlusal(), e.models(), e.radiographic(),
                e.diagnosis(), e.signatures()));

        RecordView view = service.update(medinaActor, 10L, 0, data);

        assertThat(view.ageYears()).isEqualTo(13);
        assertThat(view.content().anamnesis().chiefComplaint()).isEqualTo("Dientes salidos");
        assertThat(view.content().anamnesis().menarche()).isNull();
        assertThat(saved.getValue().getContent()).doesNotContain("menarche\":\"NO");
    }
}
