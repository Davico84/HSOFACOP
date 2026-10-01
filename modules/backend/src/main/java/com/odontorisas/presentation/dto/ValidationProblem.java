package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.NOT_REQUIRED;
import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Esquema OpenAPI del 400: los campos de {@link ApiProblem} (repetidos a propósito: sin
 * herencia, que springdoc traduce a {@code allOf}) más {@code errors}, que solo trae el
 * fallo de {@code @Valid} (el JSON malformado no). Solo documenta.
 */
@Schema(name = "ValidationProblem", description = "Error de validación (RFC 9457) con detalle por campo.")
public record ValidationProblem(
    @Schema(requiredMode = REQUIRED, example = "/errors/validation-error") String type,
    @Schema(requiredMode = REQUIRED, example = "Validation failed") String title,
    @Schema(requiredMode = REQUIRED, example = "400") Integer status,
    @Schema(requiredMode = REQUIRED, description = "Mensaje en español apto para el usuario final.") String detail,
    @Schema(requiredMode = REQUIRED, format = "date-time") Instant timestamp,
    @Schema(requiredMode = NOT_REQUIRED, example = "/auth/register") String instance,
    @Schema(requiredMode = NOT_REQUIRED, description = "Igual a la cabecera X-Trace-Id.") String traceId,
    @Schema(requiredMode = NOT_REQUIRED) List<FieldProblem> errors) {
}
