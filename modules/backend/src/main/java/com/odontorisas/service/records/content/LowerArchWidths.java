package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.MAX_TOOTH_MM;
import static com.odontorisas.service.records.content.ContentLimits.MIN_TOOTH_MM;

/** Ancho mesiodistal de las piezas inferiores 45 a 35 (de mesial a mesial del 1er molar), en mm. El total (ST) es presentación (frontend). */
public record LowerArchWidths(
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth45,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth44,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth43,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth42,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth41,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth31,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth32,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth33,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth34,
    @DecimalMin(MIN_TOOTH_MM) @DecimalMax(MAX_TOOTH_MM) @Digits(integer = 2, fraction = 1) BigDecimal tooth35) {

    public static LowerArchWidths empty() {
        return new LowerArchWidths(null, null, null, null, null, null, null, null, null, null);
    }
}
