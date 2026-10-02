package com.odontorisas.service.records.content;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Paso 5 (págs. 5–9 del PDF): análisis de modelos. Se digitaliza un análisis por change: por
 * ahora el transversal; Moyers, Nance y Bolton se añadirán como campos opcionales.
 */
public record ModelAnalysis(@Schema(requiredMode = REQUIRED) @Valid TransversalAnalysis transversal) {

    public static ModelAnalysis empty() {
        return new ModelAnalysis(TransversalAnalysis.empty());
    }
}
