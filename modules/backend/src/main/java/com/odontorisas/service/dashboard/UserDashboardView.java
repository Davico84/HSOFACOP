package com.odontorisas.service.dashboard;

import com.odontorisas.service.records.RecordQuotaView;

import java.time.Instant;
import java.util.List;

/** Métricas de Inicio del tratante (solo sus historias). */
public record UserDashboardView(
    long total,
    long createdThisMonth,
    RecordQuotaView quota,
    DashboardService.Completeness completeness,
    Missing missing,
    List<ResumeItem> resume) {

    /** Datos faltantes; {@code emptySteps} son siempre los 7 pasos clínicos, de más a menos vacíos. */
    public record Missing(long withoutDocument, long withoutBirthDate, long withoutTreatmentStart,
                          List<EmptyStep> emptySteps) {
    }

    public record EmptyStep(int step, long count) {
    }

    /** Historia para retomar; {@code filledSteps} = pasos clínicos con datos, nulo = sin calcular. */
    public record ResumeItem(long id, String recordNumber, String patientName, Integer lastStep, Integer filledSteps,
                             Instant updatedAt) {
    }
}
