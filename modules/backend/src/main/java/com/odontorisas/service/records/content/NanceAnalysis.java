package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.time.LocalDate;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;
import static com.odontorisas.service.records.content.ContentLimits.MAX_MODEL_MM;
import static com.odontorisas.service.records.content.ContentLimits.SHORT_TEXT;

/**
 * Análisis de Nance & Carey, discrepancia óseo dentaria (pág. 7 del PDF). El espacio requerido (ST,
 * suma de los anchos de cada arcada) y la discrepancia SA − ST se calculan al mostrar (no se
 * guardan). Las conclusiones las escribe el odontólogo. La fecha puede ser anterior al tratamiento.
 */
public record NanceAnalysis(
    @PastOrPresent LocalDate analysisDate,
    /** SA: espacio disponible o longitud de arco, superior. */
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal availableUpper,
    /** SA inferior. */
    @DecimalMin("0") @DecimalMax(MAX_MODEL_MM) @Digits(integer = 2, fraction = 1) BigDecimal availableLower,
    @Valid UpperArchWidths upperWidths,
    @Valid LowerArchWidths lowerWidths,
    @Size(max = SHORT_TEXT) String conclusionUpper,
    @Size(max = SHORT_TEXT) String conclusionLower,
    @Size(max = LONG_TEXT) String interpretation) {

    public static NanceAnalysis empty() {
        return new NanceAnalysis(null, null, null, UpperArchWidths.empty(), LowerArchWidths.empty(), null, null, null);
    }
}
