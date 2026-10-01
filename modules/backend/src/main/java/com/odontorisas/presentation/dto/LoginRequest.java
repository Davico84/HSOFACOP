package com.odontorisas.presentation.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

/** Credenciales de inicio de sesión (paridad de formato con el schema Zod, docs/coding-style.md §7). */
public record LoginRequest(
    @NotBlank @Email String email,
    @NotBlank String password
) {}
