package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La contraseña nueva es igual a la actual (400). */
public class SamePasswordException extends BusinessException {
    public SamePasswordException() {
        super("La nueva contraseña debe ser distinta de la actual.", HttpStatus.BAD_REQUEST, "same-password");
    }
}
