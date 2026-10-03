package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La historia cambió desde que se cargó: no se sobrescribe (409, design D4). */
public class StaleRecordException extends BusinessException {
    public StaleRecordException() {
        super("La historia clínica cambió desde que la abriste. Recárgala para ver los cambios.",
            HttpStatus.CONFLICT, "stale-record");
    }
}
