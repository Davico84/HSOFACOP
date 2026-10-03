package com.odontorisas.service.records.content;

import jakarta.validation.constraints.Size;

import java.util.List;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/**
 * Paso 2 (pág. 2): análisis facial con las opciones de la Guía de análisis facial. Tercios y
 * simetrías: presenta / no presenta y un texto libre para el detalle (schemaVersion 2).
 */
public record FacialAnalysis(
    FacialType facialType,
    Convexity convexity,
    Presence facialThirds,
    @Size(max = LONG_TEXT) String facialThirdsNotes,
    Presence lipSeal,
    LipRelation lipAnteroposteriorRelation,
    Presence restSymmetry,
    @Size(max = LONG_TEXT) String restSymmetryNotes,
    Presence openingSymmetry,
    @Size(max = LONG_TEXT) String openingSymmetryNotes,
    NasolabialAngle nasolabialAngle,
    MentolabialSulcus mentolabialSulcus,
    ZygomaticProjection zygomaticProjection,
    ChinNeckLine chinNeckLine,
    ChinNeckAngle chinNeckAngle,
    FacialPattern facialPattern,
    /** Solo con Patrón II. */
    List<PatternIIFeature> patternIIFeatures,
    AfaiChange patternIIAfai,
    /** Solo con Patrón III. */
    List<PatternIIIFeature> patternIIIFeatures,
    AfaiChange patternIIIAfai) {

    // Enums de cada pregunta: solo se añaden valores.
    public enum FacialType { MESOFACIAL, DOLICHOFACIAL, BRACHYFACIAL }
    public enum Convexity { STRAIGHT, CONVEX, CONCAVE }
    public enum LipRelation { UPPER_AHEAD, SAME_LINE, LOWER_AHEAD }
    public enum NasolabialAngle { NORMAL, OPEN, DECREASED }
    public enum MentolabialSulcus { NORMAL, DEEP, SHALLOW }
    public enum ZygomaticProjection { DECREASED, NORMAL, INCREASED }
    public enum ChinNeckLine { NORMAL, INCREASED, DECREASED }
    public enum ChinNeckAngle { NORMAL, OPEN, CLOSED }
    public enum FacialPattern { PATTERN_I, PATTERN_II, PATTERN_III, SHORT_FACE, LONG_FACE }
    public enum PatternIIFeature { MANDIBULAR_RETRUSION, MAXILLARY_PROTRUSION }
    public enum PatternIIIFeature { MANDIBULAR_PROTRUSION, MAXILLARY_RETRUSION }

    public static FacialAnalysis empty() {
        return new FacialAnalysis(null, null, null, null, null, null, null, null, null, null,
            null, null, null, null, null, null, List.of(), null, List.of(), null);
    }
}
