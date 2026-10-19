package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Abrir ({@code true}) o cerrar ({@code false}) la inscripción de una turma. */
public record CohortRegistrationRequest(
    @Schema(requiredMode = REQUIRED) @NotNull(message = "Indica si la inscripción queda abierta") Boolean open) {
}
