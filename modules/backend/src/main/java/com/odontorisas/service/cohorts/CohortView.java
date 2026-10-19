package com.odontorisas.service.cohorts;

/**
 * Turma; los conteos, el código de inscripción y si está abierta son solo para el ADMIN (nulos para
 * la coordinación, que recibe sus turmas con id y nombre).
 */
public record CohortView(Long id, String name, Long students, Long coordinators, String registrationCode,
                         Boolean registrationOpen) {

    /** Lo que ve la coordinación: id y nombre. */
    static CohortView reference(Long id, String name) {
        return new CohortView(id, name, null, null, null, null);
    }
}
