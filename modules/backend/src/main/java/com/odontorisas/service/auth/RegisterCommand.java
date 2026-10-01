package com.odontorisas.service.auth;

/** Datos de registro que la presentación pasa al servicio (ya validados en el DTO). */
public record RegisterCommand(String email, String password, String fullName) {}
