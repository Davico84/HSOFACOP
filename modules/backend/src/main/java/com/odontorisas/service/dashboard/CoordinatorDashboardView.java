package com.odontorisas.service.dashboard;

import java.util.List;

/** Avance de las turmas de una coordinación (solo los alumnos de esas turmas). */
public record CoordinatorDashboardView(List<CohortProgress> cohorts) {

    /** Resumen de una turma; completas = pasos clínicos 1–7 con datos, como para el tratante. */
    public record CohortProgress(long id, String name, long students, long records, long complete, long inProgress,
                                 long notComputed, long studentsWithoutRecords, List<StudentProgress> studentList) {
    }

    public record StudentProgress(long id, String fullName, long records, long complete) {
    }
}
