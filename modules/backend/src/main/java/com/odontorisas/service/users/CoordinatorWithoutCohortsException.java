package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Una cuenta de coordinación necesita al menos una turma (400). */
public class CoordinatorWithoutCohortsException extends BusinessException {
    public CoordinatorWithoutCohortsException() {
        super("La coordinación necesita al menos una turma.", HttpStatus.BAD_REQUEST, "coordinator-without-cohorts");
    }
}
