package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** El enlace de restablecimiento solo se genera para cuentas USER o COORDINATOR activas (409). */
public class PasswordResetNotApplicableException extends BusinessException {
    public PasswordResetNotApplicableException() {
        super("Solo se restablece la contraseña de cuentas de alumno o coordinación activas.", HttpStatus.CONFLICT, "password-reset-not-applicable");
    }
}
