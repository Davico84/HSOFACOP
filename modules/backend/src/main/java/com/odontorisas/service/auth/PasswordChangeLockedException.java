package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Cambio de contraseña con la cuenta bloqueada por intentos fallidos (400, sin comparar). */
public class PasswordChangeLockedException extends BusinessException {
    public PasswordChangeLockedException() {
        super("Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo.", HttpStatus.BAD_REQUEST, "password-change-locked");
    }
}
