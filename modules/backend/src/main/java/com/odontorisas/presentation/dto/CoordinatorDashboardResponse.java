package com.odontorisas.presentation.dto;

import com.odontorisas.service.dashboard.CoordinatorDashboardView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Avance de las turmas de la coordinación autenticada, por nombre de turma. */
public record CoordinatorDashboardResponse(
    @Schema(requiredMode = REQUIRED) List<CohortProgress> cohorts) {

    /** Completas = pasos clínicos 1–7 con datos (Firmas no cuenta), como en el Inicio del tratante. */
    @Schema(name = "CoordinatorCohortProgress")
    public record CohortProgress(
        @Schema(requiredMode = REQUIRED) long id,
        @Schema(requiredMode = REQUIRED, example = "Turma 1") String name,
        @Schema(requiredMode = REQUIRED, description = "Alumnos de la turma") long students,
        @Schema(requiredMode = REQUIRED, description = "Historias de sus alumnos") long records,
        @Schema(requiredMode = REQUIRED) long complete,
        @Schema(requiredMode = REQUIRED) long inProgress,
        @Schema(requiredMode = REQUIRED, description = "Guardadas antes de registrar los pasos con datos") long notComputed,
        @Schema(requiredMode = REQUIRED) long studentsWithoutRecords,
        @Schema(requiredMode = REQUIRED, description = "Alumnos por nombre") List<StudentProgress> studentList) {
    }

    @Schema(name = "CoordinatorStudentProgress")
    public record StudentProgress(
        @Schema(requiredMode = REQUIRED) long id,
        @Schema(requiredMode = REQUIRED) String fullName,
        @Schema(requiredMode = REQUIRED) long records,
        @Schema(requiredMode = REQUIRED) long complete) {
    }

    public static CoordinatorDashboardResponse from(CoordinatorDashboardView v) {
        return new CoordinatorDashboardResponse(v.cohorts().stream()
            .map(c -> new CohortProgress(c.id(), c.name(), c.students(), c.records(), c.complete(), c.inProgress(),
                c.notComputed(), c.studentsWithoutRecords(),
                c.studentList().stream().map(s -> new StudentProgress(s.id(), s.fullName(), s.records(), s.complete()))
                    .toList()))
            .toList());
    }
}
