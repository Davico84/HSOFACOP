package com.odontorisas.service.cohorts;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La turma del código está cerrada a la inscripción (400). */
public class CohortRegistrationClosedException extends BusinessException {
    public CohortRegistrationClosedException() {
        super("La turma ya no acepta inscripciones.", HttpStatus.BAD_REQUEST, "cohort-registration-closed");
    }
}
