package com.odontorisas.service.records.content;

import jakarta.validation.constraints.Size;

import static com.odontorisas.service.records.content.ContentLimits.SHORT_TEXT;

/**
 * Paso 7 (pág. 13): nombres de quienes firman a mano. La fecha se llena sobre el papel. Firma
 * el apoderado si el paciente es menor de 18 años; si no, el paciente.
 */
public record Signatures(
    @Size(max = SHORT_TEXT) String patientSignatureName,
    @Size(max = SHORT_TEXT) String guardianName,
    @Size(max = SHORT_TEXT) String guardianRelationship,
    @Size(max = SHORT_TEXT) String supervisor1Name,
    @Size(max = SHORT_TEXT) String supervisor2Name,
    @Size(max = SHORT_TEXT) String treatingSignatureName) {

    public static Signatures empty() {
        return new Signatures(null, null, null, null, null, null);
    }
}
