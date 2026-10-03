package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.content.RecordContent;

import java.time.Instant;
import java.time.LocalDate;

/** Historia completa tal como la ve quien puede abrirla. */
public record RecordView(
    Long id,
    String recordNumber,
    Long authorId,
    String authorName,
    String treatingDentist,
    String patientName,
    DocumentType documentType,
    String documentNumber,
    PatientSex patientSex,
    LocalDate birthDate,
    String birthPlace,
    String address,
    String phone,
    LocalDate treatmentStartDate,
    Integer ageYears,
    RecordContent content,
    long version,
    Instant createdAt,
    Instant updatedAt) {
}
