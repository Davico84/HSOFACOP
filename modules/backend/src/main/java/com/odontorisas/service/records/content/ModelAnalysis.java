package com.odontorisas.service.records.content;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Paso 5 (págs. 5–9 del PDF): análisis de modelos. Se digitaliza un análisis por change: por
 * el transversal, Moyers, Nance y Bolton.
 */
public record ModelAnalysis(
    @Schema(requiredMode = REQUIRED) @Valid TransversalAnalysis transversal,
    @Schema(requiredMode = REQUIRED) @Valid MoyersAnalysis moyers,
    @Schema(requiredMode = REQUIRED) @Valid NanceAnalysis nance,
    @Schema(requiredMode = REQUIRED) @Valid BoltonAnalysis bolton) {

    public static ModelAnalysis empty() {
        return new ModelAnalysis(TransversalAnalysis.empty(), MoyersAnalysis.empty(), NanceAnalysis.empty(), BoltonAnalysis.empty());
    }
}
