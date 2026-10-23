package com.odontorisas.presentation.dto;

import com.odontorisas.service.users.PasswordResetLink;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Enlace de restablecimiento recién generado: el token en claro solo viaja en esta respuesta (el
 * cliente arma la URL con él en el fragmento) y no se vuelve a poder consultar.
 */
public record PasswordResetLinkResponse(
    @Schema(requiredMode = REQUIRED, description = "Token de un solo uso (en claro, solo aquí)") String token,
    @Schema(requiredMode = REQUIRED, description = "Vence a las 24 horas") Instant expiresAt) {

    public static PasswordResetLinkResponse from(PasswordResetLink link) {
        return new PasswordResetLinkResponse(link.token(), link.expiresAt());
    }
}
