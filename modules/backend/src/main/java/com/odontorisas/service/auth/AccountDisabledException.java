package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * Cuenta deshabilitada por un administrador (403). En el login solo se lanza tras acertar la
 * contraseña (no revela qué correos existen); en el refresh, antes de comprobar el token.
 */
public class AccountDisabledException extends BusinessException {
    public AccountDisabledException() {
        super("Tu cuenta está deshabilitada. Contacta con el administrador.", HttpStatus.FORBIDDEN, "account-disabled");
    }
}
