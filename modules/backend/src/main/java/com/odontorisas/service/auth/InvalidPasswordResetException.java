package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Enlace de restablecimiento inexistente, usado, vencido, anulado o de una cuenta deshabilitada (400, mismo mensaje). */
public class InvalidPasswordResetException extends BusinessException {
    public InvalidPasswordResetException() {
        super("El enlace no es válido o venció. Pide uno nuevo al administrador.", HttpStatus.BAD_REQUEST, "invalid-password-reset");
    }
}
