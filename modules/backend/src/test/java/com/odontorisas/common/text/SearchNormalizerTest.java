package com.odontorisas.common.text;

import org.junit.jupiter.api.Test;

import static org.assertj.core.api.Assertions.assertThat;

/** Normalización de la búsqueda de historias (scenario "Búsqueda sin tildes ni mayúsculas"). */
class SearchNormalizerTest {

    @Test
    void lowercases_and_removes_accents() {
        assertThat(SearchNormalizer.normalize("Ana QUÍSPE Mamaní")).isEqualTo("ana quispe mamani");
    }

    @Test
    void keeps_enie_base_letter_and_digits() {
        assertThat(SearchNormalizer.normalize("Muñoz AEO-001 74125896")).isEqualTo("munoz aeo-001 74125896");
    }

    @Test
    void collapses_and_strips_spaces() {
        assertThat(SearchNormalizer.normalize("  Ana \t  Quispe  ")).isEqualTo("ana quispe");
    }

    @Test
    void null_is_empty() {
        assertThat(SearchNormalizer.normalize(null)).isEmpty();
    }
}
