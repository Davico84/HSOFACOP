package com.odontorisas.presentation.dto;

import com.odontorisas.service.cohorts.CohortView;
import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Turma; los conteos solo los recibe el ADMIN (nulos para la coordinación). */
public record CohortResponse(
    @Schema(requiredMode = REQUIRED) Long id,
    @Schema(requiredMode = REQUIRED, example = "Turma 1") String name,
    @Schema(description = "Alumnos de la turma (solo ADMIN)", nullable = true) Long students,
    @Schema(description = "Coordinaciones de la turma (solo ADMIN)", nullable = true) Long coordinators) {

    public static CohortResponse from(CohortView view) {
        return new CohortResponse(view.id(), view.name(), view.students(), view.coordinators());
    }
}
