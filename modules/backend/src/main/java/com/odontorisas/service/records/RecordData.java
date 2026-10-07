package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.content.RecordContent;

import java.time.LocalDate;

/**
 * Datos editables de una historia (lo que envía el formulario), incluido el número que asignan los
 * docentes. El autor y la versión no están aquí: los controla el servidor.
 */
public record RecordData(
    String recordNumber,
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
    RecordContent content) {
}
