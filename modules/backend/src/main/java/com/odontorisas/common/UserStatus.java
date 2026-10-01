package com.odontorisas.common;

/**
 * Estado administrativo de una cuenta (capacidad {@code users}). Independiente del bloqueo
 * temporal por intentos fallidos: una cuenta {@code DISABLED} no inicia ni renueva sesión.
 */
public enum UserStatus {
    ACTIVE,
    DISABLED
}
