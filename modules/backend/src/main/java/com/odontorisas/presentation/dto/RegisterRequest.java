package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Alta de cuenta: nombre completo, correo y contraseña, y opcionalmente el código de turma
 * (capacidad cohorts) y los datos de contacto e identificación ({@link ContactFields}). La
 * confirmación de contraseña se valida solo en el cliente. Los opcionales vacíos llegan como
 * {@code null}. Paridad de formato con el schema Zod del formulario (docs/coding-style.md §7).
 */
@ContactFields.Consistent
public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String password,
    @NotBlank @Size(min = 2, max = 120) String fullName,
    @Schema(description = "Código de inscripción de la turma (sin distinguir mayúsculas, espacios ni guiones); vacío = alumno individual",
        example = "K7QM-4TXR", nullable = true)
    @Size(max = 20, message = "El código de turma no es válido.") String cohortCode,
    @Schema(description = "Celular: 9 dígitos que empiezan con 9", example = "987654321", nullable = true) String phone,
    @Schema(nullable = true) DocumentType documentType,
    @Schema(description = "Número del documento (con su tipo)", nullable = true) String documentNumber,
    @Schema(description = "Número de colegiatura del Colegio Odontológico del Perú (1 a 6 dígitos)", nullable = true) String copNumber
) implements ContactFields {

    public RegisterRequest {
        cohortCode = ContactFields.clean(cohortCode);
        phone = ContactFields.clean(phone);
        documentNumber = ContactFields.clean(documentNumber);
        copNumber = ContactFields.clean(copNumber);
    }
}
