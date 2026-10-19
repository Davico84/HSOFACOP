package com.odontorisas.presentation.dto;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.service.cohorts.CohortRef;
import com.odontorisas.service.users.UserSummaryView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.util.List;

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
    @Schema(description = "Cupo de historias clínicas; nulo = sin límite (siempre nulo en cuentas ADMIN y COORDINATOR)", nullable = true)
    Integer recordQuota,
    @Schema(requiredMode = REQUIRED, description = "Historias clínicas creadas por la cuenta") long recordCount,
    @Schema(description = "Turma del alumno; nula = sin turma (siempre nula si no es USER)", nullable = true)
    CohortRefResponse cohort,
    @Schema(requiredMode = REQUIRED, description = "Turmas que supervisa (vacía si no es COORDINATOR)")
    List<CohortRefResponse> coordinatorCohorts) {

    /** Turma por id y nombre. */
    @Schema(name = "CohortRef")
    public record CohortRefResponse(
        @Schema(requiredMode = REQUIRED) Long id,
        @Schema(requiredMode = REQUIRED, example = "Turma 1") String name) {

        static CohortRefResponse from(CohortRef ref) {
            return ref == null ? null : new CohortRefResponse(ref.id(), ref.name());
        }
    }

    public static UserSummaryResponse from(UserSummaryView view) {
        return new UserSummaryResponse(view.id(), view.email(), view.fullName(), view.role(), view.status(),
            view.recordQuota(), view.recordCount(), CohortRefResponse.from(view.cohort()),
            view.coordinatorCohorts().stream().map(CohortRefResponse::from).toList());
    }
}
