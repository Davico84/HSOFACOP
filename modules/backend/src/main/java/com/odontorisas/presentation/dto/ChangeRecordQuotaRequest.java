package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

/**
 * Nuevo cupo de historias de una cuenta USER: entero 0–9999, o nulo para quitar el límite. Se recibe
 * como decimal para rechazar con 400 un valor con decimales (como entero, Jackson lo truncaría).
 */
public record ChangeRecordQuotaRequest(
    @Schema(description = "Cupo de historias (entero 0–9999); nulo = sin límite", nullable = true, type = "integer", format = "int32")
    @DecimalMin(value = "0", message = "El cupo no puede ser negativo")
    @DecimalMax(value = "9999", message = "El cupo no puede ser mayor que 9999")
    @Digits(integer = 4, fraction = 0, message = "El cupo debe ser un número entero")
    BigDecimal recordQuota) {

    /** Cupo como entero (ya validado), o {@code null} sin límite. */
    public Integer quota() {
        return recordQuota == null ? null : recordQuota.intValueExact();
    }
}
