package com.odontorisas.presentation.controller;

import com.odontorisas.presentation.dto.ProfileResponse;
import com.odontorisas.presentation.dto.UpdateProfileRequest;
import com.odontorisas.presentation.dto.ValidationProblem;
import com.odontorisas.service.users.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Mis datos" (capacidad {@code users}): cualquier cuenta autenticada, solo la propia (el id sale del
 * token). Separado de {@code UsersController}, que es solo para el ADMIN. Los 401/500 transversales
 * los documenta {@code OpenApiErrorsConfig}.
 */
@RestController
@RequestMapping("/api/me/profile")
@Tag(name = "profile", description = "Datos de la propia cuenta")
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService service;

    public ProfileController(ProfileService service) {
        this.service = service;
    }

    @Operation(operationId = "getMyProfile", summary = "Datos de la cuenta autenticada")
    @ApiResponse(responseCode = "200", description = "Datos de la cuenta",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ProfileResponse.class)))
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProfileResponse> getMyProfile() {
        return ResponseEntity.ok(ProfileResponse.from(service.get(OrthodonticRecordsController.currentActor().userId())));
    }

    @Operation(operationId = "updateMyProfile", summary = "Cambiar el celular, el documento y el COP de la cuenta autenticada")
    @ApiResponse(responseCode = "200", description = "Datos guardados",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ProfileResponse.class)))
    @ApiResponse(responseCode = "400", description = "Celular, documento o COP con formato inválido",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @PutMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProfileResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ProfileResponse.from(
            service.update(OrthodonticRecordsController.currentActor().userId(), request.toContact())));
    }
}
