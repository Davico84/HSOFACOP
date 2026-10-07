package com.odontorisas.service.records.content;

import jakarta.validation.constraints.Size;

import java.util.List;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/** Paso 5 (pág. 10): análisis radiográfico. El PDF pide al menos 3 análisis cefalométricos (no se exige: borrador). */
public record RadiographicAnalysis(
    @Size(max = LONG_TEXT) String panoramicDiagnosis,
    List<CephalometricAnalysis> cephalometricAnalyses,
    @Size(max = LONG_TEXT) String apicalBases,
    @Size(max = LONG_TEXT) String growthTendency,
    @Size(max = LONG_TEXT) String dentoalveolar,
    @Size(max = LONG_TEXT) String others) {

    /** Solo se añaden valores. */
    public enum CephalometricAnalysis { STEINER, RICKETTS, MCNAMARA, WITS, TWEED, JARABAK }

    public static RadiographicAnalysis empty() {
        return new RadiographicAnalysis(null, List.of(), null, null, null, null);
    }
}
