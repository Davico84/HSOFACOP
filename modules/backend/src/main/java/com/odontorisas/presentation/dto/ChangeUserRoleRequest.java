package com.odontorisas.presentation.dto;

import com.odontorisas.common.Role;
import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Nuevo rol de una cuenta (alumno o coordinación) y, para la coordinación, sus turmas. Nulo → 400
 * (ValidationProblem); un rol desconocido o {@code ADMIN} → 400 (ApiProblem), como el estado.
 */
public record ChangeUserRoleRequest(
    @Schema(requiredMode = REQUIRED) @NotNull(message = "El rol es obligatorio") AssignableRole role,
    @Schema(description = "Turmas de la coordinación (al menos una si el rol es COORDINATOR; se ignoran para USER)")
    @Size(max = 100, message = "Demasiadas turmas")
    List<@NotNull Long> cohortIds) {

    /** Roles que el ADMIN puede asignar (nunca ADMIN). */
    public enum AssignableRole {
        USER, COORDINATOR;

        public Role toRole() {
            return Role.valueOf(name());
        }
    }

    public List<Long> cohortIdsOrEmpty() {
        return cohortIds == null ? List.of() : cohortIds;
    }
}
