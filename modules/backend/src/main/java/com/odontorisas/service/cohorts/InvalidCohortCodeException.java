package com.odontorisas.service.cohorts;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** El código de turma del registro no es de ninguna turma (400). */
public class InvalidCohortCodeException extends BusinessException {
    public InvalidCohortCodeException() {
        super("El código de turma no es válido.", HttpStatus.BAD_REQUEST, "invalid-cohort-code");
    }
}
