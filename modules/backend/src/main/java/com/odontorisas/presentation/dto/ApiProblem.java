package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.NOT_REQUIRED;
import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Esquema OpenAPI del cuerpo de error (RFC 9457) que responde toda la API. Solo documenta:
 * en runtime el cuerpo lo construye {@code GlobalExceptionHandler} con {@code ProblemDetail}.
 * Los opcionales se omiten (nunca {@code null}). {@code OpenApiContractIT} vigila que no
 * diverja del cuerpo real.
 */
@Schema(name = "ApiProblem", description = "Error de la API (RFC 9457, application/problem+json).")
public record ApiProblem(
    @Schema(requiredMode = REQUIRED, example = "/errors/email-already-exists") String type,
    @Schema(requiredMode = REQUIRED, example = "Conflict") String title,
    @Schema(requiredMode = REQUIRED, example = "409") Integer status,
    @Schema(requiredMode = REQUIRED, description = "Mensaje en español apto para el usuario final.") String detail,
    @Schema(requiredMode = REQUIRED, format = "date-time") Instant timestamp,
    @Schema(requiredMode = NOT_REQUIRED, example = "/auth/register") String instance,
    @Schema(requiredMode = NOT_REQUIRED, description = "Igual a la cabecera X-Trace-Id.") String traceId) {
}
