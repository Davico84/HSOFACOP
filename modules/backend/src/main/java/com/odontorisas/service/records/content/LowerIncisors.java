package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_MODEL_MM;

/**
 * Ancho mesiodistal de los incisivos inferiores (FDI 42, 41, 31, 32), en mm. La suma y el espacio
 * requerido de Moyers son presentación (frontend).
 */
public record LowerIncisors(
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth42,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth41,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth31,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth32) {

    public static LowerIncisors empty() {
        return new LowerIncisors(null, null, null, null);
    }
}
