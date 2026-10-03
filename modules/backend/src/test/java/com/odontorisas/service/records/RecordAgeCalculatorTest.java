package com.odontorisas.service.records;

import org.junit.jupiter.api.Test;

import java.time.Clock;
import java.time.LocalDate;
import java.time.ZoneId;
import java.time.ZoneOffset;

import static org.assertj.core.api.Assertions.assertThat;

/** Scenarios de "Datos del paciente con edad calculada". */
class RecordAgeCalculatorTest {

    private static final ZoneId LIMA = ZoneOffset.ofHours(-5);
    private final RecordAgeCalculator calculator =
        new RecordAgeCalculator(Clock.fixed(LocalDate.of(2026, 10, 1).atStartOfDay(LIMA).toInstant(), LIMA));

    @Test
    void age_at_treatment_start_counts_completed_years() {
        assertThat(calculator.ageYears(LocalDate.of(2012, 5, 20), LocalDate.of(2026, 5, 19))).isEqualTo(13);
        assertThat(calculator.ageYears(LocalDate.of(2012, 5, 20), LocalDate.of(2026, 5, 20))).isEqualTo(14);
    }

    @Test
    void without_treatment_start_uses_today() {
        assertThat(calculator.ageYears(LocalDate.of(2012, 5, 20), null)).isEqualTo(14);
    }

    @Test
    void without_birth_date_there_is_no_age() {
        assertThat(calculator.ageYears(null, LocalDate.of(2026, 5, 19))).isNull();
    }

    @Test
    void minor_only_when_age_is_known_and_under_18() {
        assertThat(RecordAgeCalculator.isMinor(17)).isTrue();
        assertThat(RecordAgeCalculator.isMinor(18)).isFalse();
        assertThat(RecordAgeCalculator.isMinor(null)).isFalse();
    }
}
