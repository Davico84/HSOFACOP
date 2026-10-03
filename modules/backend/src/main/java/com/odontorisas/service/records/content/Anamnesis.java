package com.odontorisas.service.records.content;

import jakarta.validation.constraints.Size;

import static com.odontorisas.service.records.content.ContentLimits.LONG_TEXT;

/** Paso 1 (pág. 1): anamnesis. Los datos personales del paciente van en columnas propias. */
public record Anamnesis(
    @Size(max = LONG_TEXT) String chiefComplaint,
    @Size(max = LONG_TEXT) String personalPreferences,
    Cooperation cooperation,
    YesNo oralHygiene,
    /** Sí/No; el detalle (dedos, lengua…) se marca en el análisis funcional. */
    YesNo suckingHabits,
    /** Solo si el paciente es de sexo femenino. */
    YesNo menarche,
    @Size(max = LONG_TEXT) String medicalHistory,
    @Size(max = LONG_TEXT) String accidentsHistory,
    @Size(max = LONG_TEXT) String familyStructure,
    @Size(max = LONG_TEXT) String generalTreatmentNeeds,
    @Size(max = LONG_TEXT) String heredity) {

    /** Índice de colaboración/cooperación. Solo se añaden valores. */
    public enum Cooperation { HIGH, MEDIUM, LOW }

    public static Anamnesis empty() {
        return new Anamnesis(null, null, null, null, null, null, null, null, null, null, null);
    }
}
