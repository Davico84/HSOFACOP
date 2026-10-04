package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_TOOTH_MM;
import static com.odontorisas.service.records.content.ContentLimits.MIN_TOOTH_MM;

/** Ancho mesiodistal de las piezas superiores 15 a 25 (de mesial a mesial del 1er molar), en mm. El total (ST) es presentación (frontend). */
public record UpperArchWidths(
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth15,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth14,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth13,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth12,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth11,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth21,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth22,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth23,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth24,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth25) {

    public static UpperArchWidths empty() {
        return new UpperArchWidths(null, null, null, null, null, null, null, null, null, null);
    }
}
