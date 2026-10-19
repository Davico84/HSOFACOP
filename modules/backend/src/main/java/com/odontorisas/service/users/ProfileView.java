package com.odontorisas.service.users;

import com.odontorisas.common.Role;

/** Datos propios de la cuenta autenticada ("Mis datos"). */
public record ProfileView(Long id, String email, String fullName, Role role, ContactData contact) {
}
