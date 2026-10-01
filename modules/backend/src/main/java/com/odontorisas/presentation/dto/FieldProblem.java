package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Un campo inválido dentro de {@link ValidationProblem}. Solo documenta. */
@Schema(name = "FieldProblem")
public record FieldProblem(
    @Schema(requiredMode = REQUIRED, example = "password") String field,
    @Schema(requiredMode = REQUIRED, example = "La contraseña debe tener al menos 8 caracteres") String message) {
}
