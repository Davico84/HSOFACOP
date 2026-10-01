package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** Solo se cambia el estado de cuentas USER; una cuenta ADMIN (incluida la propia) no (409). */
public class AccountStatusNotChangeableException extends BusinessException {
    public AccountStatusNotChangeableException() {
        super("Solo se puede cambiar el estado de cuentas con rol USER.", HttpStatus.CONFLICT, "account-status-not-changeable");
    }
}
