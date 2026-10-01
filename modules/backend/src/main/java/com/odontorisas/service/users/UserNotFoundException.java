package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** La cuenta no existe (404). */
public class UserNotFoundException extends BusinessException {
    public UserNotFoundException() {
        super("No se encontró la cuenta indicada.", HttpStatus.NOT_FOUND, "user-not-found");
    }
}
