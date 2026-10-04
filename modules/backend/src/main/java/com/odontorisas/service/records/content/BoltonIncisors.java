package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_TOOTH_MM;
import static com.odontorisas.service.records.content.ContentLimits.MIN_TOOTH_MM;

/**
 * Ancho mesiodistal de los incisivos para Bolton (12, 11, 21, 22, 42, 41, 31, 32), en mm. Son
 * propios de Bolton: Nance mide los suyos aparte (revisión clínica del usuario).
 */
public record BoltonIncisors(
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth12,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth11,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth21,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth22,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth42,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth41,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth31,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth32) {

    public static BoltonIncisors empty() {
        return new BoltonIncisors(null, null, null, null, null, null, null, null);
    }
}
