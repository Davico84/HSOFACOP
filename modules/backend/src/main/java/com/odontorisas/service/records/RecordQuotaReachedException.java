package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** El tratante ya creó tantas historias como su cupo (409). Solo el detalle: ApiProblem no admite más campos. */
public class RecordQuotaReachedException extends BusinessException {
    public RecordQuotaReachedException(int quota) {
        super("Alcanzaste el máximo de %d historias clínicas. Comunícate con el administrador para solicitar más."
            .formatted(quota), HttpStatus.CONFLICT, "record-quota-reached");
    }
}
