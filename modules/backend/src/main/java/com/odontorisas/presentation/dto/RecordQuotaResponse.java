package com.odontorisas.presentation.dto;

import com.odontorisas.service.records.RecordQuotaView;
import io.swagger.v3.oas.annotations.media.Schema;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Cupo de historias del usuario autenticado. */
public record RecordQuotaResponse(
    @Schema(description = "Cupo; nulo = sin límite", nullable = true) Integer limit,
    @Schema(requiredMode = REQUIRED, description = "Historias creadas") long used,
    @Schema(requiredMode = REQUIRED, description = "Llegó al cupo: no puede crear más") boolean reached) {

    public static RecordQuotaResponse from(RecordQuotaView view) {
        return new RecordQuotaResponse(view.limit(), view.used(), view.reached());
    }
}
