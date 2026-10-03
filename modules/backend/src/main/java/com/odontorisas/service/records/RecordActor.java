package com.odontorisas.service.records;

/**
 * Quién actúa sobre las historias (design D6): un ADMIN (supervisor) alcanza todas; un USER
 * (tratante), solo las suyas.
 */
public record RecordActor(Long userId, boolean admin) {
}
