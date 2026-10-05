package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.common.text.SearchNormalizer;

import java.text.Normalizer;
import java.time.LocalDate;

/**
 * Datos del paciente que quedan fijos al imprimir, en forma canónica para compararlos: el texto sin
 * distinguir formas Unicode equivalentes (NFKC), tildes, mayúsculas ni espacios sobrantes; el
 * documento por tipo y dígitos. Corregir la escritura no cambia la identidad; otro paciente, sí.
 */
public record PatientIdentity(String name, DocumentType documentType, String documentDigits, LocalDate birthDate,
                              PatientSex sex, String birthPlace) {

    public static PatientIdentity of(String name, DocumentType documentType, String documentNumber,
                                     LocalDate birthDate, PatientSex sex, String birthPlace) {
        return new PatientIdentity(text(name), documentType, digits(documentNumber), birthDate, sex, text(birthPlace));
    }

    private static String text(String value) {
        return value == null ? "" : SearchNormalizer.normalize(Normalizer.normalize(value, Normalizer.Form.NFKC));
    }

    private static String digits(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }
}
