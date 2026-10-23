package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Cambio de contraseña: la actual y la nueva (mínimo 8 caracteres, como en el registro). */
public record ChangePasswordRequest(
    @Schema(requiredMode = REQUIRED) @NotBlank(message = "Escribe tu contraseña actual") String currentPassword,
    @Schema(requiredMode = REQUIRED) @NotBlank(message = "Escribe la nueva contraseña")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String newPassword) {
}
