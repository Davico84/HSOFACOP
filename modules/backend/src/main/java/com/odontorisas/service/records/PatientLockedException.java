package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Un guardado intenta cambiar datos del paciente fijados al imprimir (409). */
public class PatientLockedException extends BusinessException {
    public PatientLockedException() {
        super("Los datos del paciente quedaron fijos al imprimir la historia. Solicita el desbloqueo para corregirlos.", HttpStatus.CONFLICT, "patient-locked");
    }
}
