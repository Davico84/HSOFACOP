package com.odontorisas.service.users;

import com.odontorisas.service.BusinessException;
import org.springframework.http.HttpStatus;

/** El rol de una cuenta ADMIN (incluida la propia) no se cambia (409). */
public class RoleNotChangeableException extends BusinessException {
    public RoleNotChangeableException() {
        super("El rol de una cuenta ADMIN no se puede cambiar.", HttpStatus.CONFLICT, "role-not-changeable");
    }
}
