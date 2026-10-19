package com.odontorisas.service.records;

import com.odontorisas.common.Role;

/**
 * Quién actúa sobre las historias (design D6), con el rol de su token: un ADMIN (supervisor)
 * alcanza todas; un USER (tratante), solo las suyas; un COORDINATOR, en solo lectura, las de los
 * alumnos de sus turmas (las resuelve el servicio leyendo la base en cada petición).
 */
public record RecordActor(Long userId, Role role) {

    public boolean admin() {
        return role == Role.ADMIN;
    }

    public boolean coordinator() {
        return role == Role.COORDINATOR;
    }
}
