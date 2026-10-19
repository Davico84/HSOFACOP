package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.Role;
import com.odontorisas.service.users.ProfileView;
import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** "Mis datos": identidad de la cuenta (solo lectura) y sus datos de contacto e identificación (nulos = sin registrar). */
public record ProfileResponse(
    @Schema(requiredMode = REQUIRED) Long id,
    @Schema(requiredMode = REQUIRED) String email,
    @Schema(requiredMode = REQUIRED) String fullName,
    @Schema(requiredMode = REQUIRED) Role role,
    @Schema(example = "987654321", nullable = true) String phone,
    @Schema(nullable = true) DocumentType documentType,
    @Schema(nullable = true) String documentNumber,
    @Schema(nullable = true) String copNumber) {

    public static ProfileResponse from(ProfileView v) {
        return new ProfileResponse(v.id(), v.email(), v.fullName(), v.role(), v.contact().phone(),
            v.contact().documentType(), v.contact().documentNumber(), v.contact().copNumber());
    }
}
