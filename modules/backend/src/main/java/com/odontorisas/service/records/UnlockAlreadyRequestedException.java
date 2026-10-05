package com.odontorisas.service.records;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Ya hay una solicitud de desbloqueo pendiente para la historia (409). */
public class UnlockAlreadyRequestedException extends BusinessException {
    public UnlockAlreadyRequestedException() {
        super("Ya hay una solicitud de desbloqueo pendiente para esta historia.", HttpStatus.CONFLICT, "unlock-already-requested");
    }
}
