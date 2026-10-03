package com.odontorisas.service.records.content;

import jakarta.validation.constraints.Size;

import java.util.List;

import static com.odontorisas.service.records.content.ContentLimits.LIST_ITEM;
import static com.odontorisas.service.records.content.ContentLimits.LIST_ITEMS;
import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/** Paso 6 (págs. 11–13): diagnóstico y planes. Problemas y metas son listas ordenadas. */
public record Diagnosis(
    @Size(max = LONG_TEXT) String generalDiagnosis,
    @Size(max = LIST_ITEMS) List<@Size(max = LIST_ITEM) String> problemList,
    @Size(max = LIST_ITEMS) List<@Size(max = LIST_ITEM) String> treatmentGoals,
    @Size(max = LONG_TEXT) String treatmentPlan1,
    @Size(max = LONG_TEXT) String treatmentPlan2,
    @Size(max = LONG_TEXT) String treatmentSequence,
    @Size(max = LONG_TEXT) String nextStages,
    @Size(max = LONG_TEXT) String finalTreatmentPlan) {

    public static Diagnosis empty() {
        return new Diagnosis(null, List.of(), List.of(), null, null, null, null, null);
    }
}
