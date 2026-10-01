package com.odontorisas.service.records.content;

import java.util.List;

/** Paso 3 (pág. 3, parte alta): análisis funcional. */
public record FunctionalAnalysis(
    Breathing breathing,
    Swallowing swallowing,
    LipClosure lipClosure,
    TongueActivity tongueActivity,
    /** Solo con interposición lateral. */
    List<Side> tongueLateralSides,
    MuscleActivity upperLip,
    MuscleActivity lowerLip,
    MuscleActivity masseter,
    MuscleActivity mentalis,
    /** {@code NONE} excluye al resto; si la anamnesis dice "No", queda solo {@code NONE}. */
    List<SuckingHabit> suckingHabitTypes,
    LingualFrenulum lingualFrenulum,
    YesNo snoring,
    Bruxism bruxism,
    /** Solo con desgastes: piezas FDI. */
    List<@FdiTooth Integer> bruxismTeeth) {

    // Enums de cada pregunta: solo se añaden valores.
    public enum Breathing { ORAL, NASAL, MIXED }
    public enum Swallowing { NORMAL, ATYPICAL }
    public enum LipClosure { NORMAL, CONTRACTION }
    public enum TongueActivity { NORMAL, ANTERIOR_INTERPOSITION, LATERAL_INTERPOSITION }
    public enum SuckingHabit { NONE, FINGERS, TONGUE, LIPS, NAIL_BITING }
    public enum LingualFrenulum { NORMAL, SHORT }
    public enum Bruxism { NONE, WITHOUT_WEAR, WITH_WEAR }

    public static FunctionalAnalysis empty() {
        return new FunctionalAnalysis(null, null, null, null, List.of(), null, null, null, null,
            List.of(SuckingHabit.NONE), null, null, null, List.of());
    }
}
