package com.odontorisas.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * Alta de cuenta (mínima): nombre completo, correo y contraseña. La confirmación
 * de contraseña se valida solo en el cliente. Otros datos de perfil (usuario,
 * teléfono, país) se capturan luego en la capacidad `users`. Paridad de formato
 * con el schema Zod del formulario (docs/coding-style.md §7).
 */
public record RegisterRequest(
    @NotBlank @Email String email,
    @NotBlank @Size(min = 8, message = "La contraseña debe tener al menos 8 caracteres") String password,
    @NotBlank @Size(min = 2, max = 120) String fullName
) {}
