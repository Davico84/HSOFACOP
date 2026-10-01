package com.odontorisas.presentation.controller;

import com.odontorisas.presentation.dto.ApiProblem;
import com.odontorisas.presentation.dto.ChangeUserStatusRequest;
import com.odontorisas.presentation.dto.PageResponse;
import com.odontorisas.presentation.dto.UserSummaryResponse;
import com.odontorisas.presentation.dto.ValidationProblem;
import com.odontorisas.service.users.UserAdminService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import io.swagger.v3.oas.annotations.Parameter;
import jakarta.validation.constraints.Min;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Gestión de cuentas (capacidad {@code users}), solo ADMIN. Los 401/403/500 transversales los
 * documenta {@code OpenApiErrorsConfig}; aquí se declaran el éxito y los errores propios.
 */
@RestController
@RequestMapping("/api/users")
@Tag(name = "users", description = "Gestión de usuarios")
@PreAuthorize("hasRole('ADMIN')")
public class UsersController {

    private final UserAdminService userAdmin;

    public UsersController(UserAdminService userAdmin) {
        this.userAdmin = userAdmin;
    }

    static final int DEFAULT_PAGE_SIZE = 20;
    static final int MAX_PAGE_SIZE = 100;

    /**
     * {@code page}/{@code size} explícitos y orden FIJO en el servidor ({@code id}): con un
     * {@code Pageable} el cliente podría ordenar por cualquier propiedad de la entidad
     * (p. ej. {@code passwordHash}, que revelaría el orden de los hashes) o provocar un 500 con
     * una propiedad inexistente. Un {@code size} mayor que 100 se recorta.
     */
    @Operation(operationId = "listUsers", summary = "Listar las cuentas (paginado, máximo 100 por página)")
    @ApiResponse(responseCode = "200", description = "Página de cuentas")
    @ApiResponse(responseCode = "400", description = "Página o tamaño inválidos",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<PageResponse<UserSummaryResponse>> listUsers(
            @Parameter(description = "Página (base 0)") @RequestParam(defaultValue = "0") @Min(0) int page,
            @Parameter(description = "Tamaño (1–100; uno mayor se recorta a 100)")
            @RequestParam(defaultValue = "" + DEFAULT_PAGE_SIZE) @Min(1) int size) {
        PageRequest pageable = PageRequest.of(page, Math.min(size, MAX_PAGE_SIZE), Sort.by("id"));
        return ResponseEntity.ok(PageResponse.from(userAdmin.list(pageable).map(UserSummaryResponse::from)));
    }

    @Operation(operationId = "changeUserStatus", summary = "Deshabilitar o reactivar una cuenta USER")
    @ApiResponse(responseCode = "200", description = "Cuenta con su estado actual",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = UserSummaryResponse.class)))
    @ApiResponse(responseCode = "400", description = "Estado ausente o inválido",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "404", description = "La cuenta no existe",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "409", description = "La cuenta no es USER: su estado no se puede cambiar",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PatchMapping("/{id}/status")
    public ResponseEntity<UserSummaryResponse> changeUserStatus(
            @PathVariable Long id, @Valid @RequestBody ChangeUserStatusRequest request) {
        return ResponseEntity.ok(UserSummaryResponse.from(userAdmin.changeStatus(id, request.status())));
    }
}
