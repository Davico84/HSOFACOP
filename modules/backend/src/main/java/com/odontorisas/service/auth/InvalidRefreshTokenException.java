package com.odontorisas.service.auth;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Refresh token inválido, expirado o revocado (401 → fuerza logout en el cliente). */
public class InvalidRefreshTokenException extends BusinessException {
    public InvalidRefreshTokenException() {
        super("Sesión expirada, vuelve a iniciar sesión", HttpStatus.UNAUTHORIZED, "invalid-refresh-token");
    }
}
