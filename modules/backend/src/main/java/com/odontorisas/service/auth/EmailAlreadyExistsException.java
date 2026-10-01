package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** El correo ya está registrado (409 Conflict). */
public class EmailAlreadyExistsException extends BusinessException {
    public EmailAlreadyExistsException(String email) {
        super("El correo ya está registrado: " + email, HttpStatus.CONFLICT, "email-already-exists");
    }
}
