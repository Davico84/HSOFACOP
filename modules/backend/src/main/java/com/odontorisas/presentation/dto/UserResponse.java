package com.odontorisas.presentation.dto;

import com.odontorisas.common.Role;
import com.odontorisas.service.auth.UserView;
import io.swagger.v3.oas.annotations.media.Schema;

/** Datos públicos del usuario autenticado. */
public record UserResponse(
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Long id,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String email,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) Role role,
    @Schema(requiredMode = Schema.RequiredMode.REQUIRED) String fullName) {

    public static UserResponse from(UserView user) {
        return new UserResponse(user.id(), user.email(), user.role(), user.fullName());
    }
}
