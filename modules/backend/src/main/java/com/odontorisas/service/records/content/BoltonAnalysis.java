package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/**
 * Análisis de Bolton (pág. 9 del PDF). Los anchos de 15 a 25 y de 45 a 35 son los de Nance (no se
 * duplican); aquí solo van los primeros molares. Sumas, relación total y anterior, ideal y
 * diferencia se calculan al mostrar (no se guardan). La fecha puede ser anterior al tratamiento.
 */
public record BoltonAnalysis(
    @PastOrPresent LocalDate analysisDate,
    @Valid FirstMolarWidths firstMolars,
    @Size(max = LONG_TEXT) String interpretation) {

    public static BoltonAnalysis empty() {
        return new BoltonAnalysis(null, FirstMolarWidths.empty(), null);
    }
}
