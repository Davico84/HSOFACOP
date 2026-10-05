package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import org.hibernate.validator.constraints.UniqueElements;

import java.util.List;

/** Registro de una impresión: los pasos con datos de la historia guardada (para las historias sin calcular). */
public record PrintRecordRequest(
    @Schema(description = "Pasos (1–8) con datos de la historia guardada; se usan si aún no estaban calculados")
    @UniqueElements(message = "Los pasos no pueden repetirse.")
    List<@Min(value = 1, message = "El paso debe estar entre 1 y 8.") @Max(value = 8, message = "El paso debe estar entre 1 y 8.") Integer> filledSteps) {
}
