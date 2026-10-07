package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/**
 * El número de historia ya lo tiene otra historia (409). No dice de quién: la coordinación lo
 * resuelve buscando el número en el listado.
 */
public class RecordNumberTakenException extends BusinessException {
    public RecordNumberTakenException(String number) {
        super("El número " + number + " ya está registrado en otra historia. Verifica el número con la coordinación.",
            HttpStatus.CONFLICT, "record-number-taken");
    }
}
