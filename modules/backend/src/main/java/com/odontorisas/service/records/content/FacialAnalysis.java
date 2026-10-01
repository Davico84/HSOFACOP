package com.odontorisas.service.records.content;

import java.util.List;

/** Paso 2 (pág. 2): análisis facial con las opciones de la Guía de análisis facial. */
public record FacialAnalysis(
    FacialType facialType,
    Convexity convexity,
    FacialThirds facialThirds,
    /** Solo si no presenta proporción de tercios. */
    List<FacialThird> facialThirdsAffected,
    Presence lipSeal,
    LipRelation lipAnteroposteriorRelation,
    Presence restSymmetry,
    /** Solo si no presenta simetría en reposo. */
    List<Side> restAsymmetrySides,
    Presence openingSymmetry,
    /** Solo si no presenta simetría en apertura. */
    List<Side> openingAsymmetrySides,
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
    public enum FacialThirds { PRESENT, ABSENT_INCREASED, ABSENT_DECREASED }
    public enum FacialThird { UPPER, MIDDLE, LOWER }
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
        return new FacialAnalysis(null, null, null, List.of(), null, null, null, List.of(), null, List.of(),
            null, null, null, null, null, null, List.of(), null, List.of(), null);
    }
}
