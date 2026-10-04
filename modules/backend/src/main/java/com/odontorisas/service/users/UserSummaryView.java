package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;

/**
 * Vista de una cuenta para la administración (sin datos sensibles ni internos), con su cupo de
 * historias ({@code null} = sin límite) y cuántas creó.
 */
public record UserSummaryView(Long id, String email, String fullName, Role role, UserStatus status,
                              Integer recordQuota, long recordCount) {
}
