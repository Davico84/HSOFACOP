package com.odontorisas.service.cohorts;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La turma no existe (404). */
public class CohortNotFoundException extends BusinessException {
    public CohortNotFoundException() {
        super("No se encontró la turma indicada.", HttpStatus.NOT_FOUND, "cohort-not-found");
    }
}
