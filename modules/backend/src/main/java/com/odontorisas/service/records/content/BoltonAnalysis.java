package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/**
 * Análisis de Bolton (pág. 9 del PDF). Los caninos y premolares son los de Nance (no se duplican);
 * aquí van los incisivos y los primeros molares, propios de Bolton. Sumas, relación total y
 * anterior, ideal y diferencia se calculan al mostrar (no se guardan). La fecha puede ser anterior
 * al tratamiento.
 */
public record BoltonAnalysis(
    @PastOrPresent LocalDate analysisDate,
    @Valid FirstMolarWidths firstMolars,
    @Valid BoltonIncisors incisors,
    @Size(max = LONG_TEXT) String interpretation) {

    public static BoltonAnalysis empty() {
        return new BoltonAnalysis(null, FirstMolarWidths.empty(), BoltonIncisors.empty(), null);
    }
}
