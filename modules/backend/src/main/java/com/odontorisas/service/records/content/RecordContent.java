package com.odontorisas.service.records.content;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.Valid;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/**
 * Contenido clínico completo (columna JSONB). En las respuestas todas las secciones están
 * presentes (vacías si no se llenaron). Nuevas secciones de fases futuras se añaden como campos
 * opcionales; {@code schemaVersion} permite migrar el JSON si un día cambia de forma.
 */
public record RecordContent(
    @Schema(description = "Versión del formato del contenido (la fija el servidor)") Integer schemaVersion,
    @Schema(requiredMode = REQUIRED) @Valid Anamnesis anamnesis,
    @Schema(requiredMode = REQUIRED) @Valid FacialAnalysis facial,
    @Schema(requiredMode = REQUIRED) @Valid FunctionalAnalysis functional,
    @Schema(requiredMode = REQUIRED) @Valid OcclusalAnalysis occlusal,
    @Schema(requiredMode = REQUIRED) @Valid RadiographicAnalysis radiographic,
    @Schema(requiredMode = REQUIRED) @Valid Diagnosis diagnosis,
    @Schema(requiredMode = REQUIRED) @Valid Signatures signatures) {

    public static final int CURRENT_SCHEMA_VERSION = 1;

    public static RecordContent empty() {
        return new RecordContent(CURRENT_SCHEMA_VERSION, Anamnesis.empty(), FacialAnalysis.empty(),
            FunctionalAnalysis.empty(), OcclusalAnalysis.empty(), RadiographicAnalysis.empty(),
            Diagnosis.empty(), Signatures.empty());
    }
}
