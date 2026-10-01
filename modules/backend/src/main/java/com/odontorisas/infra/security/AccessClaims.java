package com.odontorisas.infra.security;

import com.odontorisas.common.Role;

/** Datos extraídos de un access token válido. */
public record AccessClaims(Long userId, String email, Role role) {}
