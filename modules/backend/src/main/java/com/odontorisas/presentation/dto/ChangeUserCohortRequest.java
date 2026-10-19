package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/** Turma de alumno de una cuenta USER; nula = sin turma. */
public record ChangeUserCohortRequest(
    @Schema(description = "Turma del alumno; nulo = sin turma", types = {"integer", "null"}, format = "int64")
    Long cohortId) {
}
