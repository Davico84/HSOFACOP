package com.odontorisas.common;

import java.util.regex.Pattern;

/**
 * Tipo de documento de identidad del paciente (capacidad orthodontic-records). Solo dígitos:
 * DNI 8, carné de extranjería 9, pasaporte 6–12. Solo se añaden valores (se guardan por nombre).
 */
public enum DocumentType {
    DNI("\\d{8}"),
    FOREIGNER_CARD("\\d{9}"),
    PASSPORT("\\d{6,12}");

    private final Pattern pattern;

    DocumentType(String regex) {
        this.pattern = Pattern.compile(regex);
    }

    /** ¿Es {@code number} un número válido para este tipo? */
    public boolean accepts(String number) {
        return number != null && pattern.matcher(number).matches();
    }
}
