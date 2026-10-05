package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.service.records.RecordSummaryView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.time.LocalDate;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Fila del listado de historias: sin contenido clínico. */
public record RecordSummaryResponse(
    @Schema(requiredMode = REQUIRED) Long id,
    @Schema(requiredMode = REQUIRED, example = "AEO-001") String recordNumber,
    @Schema(requiredMode = REQUIRED) String patientName,
    DocumentType documentType,
    String documentNumber,
    String treatingDentist,
    LocalDate treatmentStartDate,
    @Schema(requiredMode = REQUIRED) String authorName,
    @Schema(requiredMode = REQUIRED) Instant updatedAt,
    @Schema(requiredMode = REQUIRED, description = "Datos del paciente fijos (ya se imprimió)") boolean patientLocked) {

    public static RecordSummaryResponse from(RecordSummaryView v) {
        return new RecordSummaryResponse(v.id(), v.recordNumber(), v.patientName(), v.documentType(),
            v.documentNumber(), v.treatingDentist(), v.treatmentStartDate(), v.authorName(), v.updatedAt(),
            v.patientLocked());
    }
}
