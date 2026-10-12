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
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Fecha de la primera menstruación inválida" (año): el año actual es el del reloj de la
 * app (zona de la clínica). A las 23:30 del 31/12 en Lima ya es el año siguiente en UTC: el año en
 * curso es válido y el siguiente es futuro.
 */
class MenarcheYearValidationTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final Clock NEW_YEARS_EVE_LIMA =
        Clock.fixed(ZonedDateTime.of(2026, 12, 31, 23, 30, 0, 0, LIMA).toInstant(), LIMA);

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.byDefaultProvider().configure().clockProvider(() -> NEW_YEARS_EVE_LIMA).buildValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private static UpdateRecordRequest request(LocalDate birthDate, Integer menarcheYear) {
        RecordContent e = RecordContent.empty();
        Anamnesis anamnesis = new Anamnesis(null, null, null, null, null, YesNo.YES, menarcheYear,
            null, null, null, null, null);
        RecordContent content = new RecordContent(null, anamnesis, e.facial(), e.functional(), e.occlusal(), e.models(),
            e.radiographic(), e.diagnosis(), e.signatures());
        return new UpdateRecordRequest(0L, "AEO-0015", null, "Ana", null, null, PatientSex.FEMALE, birthDate, null, null,
            null, null, content, null, null);
    }

    private static Set<String> messagesOnMenarcheYear(UpdateRecordRequest request) {
        return validator.validate(request).stream()
            .filter(v -> v.getPropertyPath().toString().equals("content.anamnesis.menarcheYear"))
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.toSet());
    }

    @Test
    void the_current_year_in_lima_is_valid_and_the_next_one_is_future() {
        assertThat(messagesOnMenarcheYear(request(LocalDate.of(2012, 5, 20), 2026))).isEmpty();
        assertThat(messagesOnMenarcheYear(request(LocalDate.of(2012, 5, 20), 2027)))
            .containsExactly("El año de la primera menstruación no puede ser futuro.");
    }

    @Test
    void before_the_birth_year_is_invalid_and_without_birth_date_only_the_future_is_checked() {
        assertThat(messagesOnMenarcheYear(request(LocalDate.of(2012, 5, 20), 2011)))
            .containsExactly("El año de la primera menstruación no puede ser anterior al de nacimiento.");
        assertThat(messagesOnMenarcheYear(request(LocalDate.of(2012, 5, 20), 2012))).isEmpty();
        assertThat(messagesOnMenarcheYear(request(null, 2001))).isEmpty();
    }

    @Test
    void the_year_has_four_digits() {
        assertThat(messagesOnMenarcheYear(request(null, 999))).containsExactly("Usa un año de cuatro cifras.");
        assertThat(messagesOnMenarcheYear(request(null, 20230))).containsExactly("Usa un año de cuatro cifras.");
    }
}
