package com.odontorisas.service.records;

import org.springframework.stereotype.Component;

import java.time.Clock;
import java.time.LocalDate;
import java.time.Period;

/**
 * Edad del paciente en años cumplidos (design D8): a la fecha de inicio de tratamiento o, si no
 * la hay, a hoy. Sin fecha de nacimiento no hay edad. Única fuente de la regla en el backend.
 */
@Component
public class RecordAgeCalculator {

    /** Mayoría de edad: por debajo firma el apoderado. */
    public static final int ADULT_AGE = 18;

    private final Clock clock;

    public RecordAgeCalculator(Clock clock) {
        this.clock = clock;
    }

    public Integer ageYears(LocalDate birthDate, LocalDate treatmentStartDate) {
        if (birthDate == null) {
            return null;
        }
        LocalDate reference = treatmentStartDate != null ? treatmentStartDate : LocalDate.now(clock);
        if (reference.isBefore(birthDate)) {
            return null;
        }
        return Period.between(birthDate, reference).getYears();
    }

    public LocalDate today() {
        return LocalDate.now(clock);
    }

    /** ¿Firma un apoderado? Solo si se conoce la edad y es menor de 18. */
    public static boolean isMinor(Integer ageYears) {
        return ageYears != null && ageYears < ADULT_AGE;
    }
}
