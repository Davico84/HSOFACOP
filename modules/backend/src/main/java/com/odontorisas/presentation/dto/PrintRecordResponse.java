package com.odontorisas.presentation.dto;

import com.odontorisas.service.records.PrintView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.LocalDate;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Impresión registrada: la historia con los datos fijos, la fecha y el avance para la marca de las hojas. */
public record PrintRecordResponse(
    @Schema(requiredMode = REQUIRED) RecordResponse record,
    @Schema(requiredMode = REQUIRED, description = "Fecha de impresión en la zona de la app") LocalDate printedOn,
    @Schema(description = "Pasos clínicos (1–7) con datos; vacío = sin calcular", nullable = true) Integer clinicalFilledSteps) {

    public static PrintRecordResponse from(PrintView v) {
        return new PrintRecordResponse(RecordResponse.from(v.record()), v.printedOn(), v.clinicalFilledSteps());
    }
}
