package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;

/** Vista de una cuenta para la administración (sin datos sensibles ni internos). */
public record UserSummaryView(Long id, String email, String fullName, Role role, UserStatus status) {
}
