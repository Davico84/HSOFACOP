package com.odontorisas.common;

/**
 * Rol de acceso al sistema. Compartido entre capas (entidad, servicio, DTOs y
 * seguridad) para no acoplar {@code presentation} a {@code persistence}.
 */
public enum Role {
    ADMIN,
    USER
}
