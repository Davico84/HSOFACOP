package com.odontorisas.presentation.dto;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Nombre de una turma al crearla o renombrarla (se guarda sin espacios sobrantes). */
public record CohortNameRequest(
    @Schema(requiredMode = REQUIRED, example = "Turma 1")
    @NotBlank(message = "El nombre de la turma es obligatorio")
    @Size(max = 80, message = "El nombre de la turma no puede superar los 80 caracteres")
    String name) {
}
