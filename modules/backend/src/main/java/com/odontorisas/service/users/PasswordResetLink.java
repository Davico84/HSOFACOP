package com.odontorisas.service.users;

import java.time.Instant;

/** Enlace de restablecimiento recién generado: token en claro (solo para entregarlo) y vencimiento. */
public record PasswordResetLink(String token, Instant expiresAt) {
}
