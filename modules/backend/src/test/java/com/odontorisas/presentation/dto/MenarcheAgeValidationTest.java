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
 * Scenario "Fecha de la primera menstruación inválida" (edad): entero de 8 a 18 y, con fecha de
 * nacimiento, no mayor que la edad actual según el reloj de la app (zona de la clínica). A las
 * 23:30 del 19/05/2026 en Lima ya es el 20/05 en UTC: quien nació el 20/05/2013 todavía tiene 12.
 */
class MenarcheAgeValidationTest {

    private static final ZoneId LIMA = ZoneId.of("America/Lima");
    private static final Clock EVE_OF_BIRTHDAY_LIMA =
        Clock.fixed(ZonedDateTime.of(2026, 5, 19, 23, 30, 0, 0, LIMA).toInstant(), LIMA);

    private static ValidatorFactory factory;
    private static Validator validator;

    @BeforeAll
    static void setUp() {
        factory = Validation.byDefaultProvider().configure().clockProvider(() -> EVE_OF_BIRTHDAY_LIMA).buildValidatorFactory();
        validator = factory.getValidator();
    }

    @AfterAll
    static void tearDown() {
        factory.close();
    }

    private static UpdateRecordRequest request(LocalDate birthDate, Integer menarcheAge) {
        RecordContent e = RecordContent.empty();
        Anamnesis anamnesis = new Anamnesis(null, null, null, null, null, YesNo.YES, menarcheAge,
            null, null, null, null, null);
        RecordContent content = new RecordContent(null, anamnesis, e.facial(), e.functional(), e.occlusal(), e.models(),
            e.radiographic(), e.diagnosis(), e.signatures());
        return new UpdateRecordRequest(0L, "AEO-0015", null, "Ana", null, null, PatientSex.FEMALE, birthDate, null, null,
            null, null, content, null, null);
    }

    private static Set<String> messagesOnMenarcheAge(UpdateRecordRequest request) {
        return validator.validate(request).stream()
            .filter(v -> v.getPropertyPath().toString().equals("content.anamnesis.menarcheAge"))
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.toSet());
    }

    @Test
    void the_age_is_between_8_and_18() {
        assertThat(messagesOnMenarcheAge(request(null, 8))).isEmpty();
        assertThat(messagesOnMenarcheAge(request(null, 18))).isEmpty();
        assertThat(messagesOnMenarcheAge(request(null, 7))).containsExactly("Usa una edad entre 8 y 18 años.");
        assertThat(messagesOnMenarcheAge(request(null, 19))).containsExactly("Usa una edad entre 8 y 18 años.");
    }

    private static Set<String> messagesOn(String field, UpdateRecordRequest request) {
        return validator.validate(request).stream()
            .filter(v -> v.getPropertyPath().toString().equals("content.anamnesis." + field))
            .map(ConstraintViolation::getMessage)
            .collect(Collectors.toSet());
    }

    @Test
    void under_the_minimum_age_the_answer_cannot_be_yes() {
        // El 19/05/2026 en Lima, quien nació el 20/05/2018 tiene 7 años; la del 19/05/2018, 8.
        assertThat(messagesOn("menarche", request(LocalDate.of(2018, 5, 20), null)))
            .containsExactly("Antes de los 8 años la primera menstruación no aplica.");
        assertThat(messagesOn("menarche", request(LocalDate.of(2018, 5, 19), null))).isEmpty();
        assertThat(messagesOn("menarche", request(null, null))).isEmpty();
    }

    @Test
    void the_rules_only_apply_to_female_patients_with_yes() {
        RecordContent e = RecordContent.empty();
        Anamnesis anamnesis = new Anamnesis(null, null, null, null, null, YesNo.YES, 30, null, null, null, null, null);
        RecordContent content = new RecordContent(null, anamnesis, e.facial(), e.functional(), e.occlusal(), e.models(),
            e.radiographic(), e.diagnosis(), e.signatures());
        UpdateRecordRequest male = new UpdateRecordRequest(0L, "AEO-0015", null, "Juan", null, null, PatientSex.MALE,
            LocalDate.of(2020, 1, 1), null, null, null, null, content, null, null);
        assertThat(validator.validate(male)).isEmpty();
    }

    @Test
    void it_cannot_be_above_the_current_age_in_lima() {
        LocalDate birth = LocalDate.of(2013, 5, 20); // en Lima todavía tiene 12
        assertThat(messagesOnMenarcheAge(request(birth, 12))).isEmpty();
        assertThat(messagesOnMenarcheAge(request(birth, 13)))
            .containsExactly("La edad de la primera menstruación no puede superar la edad actual de la paciente.");
    }
}
