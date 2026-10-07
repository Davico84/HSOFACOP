package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.RecordData;
import com.odontorisas.service.records.content.RecordContent;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;
import java.util.List;
import org.hibernate.validator.constraints.UniqueElements;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PastOrPresent;
import jakarta.validation.constraints.Size;

import java.time.LocalDate;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Historia completa a guardar, con la {@code version} que el usuario cargó: si cambió desde
 * entonces, 409. El número puede corregirse (409 si otra historia lo tiene); un autor enviado se ignora.
 */
@PatientFields.Consistent
public record UpdateRecordRequest(
    @Schema(requiredMode = REQUIRED, description = "Versión cargada (control de edición concurrente)")
    @NotNull Long version,
    @Schema(requiredMode = REQUIRED, description = "Número de historia que asignan los docentes", example = "AOC-0015")
    @NotBlank(message = "Indica el número de historia.")
    @Pattern(regexp = "AOC-[0-9]{4}", message = "Usa el formato AOC-0001.")
    String recordNumber,
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
    @Schema(description = "Paso del formulario (1–8) en que se trabajó; se abre ahí al volver. Ausente = no cambia")
    @Min(value = 1, message = "El paso debe estar entre 1 y 8.") @Max(value = 8, message = "El paso debe estar entre 1 y 8.")
    Integer lastStep,
    @Schema(description = "Pasos del formulario (1–8) con datos; el paso 1 siempre cuenta")
    @UniqueElements(message = "Los pasos no pueden repetirse.")
    List<@Min(value = 1, message = "El paso debe estar entre 1 y 8.") @Max(value = 8, message = "El paso debe estar entre 1 y 8.") Integer> filledSteps) implements PatientFields {

    public RecordData toData() {
        return new RecordData(recordNumber, treatingDentist, patientName, documentType, documentNumber, patientSex, birthDate,
            birthPlace, address, phone, treatmentStartDate, content);
    }
}
