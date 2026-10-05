package com.odontorisas.service.records;

import java.time.LocalDate;

/**
 * Impresión registrada: la historia (con los datos ya fijos), la fecha de impresión en la zona de la
 * app y los pasos clínicos (1–7) con datos; nulo si la historia no tiene pasos calculados.
 */
public record PrintView(RecordView record, LocalDate printedOn, Integer clinicalFilledSteps) {
}
