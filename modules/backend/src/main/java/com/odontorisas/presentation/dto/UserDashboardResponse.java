package com.odontorisas.presentation.dto;

import com.odontorisas.service.dashboard.DashboardService;
import com.odontorisas.service.dashboard.UserDashboardView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Métricas de Inicio del tratante autenticado (solo sus historias). */
public record UserDashboardResponse(
    @Schema(requiredMode = REQUIRED) Records records,
    @Schema(requiredMode = REQUIRED) RecordQuotaResponse quota,
    @Schema(requiredMode = REQUIRED) Completeness completeness,
    @Schema(requiredMode = REQUIRED) Missing missing,
    @Schema(requiredMode = REQUIRED, description = "Hasta 5 historias no completas, más recientes primero") List<ResumeItem> resume) {

    @Schema(name = "UserDashboardRecords")
    public record Records(
        @Schema(requiredMode = REQUIRED) long total,
        @Schema(requiredMode = REQUIRED, description = "Creadas en el mes en curso") long createdThisMonth) {
    }

    /** Completas = pasos clínicos 1–7 con datos (Firmas no cuenta). */
    @Schema(name = "UserDashboardCompleteness")
    public record Completeness(
        @Schema(requiredMode = REQUIRED) long complete,
        @Schema(requiredMode = REQUIRED) long inProgress,
        @Schema(requiredMode = REQUIRED, description = "Guardadas antes de registrar los pasos con datos") long notComputed,
        @Schema(description = "Promedio de pasos clínicos con datos (un decimal); vacío si no hay calculadas", nullable = true)
        Double averageFilledSteps) {

        static Completeness from(DashboardService.Completeness c) {
            return new Completeness(c.complete(), c.inProgress(), c.notComputed(), c.averageFilledSteps());
        }
    }

    @Schema(name = "UserDashboardMissing")
    public record Missing(
        @Schema(requiredMode = REQUIRED) long withoutDocument,
        @Schema(requiredMode = REQUIRED) long withoutBirthDate,
        @Schema(requiredMode = REQUIRED) long withoutTreatmentStart,
        @Schema(requiredMode = REQUIRED, description = "Los 7 pasos clínicos, de más a menos historias vacías")
        List<EmptyStep> emptySteps) {
    }

    @Schema(name = "DashboardEmptyStep")
    public record EmptyStep(
        @Schema(requiredMode = REQUIRED) int step,
        @Schema(requiredMode = REQUIRED) long count) {
    }

    @Schema(name = "DashboardResumeItem")
    public record ResumeItem(
        @Schema(requiredMode = REQUIRED) long id,
        @Schema(requiredMode = REQUIRED, example = "AEO-003") String recordNumber,
        @Schema(requiredMode = REQUIRED) String patientName,
        @Schema(description = "Último paso trabajado; vacío = paso 1", nullable = true) Integer lastStep,
        @Schema(description = "Pasos clínicos con datos; vacío = sin calcular", nullable = true) Integer filledSteps,
        @Schema(requiredMode = REQUIRED) Instant updatedAt) {
    }

    public static UserDashboardResponse from(UserDashboardView v) {
        return new UserDashboardResponse(
            new Records(v.total(), v.createdThisMonth()),
            RecordQuotaResponse.from(v.quota()),
            Completeness.from(v.completeness()),
            new Missing(v.missing().withoutDocument(), v.missing().withoutBirthDate(),
                v.missing().withoutTreatmentStart(),
                v.missing().emptySteps().stream().map(e -> new EmptyStep(e.step(), e.count())).toList()),
            v.resume().stream().map(r -> new ResumeItem(r.id(), r.recordNumber(), r.patientName(), r.lastStep(),
                r.filledSteps(), r.updatedAt())).toList());
    }
}
