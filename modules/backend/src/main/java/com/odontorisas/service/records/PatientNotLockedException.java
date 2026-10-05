package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La historia no tiene los datos del paciente fijos: no hay nada que desbloquear ni solicitar (409). */
public class PatientNotLockedException extends BusinessException {
    public PatientNotLockedException() {
        super("La historia no tiene los datos del paciente fijos.", HttpStatus.CONFLICT, "patient-not-locked");
    }
}
