package com.odontorisas.service.records.content;

import jakarta.validation.Valid;
import jakarta.validation.constraints.DecimalMax;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Digits;
import jakarta.validation.constraints.Size;

import java.math.BigDecimal;
import java.util.List;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;
import static com.odontorisas.service.records.content.ContentLimits.MAX_MM;
import static com.odontorisas.service.records.content.ContentLimits.SHORT_TEXT;

/** Paso 4 (págs. 3–4): análisis oclusal y extra. */
public record OcclusalAnalysis(
    Transverse transverse,
    /** Solo con mordida cruzada posterior unilateral. */
    Side crossbiteSide,
    CrossbiteType crossbiteType,
    Vertical vertical,
    /** Solo con mordida profunda: 0–100 %. */
    @DecimalMin("0") @DecimalMax("100") @Digits(integer = 3, fraction = 1) BigDecimal deepBitePercent,
    /** Solo con mordida abierta: 0–30 mm. */
    @DecimalMin("0") @DecimalMax(MAX_MM) @Digits(integer = 2, fraction = 1) BigDecimal openBiteMm,
    SpeeCurve speeCurve,
    /** Solo con curva alterada. */
    @Size(max = SHORT_TEXT) String speeCurveDetail,
    /** Anteroposterior normal: excluye overjet y mordida cruzada anterior. */
    Boolean anteroposteriorNormal,
    @DecimalMin("0") @DecimalMax(MAX_MM) @Digits(integer = 2, fraction = 1) BigDecimal overjetMm,
    List<@FdiTooth(anteriorOnly = true) Integer> anteriorCrossbiteTeeth,
    @Valid Midline midlineUpper,
    @Valid Midline midlineLower,
    @Valid SideRelations canineRelation,
    @Valid SideRelations molarRelation,
    /** Máxima intercuspidación (MI) ≠ relación céntrica. */
    Boolean miDiffersFromRc,
    @Valid SideRelations canineRelationMi,
    /** Mordida habitual (MIH) ≠ relación céntrica. */
    Boolean mihDiffersFromRc,
    @Valid SideRelations canineRelationMih,
    @Size(max = LONG_TEXT) String dentalAnomalies,
    @Size(max = LONG_TEXT) String tmjCondition,
    YesNo familyMalocclusion,
    /** Solo si hay un familiar con la misma maloclusión. */
    @Size(max = SHORT_TEXT) String familyMalocclusionWho) {

    // Enums de cada pregunta: solo se añaden valores.
    public enum Transverse { NORMAL, BILATERAL_POSTERIOR_CROSSBITE, UNILATERAL_POSTERIOR_CROSSBITE, BRODIE }
    public enum CrossbiteType { SKELETAL, DENTOALVEOLAR, NONE }
    public enum Vertical { NORMAL, EDGE_TO_EDGE, DEEP_BITE, OPEN_BITE }
    public enum SpeeCurve { NORMAL, ALTERED }

    public static OcclusalAnalysis empty() {
        return new OcclusalAnalysis(null, null, null, null, null, null, null, null, null, null, List.of(),
            null, null, null, null, null, null, null, null, null, null, null, null);
    }
}
