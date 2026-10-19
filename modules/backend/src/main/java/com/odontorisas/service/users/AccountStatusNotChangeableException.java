package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Se cambia el estado de cuentas USER y COORDINATOR; una cuenta ADMIN (incluida la propia) no (409). */
public class AccountStatusNotChangeableException extends BusinessException {
    public AccountStatusNotChangeableException() {
        super("El estado de una cuenta ADMIN no se puede cambiar.", HttpStatus.CONFLICT, "account-status-not-changeable");
    }
}
