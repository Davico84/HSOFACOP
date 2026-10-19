package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * La cuenta, según la base, no puede crear historias (una coordinación con su token anterior de
 * alumno): 403 con el mismo cuerpo que una autorización denegada.
 */
public class RecordWriteForbiddenException extends BusinessException {
    public RecordWriteForbiddenException() {
        super("No tienes permiso para realizar esta acción.", HttpStatus.FORBIDDEN, "access-denied");
    }
}
