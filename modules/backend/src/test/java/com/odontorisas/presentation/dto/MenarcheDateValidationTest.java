package com.odontorisas.presentation.dto;

import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.content.Anamnesis;
import com.odontorisas.service.records.content.RecordContent;
import com.odontorisas.service.records.content.YesNo;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Fecha de la primera menstruación inválida": "hoy" es el del reloj de la app (zona de la
 * clínica). A las 23:30 de Lima ya es el día siguiente en UTC: hoy es válido y mañana no.
 */
class MenarcheDateValidationTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final Clock LATE_NIGHT_LIMA =
        Clock.fixed(ZonedDateTime.of(2026, 10, 6, 23, 30, 0, 0, LIMA).toInstant(), LIMA);

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.byDefaultProvider().configure().clockProvider(() -> LATE_NIGHT_LIMA).buildValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private static UpdateRecordRequest request(LocalDate birthDate, LocalDate menarcheDate) {
        RecordContent e = RecordContent.empty();
        Anamnesis anamnesis = new Anamnesis(null, null, null, null, null, YesNo.YES, menarcheDate,
            null, null, null, null, null);
        RecordContent content = new RecordContent(null, anamnesis, e.facial(), e.functional(), e.occlusal(), e.models(),
            e.radiographic(), e.diagnosis(), e.signatures());
        return new UpdateRecordRequest(0L, "AOC-0015", null, "Ana", null, null, PatientSex.FEMALE, birthDate, null, null,
            null, null, content, null, null);
    }

    private static Set<String> messagesOnMenarcheDate(UpdateRecordRequest request) {
        return validator.validate(request).stream()
            .filter(v -> v.getPropertyPath().toString().equals("content.anamnesis.menarcheDate"))
            .map(ConstraintViolation::getMessage)
            .collect(java.util.stream.Collectors.toSet());
    }

    @Test
    void today_in_lima_is_valid_and_tomorrow_is_future() {
        assertThat(messagesOnMenarcheDate(request(LocalDate.of(2012, 5, 20), LocalDate.of(2026, 10, 6)))).isEmpty();
        assertThat(messagesOnMenarcheDate(request(LocalDate.of(2012, 5, 20), LocalDate.of(2026, 10, 7))))
            .containsExactly("La fecha de la primera menstruación no puede ser futura.");
    }

    @Test
    void before_birth_is_invalid_and_without_birth_date_only_the_future_is_checked() {
        assertThat(messagesOnMenarcheDate(request(LocalDate.of(2012, 5, 20), LocalDate.of(2012, 5, 19))))
            .containsExactly("La fecha de la primera menstruación no puede ser anterior a la de nacimiento.");
        assertThat(messagesOnMenarcheDate(request(null, LocalDate.of(2001, 1, 1)))).isEmpty();
    }
}
