package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Una cuenta con historias no pasa a coordinación (409). */
public class AccountHasRecordsException extends BusinessException {
    public AccountHasRecordsException() {
        super("La cuenta tiene historias clínicas: no puede pasar a coordinación.", HttpStatus.CONFLICT,
            "account-has-records");
    }
}
