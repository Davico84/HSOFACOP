package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;

import java.time.Instant;
import java.time.LocalDate;

/** Fila del listado de historias (sin contenido clínico). */
public record RecordSummaryView(
    Long id,
    String recordNumber,
    String patientName,
    DocumentType documentType,
    String documentNumber,
    String treatingDentist,
    LocalDate treatmentStartDate,
    String authorName,
    Instant updatedAt) {
}
