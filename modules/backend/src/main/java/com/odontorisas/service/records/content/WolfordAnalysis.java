package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;
import static com.odontorisas.service.records.content.ContentLimits.MAX_ARCH_SUM_MM;
import static com.odontorisas.service.records.content.ContentLimits.MAX_MODEL_MM;

/**
 * Análisis de Wolford (guía del módulo interceptivo): sumas de 12 piezas (16 → 26 / 46 → 36) y de
 * 6 (13 → 23 / 43 → 33). Cada suma nula = se usa la sugerida de Bolton y Nance (no se guarda); con
 * valor, la escrita por el tratante. Las discrepancias (× 1,1 y × 1,3) se calculan al mostrar.
 */
public record WolfordAnalysis(
    @DecimalMin("0") @DecimalMax(MAX_ARCH_SUM_MM) @Digits(integer = 3, fraction = 1) BigDecimal upper12Sum,
    @DecimalMin("0") @DecimalMax(MAX_ARCH_SUM_MM) @Digits(integer = 3, fraction = 1) BigDecimal lower12Sum,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal upper6Sum,
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal lower6Sum,
    @Size(max = LONG_TEXT) String interpretation) {

    public static WolfordAnalysis empty() {
        return new WolfordAnalysis(null, null, null, null, null);
    }
}
