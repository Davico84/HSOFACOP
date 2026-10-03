package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.RecordData;
import com.odontorisas.service.records.content.RecordContent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Historia completa a guardar, con la {@code version} que el usuario cargó: si cambió desde
 * entonces, 409. Un número o autor enviados se ignoran.
 */
@PatientFields.Consistent
public record UpdateRecordRequest(
    @Schema(requiredMode = REQUIRED, description = "Versión cargada (control de edición concurrente)")
    @NotNull Long version,
    @Size(max = 120) String treatingDentist,
    @Schema(requiredMode = REQUIRED) @NotBlank(message = "Indica el nombre del paciente.") @Size(max = 120) String patientName,
    DocumentType documentType,
    @Size(max = 12) String documentNumber,
    PatientSex patientSex,
    @PastOrPresent(message = "La fecha de nacimiento no puede ser futura.") LocalDate birthDate,
    @Size(max = 120) String birthPlace,
    @Size(max = 200) String address,
    @Size(max = 20) String phone,
    LocalDate treatmentStartDate,
    @Valid RecordContent content) implements PatientFields {

    public RecordData toData() {
        return new RecordData(treatingDentist, patientName, documentType, documentNumber, patientSex, birthDate,
            birthPlace, address, phone, treatmentStartDate, content);
    }
}
