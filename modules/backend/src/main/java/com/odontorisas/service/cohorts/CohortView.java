package com.odontorisas.service.cohorts;

/**
 * Turma; {@code students} y {@code coordinators} solo para el ADMIN (nulos para la coordinación,
 * que recibe sus turmas sin conteos).
 */
public record CohortView(Long id, String name, Long students, Long coordinators) {
}
