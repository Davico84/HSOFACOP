package com.odontorisas.presentation.dto;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.service.users.UserSummaryView;
import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Cuenta en el listado de administración: EXACTAMENTE estos campos. Nunca el hash de la
 * contraseña, el contador de intentos, el bloqueo temporal ni fechas internas.
 */
public record UserSummaryResponse(
    @Schema(requiredMode = REQUIRED) Long id,
    @Schema(requiredMode = REQUIRED) String email,
    @Schema(requiredMode = REQUIRED) String fullName,
    @Schema(requiredMode = REQUIRED) Role role,
    @Schema(requiredMode = REQUIRED) UserStatus status,
    @Schema(description = "Cupo de historias clínicas; nulo = sin límite (siempre nulo en cuentas ADMIN)", nullable = true)
    Integer recordQuota,
    @Schema(requiredMode = REQUIRED, description = "Historias clínicas creadas por la cuenta") long recordCount) {

    public static UserSummaryResponse from(UserSummaryView view) {
        return new UserSummaryResponse(view.id(), view.email(), view.fullName(), view.role(), view.status(),
            view.recordQuota(), view.recordCount());
    }
}
