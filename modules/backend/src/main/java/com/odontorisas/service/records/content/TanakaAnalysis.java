package com.odontorisas.service.records.content;

import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;
import static com.odontorisas.service.records.content.ContentLimits.MAX_MODEL_MM;

/**
 * Fórmula de Tanaka-Johnston (guía del módulo interceptivo). {@code incisorSum} nulo = se usa la
 * suma sugerida de los incisivos de Moyers (no se guarda); con valor, la escrita por el tratante.
 * El espacio previsto (suma ÷ 2 + 11 / + 10,5) se calcula al mostrar.
 */
public record TanakaAnalysis(
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal incisorSum,
    @Size(max = LONG_TEXT) String interpretation) {

    public static TanakaAnalysis empty() {
        return new TanakaAnalysis(null, null);
    }
}
