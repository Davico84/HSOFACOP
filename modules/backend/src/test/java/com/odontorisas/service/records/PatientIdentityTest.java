package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import org.junit.jupiter.api.Test;

import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

/** Forma canónica de los datos fijos: corregir la escritura no cambia la identidad; otro paciente, sí. */
class PatientIdentityTest {

    private static final LocalDate BIRTH = LocalDate.of(2012, 5, 20);

    private static PatientIdentity id(String name, String document, String place) {
        return PatientIdentity.of(name, DocumentType.DNI, document, BIRTH, PatientSex.FEMALE, place);
    }

    @Test
    void case_accents_spaces_and_unicode_forms_are_the_same_identity() {
        PatientIdentity base = id("Ana Quispe", "74125896", "Lima");
        assertThat(id("ANA  QUÍSPE", "74125896", "lima")).isEqualTo(base);
        assertThat(id("  ana quispe ", "74125896", " LIMA ")).isEqualTo(base);
        // "Ａｎａ" (ancho completo) y "e" + acento combinado son la misma escritura en NFKC.
        assertThat(id("Ａｎａ Quispe", "74125896", "Lima")).isEqualTo(base);
        assertThat(id("Ana Quispe", "74125896", "Líma")).isEqualTo(id("Ana Quispe", "74125896", "Líma"));
    }

    @Test
    void document_compares_by_type_and_digits() {
        assertThat(id("Ana Quispe", "74 125 896", "Lima")).isEqualTo(id("Ana Quispe", "74125896", "Lima"));
        assertThat(PatientIdentity.of("Ana Quispe", DocumentType.PASSPORT, "74125896", BIRTH, PatientSex.FEMALE, "Lima"))
            .isNotEqualTo(id("Ana Quispe", "74125896", "Lima"));
    }

    @Test
    void another_patient_is_another_identity() {
        PatientIdentity base = id("Ana Quispe", "74125896", "Lima");
        assertThat(id("Rosa Díaz", "74125896", "Lima")).isNotEqualTo(base);
        assertThat(id("Ana Quispe", "74125897", "Lima")).isNotEqualTo(base);
        assertThat(id("Ana Quispe", "74125896", "Cusco")).isNotEqualTo(base);
        assertThat(PatientIdentity.of("Ana Quispe", DocumentType.DNI, "74125896", BIRTH.plusDays(1), PatientSex.FEMALE, "Lima"))
            .isNotEqualTo(base);
        assertThat(PatientIdentity.of("Ana Quispe", DocumentType.DNI, "74125896", BIRTH, PatientSex.MALE, "Lima"))
            .isNotEqualTo(base);
    }
}
