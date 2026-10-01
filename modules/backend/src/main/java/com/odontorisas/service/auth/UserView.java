package com.odontorisas.service.auth;

import com.odontorisas.common.Role;

/** Vista de usuario que sale del servicio hacia la presentación (sin datos sensibles). */
public record UserView(Long id, String email, Role role, String fullName) {}
