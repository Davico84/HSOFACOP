package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La contraseña actual del cambio no es la de la cuenta (400; cuenta como intento fallido). */
public class WrongCurrentPasswordException extends BusinessException {
    public WrongCurrentPasswordException() {
        super("La contraseña actual no es correcta.", HttpStatus.BAD_REQUEST, "wrong-current-password");
    }
}
