package com.odontorisas.service.cohorts;

import java.security.SecureRandom;
import java.util.Locale;

/**
 * Códigos de inscripción de las turmas: 8 caracteres de un alfabeto sin los que se confunden
 * (0, O, 1, I), guardados sin guion y mostrados como {@code K7QM-4TXR}. Mismo alfabeto que el
 * {@code CHECK} de V19.
 */
public final class CohortCodes {

    static final String ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    static final int LENGTH = 8;

    private static final SecureRandom RANDOM = new SecureRandom();

    private CohortCodes() {
    }

    /** Código nuevo al azar (32⁸ ≈ 10¹² combinaciones). */
    static String generate() {
        StringBuilder code = new StringBuilder(LENGTH);
        for (int i = 0; i < LENGTH; i++) {
            code.append(ALPHABET.charAt(RANDOM.nextInt(ALPHABET.length())));
        }
        return code.toString();
    }

    /** Lo que escribió el visitante, en mayúsculas y sin espacios ni guiones; vacío = {@code null}. */
    public static String clean(String raw) {
        if (raw == null) {
            return null;
        }
        String cleaned = raw.replaceAll("[\\s-]+", "").toUpperCase(Locale.ROOT);
        return cleaned.isEmpty() ? null : cleaned;
    }
}
