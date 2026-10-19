package com.odontorisas.common;

/**
 * Rol de acceso al sistema. Compartido entre capas (entidad, servicio, DTOs y
 * seguridad) para no acoplar {@code presentation} a {@code persistence}.
 * {@code COORDINATOR} supervisa en solo lectura las historias de sus turmas (capacidad cohorts).
 */
public enum Role {
    ADMIN,
    USER,
    COORDINATOR
}
