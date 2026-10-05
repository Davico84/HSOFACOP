package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Solicitud de desbloqueo de los datos del paciente. */
public record UnlockRequestRequest(
    @Schema(requiredMode = REQUIRED, example = "Error en el número de DNI")
    @NotBlank(message = "Indica el motivo.") @Size(max = 200, message = "El motivo admite hasta 200 caracteres.")
    String reason) {
}
