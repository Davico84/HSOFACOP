package com.odontorisas.service.auth;

import java.time.Instant;

/**
 * Resultado de una operación de autenticación: el access token (para el cuerpo
 * de la respuesta), el refresh token en claro (que la presentación pondrá en
 * una cookie HttpOnly) con su expiración, y la vista del usuario autenticado.
 */
public record AuthResult(String accessToken, String refreshToken, Instant refreshExpiresAt, UserView user) {}
