package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/**
 * Ficha para el análisis de Moyers (pág. 6 del PDF). El espacio requerido (tabla de Moyers al
 * 75 %), las diferencias y la predisposición de apiñamiento se calculan al mostrar (no se guardan).
 * La fecha la escribe el tratante y puede ser anterior al inicio del tratamiento.
 */
public record MoyersAnalysis(
    @PastOrPresent LocalDate analysisDate,
    @Valid LowerIncisors lowerIncisors,
    @Valid AvailableSpace availableSpace,
    @Size(max = LONG_TEXT) String interpretation) {

    public static MoyersAnalysis empty() {
        return new MoyersAnalysis(null, LowerIncisors.empty(), AvailableSpace.empty(), null);
    }
}
