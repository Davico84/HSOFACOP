package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La historia no existe o no está al alcance de quien la pide (404, design D6). */
public class RecordNotFoundException extends BusinessException {
    public RecordNotFoundException() {
        super("No se encontró la historia clínica.", HttpStatus.NOT_FOUND, "record-not-found");
    }
}
