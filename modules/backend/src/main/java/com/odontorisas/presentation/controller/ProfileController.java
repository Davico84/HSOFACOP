package com.odontorisas.presentation.controller;

import com.odontorisas.infra.security.RefreshCookieFactory;
import com.odontorisas.presentation.dto.AuthResponse;
import com.odontorisas.presentation.dto.ChangePasswordRequest;
import com.odontorisas.presentation.dto.ProfileResponse;
import com.odontorisas.presentation.dto.UpdateProfileRequest;
import com.odontorisas.presentation.dto.ValidationProblem;
import com.odontorisas.service.auth.AuthResult;
import com.odontorisas.service.auth.AuthService;
import com.odontorisas.service.users.ProfileService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * "Mis datos" y cambio de contraseña (capacidades {@code users} y {@code authentication}): cualquier
 * cuenta autenticada, solo la propia (el id sale del token). Separado de {@code UsersController}, que es solo para el ADMIN. Los 401/500 transversales
 * los documenta {@code OpenApiErrorsConfig}.
 */
@RestController
@RequestMapping("/api/me")
@Tag(name = "profile", description = "Datos de la propia cuenta")
@PreAuthorize("isAuthenticated()")
public class ProfileController {

    private final ProfileService service;
    private final AuthService authService;
    private final RefreshCookieFactory refreshCookieFactory;

    public ProfileController(ProfileService service, AuthService authService, RefreshCookieFactory refreshCookieFactory) {
        this.service = service;
        this.authService = authService;
        this.refreshCookieFactory = refreshCookieFactory;
    }

    @Operation(operationId = "getMyProfile", summary = "Datos de la cuenta autenticada")
    @ApiResponse(responseCode = "200", description = "Datos de la cuenta",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ProfileResponse.class)))
    @GetMapping(value = "/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProfileResponse> getMyProfile() {
        return ResponseEntity.ok(ProfileResponse.from(service.get(OrthodonticRecordsController.currentActor().userId())));
    }

    @Operation(operationId = "updateMyProfile", summary = "Cambiar el celular, el documento y el COP de la cuenta autenticada")
    @ApiResponse(responseCode = "200", description = "Datos guardados",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = ProfileResponse.class)))
    @ApiResponse(responseCode = "400", description = "Celular, documento o COP con formato inválido",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @PutMapping(value = "/profile", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<ProfileResponse> updateMyProfile(@Valid @RequestBody UpdateProfileRequest request) {
        return ResponseEntity.ok(ProfileResponse.from(
            service.update(OrthodonticRecordsController.currentActor().userId(), request.toContact())));
    }

    @Operation(operationId = "changeMyPassword",
        summary = "Cambiar la contraseña de la cuenta autenticada (cierra sus demás sesiones y renueva la actual)")
    @ApiResponse(responseCode = "200", description = "Contraseña cambiada; sesión nueva (y su cookie de refresco)",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "400", description = "Datos inválidos, contraseña actual incorrecta (wrong-current-password), cuenta bloqueada por intentos (password-change-locked) o nueva igual a la actual (same-password)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @PutMapping(value = "/password", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AuthResponse> changeMyPassword(@Valid @RequestBody ChangePasswordRequest request) {
        AuthResult result = authService.changePassword(OrthodonticRecordsController.currentActor().userId(),
            request.currentPassword(), request.newPassword());
        ResponseCookie cookie = refreshCookieFactory.create(result.refreshToken(), result.refreshExpiresAt());
        return ResponseEntity.ok().header(HttpHeaders.SET_COOKIE, cookie.toString()).body(AuthResponse.from(result));
    }
}
