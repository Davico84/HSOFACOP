package com.odontorisas.service.records;

/** Cupo del usuario autenticado: {@code limit} nulo = sin límite (siempre para un ADMIN). */
public record RecordQuotaView(Integer limit, long used, boolean reached) {
}
