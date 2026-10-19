package com.odontorisas.presentation.controller;

import com.odontorisas.presentation.dto.ApiProblem;
import com.odontorisas.presentation.dto.CohortNameRequest;
import com.odontorisas.presentation.dto.CohortRegistrationRequest;
import com.odontorisas.presentation.dto.CohortResponse;
import com.odontorisas.presentation.dto.ValidationProblem;
import com.odontorisas.service.cohorts.CohortService;
import com.odontorisas.service.records.RecordActor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

/**
 * Turmas (capacidad {@code cohorts}): el ADMIN las gestiona; la coordinación solo lista las suyas
 * (para el filtro del listado de historias). Los 401/403/500 transversales los documenta
 * {@code OpenApiErrorsConfig}.
 */
@RestController
@RequestMapping("/api/cohorts")
@Tag(name = "cohorts", description = "Turmas")
public class CohortsController {

    private final CohortService service;

    public CohortsController(CohortService service) {
        this.service = service;
    }

    @Operation(operationId = "listCohorts",
        summary = "Listar turmas (ADMIN: todas, con alumnos y coordinaciones; COORDINATOR: solo las suyas)")
    @ApiResponse(responseCode = "200", description = "Turmas por nombre")
    @PreAuthorize("hasAnyRole('ADMIN','COORDINATOR')")
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<List<CohortResponse>> listCohorts() {
        RecordActor actor = OrthodonticRecordsController.currentActor();
        return ResponseEntity.ok(service.list(actor.userId(), actor.role()).stream().map(CohortResponse::from).toList());
    }

    @Operation(operationId = "createCohort", summary = "Crear una turma (solo ADMIN)")
    @ApiResponse(responseCode = "201", description = "Turma creada",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = CohortResponse.class)))
    @ApiResponse(responseCode = "400", description = "Nombre ausente, vacío o de más de 80 caracteres",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "409", description = "Ya existe una turma con ese nombre (cohort-name-taken)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CohortResponse> createCohort(@Valid @RequestBody CohortNameRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(CohortResponse.from(service.create(request.name())));
    }

    @Operation(operationId = "renameCohort", summary = "Renombrar una turma (solo ADMIN)")
    @ApiResponse(responseCode = "200", description = "Turma renombrada",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = CohortResponse.class)))
    @ApiResponse(responseCode = "400", description = "Nombre ausente, vacío o de más de 80 caracteres",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "404", description = "La turma no existe",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "409", description = "Ya existe una turma con ese nombre (cohort-name-taken)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CohortResponse> renameCohort(
            @PathVariable Long id, @Valid @RequestBody CohortNameRequest request) {
        return ResponseEntity.ok(CohortResponse.from(service.rename(id, request.name())));
    }

    @Operation(operationId = "regenerateCohortCode",
        summary = "Generar un código de inscripción nuevo (solo ADMIN; el anterior deja de servir)")
    @ApiResponse(responseCode = "200", description = "Turma con su código nuevo",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = CohortResponse.class)))
    @ApiResponse(responseCode = "404", description = "La turma no existe",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PreAuthorize("hasRole('ADMIN')")
    @PostMapping(value = "/{id}/registration-code", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CohortResponse> regenerateCohortCode(@PathVariable Long id) {
        return ResponseEntity.ok(CohortResponse.from(service.regenerateCode(id)));
    }

    @Operation(operationId = "changeCohortRegistration", summary = "Abrir o cerrar la inscripción de una turma (solo ADMIN)")
    @ApiResponse(responseCode = "200", description = "Turma con su estado de inscripción",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = CohortResponse.class)))
    @ApiResponse(responseCode = "400", description = "Estado ausente",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "404", description = "La turma no existe",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PreAuthorize("hasRole('ADMIN')")
    @PatchMapping(value = "/{id}/registration", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<CohortResponse> changeCohortRegistration(
            @PathVariable Long id, @Valid @RequestBody CohortRegistrationRequest request) {
        return ResponseEntity.ok(CohortResponse.from(service.setRegistrationOpen(id, request.open())));
    }
}
