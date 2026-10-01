package com.odontorisas.common.text;

import java.text.Normalizer;
import java.util.Locale;
import java.util.regex.Pattern;

/**
 * Normaliza texto para buscar sin distinguir mayúsculas ni tildes: "Ana QUÍSPE" → "ana quispe".
 * Se aplica igual a la columna de búsqueda y al término buscado.
 */
public final class SearchNormalizer {

    private static final Pattern DIACRITICS = Pattern.compile("\\p{M}+");
    private static final Pattern SPACES = Pattern.compile("\\s+");

    private SearchNormalizer() {
    }

    /** Minúsculas, sin marcas diacríticas y con los espacios colapsados; {@code null} → "". */
    public static String normalize(String text) {
        if (text == null) {
            return "";
        }
        String decomposed = Normalizer.normalize(text, Normalizer.Form.NFD);
        String plain = DIACRITICS.matcher(decomposed).replaceAll("");
        return SPACES.matcher(plain.toLowerCase(Locale.ROOT)).replaceAll(" ").strip();
    }
}
