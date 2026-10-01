package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import org.springframework.data.domain.Page;

import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Página de resultados de la API. Nunca se serializa el {@code Page} de Spring Data (su JSON es
 * inestable y no debe filtrarse a un contrato del que el frontend genera cliente; docs/backend.md
 * §5.1). Una página posterior a la última devuelve {@code content} vacío, sin error.
 */
public record PageResponse<T>(
    @Schema(requiredMode = REQUIRED) List<T> content,
    @Schema(requiredMode = REQUIRED, description = "Página actual (base 0)") int page,
    @Schema(requiredMode = REQUIRED, description = "Tamaño aplicado (máximo 100)") int size,
    @Schema(requiredMode = REQUIRED) long totalElements,
    @Schema(requiredMode = REQUIRED) int totalPages,
    @Schema(requiredMode = REQUIRED, description = "¿Es la última página?") boolean last) {

    public static <T> PageResponse<T> from(Page<T> page) {
        return new PageResponse<>(page.getContent(), page.getNumber(), page.getSize(),
            page.getTotalElements(), page.getTotalPages(), page.isLast());
    }
}
