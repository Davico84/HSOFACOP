package com.odontorisas.service.cohorts;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Ya existe una turma con ese nombre, sin distinguir mayúsculas ni espacios (409). */
public class CohortNameTakenException extends BusinessException {
    public CohortNameTakenException() {
        super("Ya existe una turma con ese nombre.", HttpStatus.CONFLICT, "cohort-name-taken");
    }
}
