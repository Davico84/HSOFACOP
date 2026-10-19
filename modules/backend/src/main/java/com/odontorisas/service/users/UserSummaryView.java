package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.service.cohorts.CohortRef;

import java.util.List;

/**
 * Vista de una cuenta para la administración (sin datos sensibles ni internos), con su cupo de
 * historias ({@code null} = sin límite), cuántas creó, su turma de alumno ({@code null} = sin turma)
 * y las turmas que supervisa (vacía si no es COORDINATOR).
 */
public record UserSummaryView(Long id, String email, String fullName, Role role, UserStatus status,
                              Integer recordQuota, long recordCount, CohortRef cohort,
                              List<CohortRef> coordinatorCohorts) {
}
