package com.odontorisas.presentation.dto;

import com.fasterxml.jackson.annotation.JsonAnySetter;
import com.fasterxml.jackson.annotation.JsonIgnore;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.AssertTrue;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.HashSet;
import java.util.Set;

/**
 * Búsqueda de historias por texto. El texto viaja en el cuerpo y no en la URL, porque la URL
 * queda en los registros de acceso del proveedor o de un proxy. Rechaza campos desconocidos
 * (Spring Boot los ignora por defecto): se anotan al deserializar y la validación los marca.
 */
public class SearchRecordsRequest {

    @Schema(description = "Busca en paciente, documento y número (sin distinguir tildes ni mayúsculas); vacío lista sin filtrar",
        maxLength = 120)
    @NotNull(message = "Indica el texto a buscar.")
    @Size(max = 120, message = "La búsqueda admite hasta 120 caracteres.")
    private String q;

    @JsonIgnore
    private final Set<String> unknownFields = new HashSet<>();

    public String getQ() {
        return q;
    }

    public void setQ(String q) {
        this.q = q;
    }

    @JsonAnySetter
    void unknownField(String name, Object value) {
        unknownFields.add(name);
    }

    @JsonIgnore
    @Schema(hidden = true)
    @AssertTrue(message = "Solo se admite el campo q.")
    public boolean isOnlyKnownFields() {
        return unknownFields.isEmpty();
    }
}
