package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La turma de alumno solo aplica a cuentas USER (409). */
public class CohortNotApplicableException extends BusinessException {
    public CohortNotApplicableException() {
        super("La turma de alumno solo se asigna a cuentas con rol USER.", HttpStatus.CONFLICT, "cohort-not-applicable");
    }
}
