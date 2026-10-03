package com.odontorisas.service.records;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.content.RecordContent;

import java.time.LocalDate;

/**
 * Datos editables de una historia (lo que envía el formulario). El número, el autor y la versión
 * no están aquí: los asigna o controla el servidor.
 */
public record RecordData(
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
