package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Credenciales inválidas (401; mensaje genérico para no filtrar la existencia de la cuenta). */
public class InvalidCredentialsException extends BusinessException {
    public InvalidCredentialsException() {
        super("Correo electrónico o contraseña incorrectos", HttpStatus.UNAUTHORIZED, "invalid-credentials");
    }
}
