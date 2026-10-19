package com.odontorisas.service.auth;

import com.odontorisas.service.users.ContactData;

/**
 * Datos de registro que la presentación pasa al servicio (ya validados en el DTO); {@code cohortCode}
 * tal como lo escribió el visitante (nulo = sin turma) y {@code contact} con los datos opcionales.
 */
public record RegisterCommand(String email, String password, String fullName, String cohortCode, ContactData contact) {

    /** Registro sin código ni datos opcionales. */
    public RegisterCommand(String email, String password, String fullName) {
        this(email, password, fullName, null, ContactData.EMPTY);
    }
}
