package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;
import static com.odontorisas.service.records.content.ContentLimits.SHORT_TEXT;

/**
 * Ficha para el análisis de Moyers (pág. 6 del PDF). El espacio requerido (tabla de Moyers al
 * 75 %) y las diferencias se calculan al mostrar (no se guardan). La predisposición de apiñamiento
 * (Tabla 2) la escribe el odontólogo, fila por fila. La fecha puede ser anterior al tratamiento.
 */
public record MoyersAnalysis(
    @PastOrPresent LocalDate analysisDate,
    @Valid LowerIncisors lowerIncisors,
    @Valid AvailableSpace availableSpace,
    @Size(max = SHORT_TEXT) String crowdingPositive,
    @Size(max = SHORT_TEXT) String crowdingNeutral,
    @Size(max = SHORT_TEXT) String crowdingNegative,
    @Size(max = LONG_TEXT) String interpretation) {

    public static MoyersAnalysis empty() {
        return new MoyersAnalysis(null, LowerIncisors.empty(), AvailableSpace.empty(), null, null, null, null);
    }
}
