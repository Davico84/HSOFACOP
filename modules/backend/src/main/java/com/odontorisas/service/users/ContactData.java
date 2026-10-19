package com.odontorisas.service.users;

import com.odontorisas.common.DocumentType;
import com.odontorisas.persistence.entity.User;

/** Datos de contacto e identificación de una cuenta (ya normalizados y validados); nulo = sin registrar. */
public record ContactData(String phone, DocumentType documentType, String documentNumber, String copNumber) {

    public static final ContactData EMPTY = new ContactData(null, null, null, null);

    public static ContactData of(User user) {
        return new ContactData(user.getPhone(), user.getDocumentType(), user.getDocumentNumber(), user.getCopNumber());
    }

    /** Reemplaza los datos de la cuenta (un {@code null} quita el dato). */
    public void applyTo(User user) {
        user.setPhone(phone);
        user.setDocumentType(documentType);
        user.setDocumentNumber(documentNumber);
        user.setCopNumber(copNumber);
    }
}
