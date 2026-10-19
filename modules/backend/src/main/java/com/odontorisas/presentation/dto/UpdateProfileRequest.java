package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Nuevos datos de contacto e identificación de la propia cuenta; reemplaza los anteriores (vacío o
 * ausente = quitar el dato). Mismas reglas que el registro ({@link ContactFields}).
 */
@ContactFields.Consistent
public record UpdateProfileRequest(
    @Schema(description = "Celular: 9 dígitos que empiezan con 9", example = "987654321", nullable = true) String phone,
    @Schema(nullable = true) DocumentType documentType,
    @Schema(description = "Número del documento (con su tipo)", nullable = true) String documentNumber,
    @Schema(description = "Número de colegiatura del Colegio Odontológico del Perú (1 a 6 dígitos)", nullable = true) String copNumber
) implements ContactFields {

    public UpdateProfileRequest {
        phone = ContactFields.clean(phone);
        documentNumber = ContactFields.clean(documentNumber);
        copNumber = ContactFields.clean(copNumber);
    }
}
