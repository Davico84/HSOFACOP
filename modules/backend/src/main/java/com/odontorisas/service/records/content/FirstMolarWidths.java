package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_TOOTH_MM;
import static com.odontorisas.service.records.content.ContentLimits.MIN_TOOTH_MM;

/** Ancho mesiodistal de los primeros molares (16, 26, 46, 36), en mm: lo que Bolton agrega a Nance. */
public record FirstMolarWidths(
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth16,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth26,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth46,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth36) {

    public static FirstMolarWidths empty() {
        return new FirstMolarWidths(null, null, null, null);
    }
}
