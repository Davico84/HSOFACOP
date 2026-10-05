package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.RecordData;
import com.odontorisas.service.records.content.RecordContent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import java.util.List;
import org.hibernate.validator.constraints.UniqueElements;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Nueva historia: basta el nombre del paciente (es un borrador). El número y el autor los asigna
 * el servidor; el tratante, si falta, es el nombre del autor.
 */
@PatientFields.Consistent
public record CreateRecordRequest(
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
    @Valid RecordContent content,
    @Schema(description = "Pasos del formulario (1–8) con datos; el paso 1 siempre cuenta")
    @UniqueElements(message = "Los pasos no pueden repetirse.")
    List<@Min(value = 1, message = "El paso debe estar entre 1 y 8.") @Max(value = 8, message = "El paso debe estar entre 1 y 8.") Integer> filledSteps) implements PatientFields {

    public RecordData toData() {
        return new RecordData(treatingDentist, patientName, documentType, documentNumber, patientSex, birthDate,
            birthPlace, address, phone, treatmentStartDate, content);
    }
}
