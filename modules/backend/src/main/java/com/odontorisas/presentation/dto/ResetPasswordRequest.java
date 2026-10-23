package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Restablecimiento con el token del enlace y la contraseña nueva (mínimo 8 caracteres). */
public record ResetPasswordRequest(
    @Schema(requiredMode = REQUIRED, description = "Token del enlace de restablecimiento")
    @NotBlank(message = "Falta el enlace de restablecimiento") @Size(max = 200) String token,
    @Schema(requiredMode = REQUIRED) @NotBlank(message = "Escribe la nueva contraseña")
    @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String newPassword) {
}
