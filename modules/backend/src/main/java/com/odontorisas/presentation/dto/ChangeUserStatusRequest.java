package com.odontorisas.presentation.dto;

import com.odontorisas.common.UserStatus;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Nuevo estado de una cuenta USER. Nulo → 400 (ValidationProblem); valor desconocido → 400 (ApiProblem). */
public record ChangeUserStatusRequest(
    @Schema(requiredMode = REQUIRED) @NotNull(message = "El estado es obligatorio") UserStatus status) {
}
