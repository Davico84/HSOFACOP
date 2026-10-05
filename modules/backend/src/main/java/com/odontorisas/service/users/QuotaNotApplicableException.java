package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** El cupo de historias solo aplica a cuentas USER (409). */
public class QuotaNotApplicableException extends BusinessException {
    public QuotaNotApplicableException() {
        super("El cupo de historias solo se asigna a cuentas con rol USER.", HttpStatus.CONFLICT, "quota-not-applicable");
    }
}
