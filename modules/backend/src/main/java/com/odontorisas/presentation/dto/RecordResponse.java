package com.odontorisas.presentation.dto;

import com.odontorisas.common.DocumentType;
import com.odontorisas.common.PatientSex;
import com.odontorisas.service.records.RecordView;
import com.odontorisas.service.records.content.RecordContent;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.time.LocalDate;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Historia clínica completa. {@code ageYears} la calcula el servidor (no se envía). */
public record RecordResponse(
    @Schema(requiredMode = REQUIRED) Long id,
    @Schema(requiredMode = REQUIRED, example = "AEO-001") String recordNumber,
    @Schema(requiredMode = REQUIRED) Long authorId,
    @Schema(requiredMode = REQUIRED) String authorName,
    String treatingDentist,
    @Schema(requiredMode = REQUIRED) String patientName,
    DocumentType documentType,
    String documentNumber,
    PatientSex patientSex,
    LocalDate birthDate,
    String birthPlace,
    String address,
    String phone,
    LocalDate treatmentStartDate,
    @Schema(description = "Años cumplidos a la fecha de inicio de tratamiento (o a hoy); vacío sin fecha de nacimiento")
    Integer ageYears,
    @Schema(requiredMode = REQUIRED) RecordContent content,
    @Schema(description = "Último paso (1–8) en que se guardaron cambios; vacío = paso 1") Integer lastStep,
    @Schema(description = "Pasos (1–8) con datos según el último guardado; vacío = sin calcular") List<Integer> filledSteps,
    @Schema(description = "Primera impresión registrada: desde entonces los datos del paciente están fijos; vacío = desbloqueada", nullable = true)
    Instant patientLockedAt,
    @Schema(description = "Último desbloqueo de los datos del paciente; vacío = nunca", nullable = true) LastUnlock lastUnlock,
    @Schema(description = "Solicitud de desbloqueo pendiente; vacío = ninguna", nullable = true) UnlockRequest unlockRequest,
    @Schema(requiredMode = REQUIRED, description = "Versión actual: se envía al guardar") long version,
    @Schema(requiredMode = REQUIRED) Instant createdAt,
    @Schema(requiredMode = REQUIRED) Instant updatedAt) {

    public static RecordResponse from(RecordView v) {
        return new RecordResponse(v.id(), v.recordNumber(), v.authorId(), v.authorName(), v.treatingDentist(),
            v.patientName(), v.documentType(), v.documentNumber(), v.patientSex(), v.birthDate(), v.birthPlace(),
            v.address(), v.phone(), v.treatmentStartDate(), v.ageYears(), v.content(), v.lastStep(), v.filledSteps(), v.patientLockedAt(),
            v.lastUnlockAt() == null ? null : new LastUnlock(v.lastUnlockBy(), v.lastUnlockAt()),
            v.unlockRequestedAt() == null ? null : new UnlockRequest(v.unlockRequestedAt(), v.unlockRequestReason()),
            v.version(),
            v.createdAt(), v.updatedAt());
    }

    @Schema(name = "RecordLastUnlock")
    public record LastUnlock(
        @Schema(requiredMode = REQUIRED, description = "Nombre del ADMIN que desbloqueó") String byName,
        @Schema(requiredMode = REQUIRED) Instant at) {
    }

    @Schema(name = "RecordUnlockRequest")
    public record UnlockRequest(
        @Schema(requiredMode = REQUIRED) Instant requestedAt,
        @Schema(requiredMode = REQUIRED, description = "Motivo del tratante") String reason) {
    }
}
