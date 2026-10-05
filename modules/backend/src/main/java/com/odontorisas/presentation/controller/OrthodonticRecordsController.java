package com.odontorisas.presentation.controller;

import com.odontorisas.presentation.dto.RecordQuotaResponse;
import com.odontorisas.presentation.dto.ApiProblem;
import com.odontorisas.presentation.dto.CreateRecordRequest;
import com.odontorisas.presentation.dto.PageResponse;
import com.odontorisas.presentation.dto.RecordResponse;
import com.odontorisas.presentation.dto.RecordSummaryResponse;
import com.odontorisas.presentation.dto.UpdateRecordRequest;
import com.odontorisas.presentation.dto.ValidationProblem;
import com.odontorisas.service.records.OrthodonticRecordService;
import com.odontorisas.service.records.RecordActor;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.Size;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Historias clínicas de ortodoncia (capacidad orthodontic-records). Cualquier usuario autenticado;
 * el alcance (USER: las suyas; ADMIN: todas) lo aplica el service, y una historia fuera de
 * alcance responde 404. Los 401/403/500 transversales los documenta {@code OpenApiErrorsConfig}.
 */
@RestController
@RequestMapping("/api/orthodontic-records")
@Tag(name = "orthodontic-records", description = "Historias clínicas de ortodoncia")
@PreAuthorize("isAuthenticated()")
public class OrthodonticRecordsController {

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;

    private final OrthodonticRecordService service;

    public OrthodonticRecordsController(OrthodonticRecordService service) {
        this.service = service;
    }

    /** Orden fijo en el servidor (última modificación primero): el cliente no elige propiedades. */
    @Operation(operationId = "listRecords", summary = "Listar historias (las propias; todas si es ADMIN)")
    @ApiResponse(responseCode = "200", description = "Página de historias")
    @ApiResponse(responseCode = "400", description = "Página, tamaño o búsqueda inválidos",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PageResponse<RecordSummaryResponse>> listRecords(
            @Parameter(description = "Busca en paciente, documento y número (sin distinguir tildes ni mayúsculas)")
            @RequestParam(required = false) @Size(max = 120) String q,
            @Parameter(description = "Página (base 0)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Tamaño (1–100; uno mayor se recorta a 100)")
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE) @Min(1) int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE),
            Sort.by(Sort.Order.desc("updatedAt"), Sort.Order.desc("id")));
        return ResponseEntity.ok(PageResponse.from(
            service.list(currentActor(), q, pageable).map(RecordSummaryResponse::from)));
    }

    @Operation(operationId = "createRecord", summary = "Crear una historia (borrador) con el siguiente número del autor")
    @ApiResponse(responseCode = "201", description = "Historia creada",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = RecordResponse.class)))
    @ApiResponse(responseCode = "400", description = "Datos inválidos",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "409", description = "El tratante llegó a su cupo de historias (record-quota-reached)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PostMapping
    public ResponseEntity<RecordResponse> createRecord(
            @Valid @RequestBody CreateRecordRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(RecordResponse.from(service.create(currentActor(), request.toData(), request.filledSteps())));
    }

    @Operation(operationId = "getRecordQuota", summary = "Cupo de historias del usuario autenticado y cuántas creó")
    @ApiResponse(responseCode = "200", description = "Cupo y uso",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = RecordQuotaResponse.class)))
    @GetMapping(value = "/quota", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<RecordQuotaResponse> getRecordQuota() {
        return ResponseEntity.ok(RecordQuotaResponse.from(service.quota(currentActor())));
    }

    @Operation(operationId = "getRecord", summary = "Obtener una historia")
    @ApiResponse(responseCode = "200", description = "Historia",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = RecordResponse.class)))
    @ApiResponse(responseCode = "404", description = "No existe o no está a tu alcance",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @GetMapping("/{id}")
    public ResponseEntity<RecordResponse> getRecord(@PathVariable Long id) {
        return ResponseEntity.ok(RecordResponse.from(service.get(currentActor(), id)));
    }

    @Operation(operationId = "updateRecord", summary = "Guardar la historia completa (con la versión cargada)")
    @ApiResponse(responseCode = "200", description = "Historia guardada, con su nueva versión",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = RecordResponse.class)))
    @ApiResponse(responseCode = "400", description = "Datos inválidos",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "404", description = "No existe o no está a tu alcance",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "409", description = "La historia cambió desde que se cargó (stale-record)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PutMapping("/{id}")
    public ResponseEntity<RecordResponse> updateRecord(
            @PathVariable Long id, @Valid @RequestBody UpdateRecordRequest request) {
        return ResponseEntity.ok(RecordResponse.from(
            service.update(currentActor(), id, request.version(), request.toData(), request.lastStep(),
                request.filledSteps())));
    }

    /** El filtro JWT deja el id del usuario en los {@code details} y el rol como autoridad. */
    static RecordActor currentActor() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Long userId = (Long) authentication.getDetails();
        boolean admin = authentication.getAuthorities().stream()
            .anyMatch(a -> "ROLE_ADMIN".equals(a.getAuthority()));
        return new RecordActor(userId, admin);
    }
}
