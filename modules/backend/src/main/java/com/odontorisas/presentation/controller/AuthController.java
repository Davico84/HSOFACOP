package com.odontorisas.presentation.controller;

import com.odontorisas.infra.security.RefreshCookieFactory;
import com.odontorisas.presentation.dto.ApiProblem;
import com.odontorisas.presentation.dto.AuthResponse;
import com.odontorisas.presentation.dto.LoginRequest;
import com.odontorisas.presentation.dto.RegisterRequest;
import com.odontorisas.presentation.dto.ValidationProblem;
import com.odontorisas.service.auth.AuthResult;
import com.odontorisas.service.auth.AuthService;
import com.odontorisas.service.auth.RegisterCommand;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseCookie;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CookieValue;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/**
 * Endpoints de autenticación. El access token va en el cuerpo; el refresh token
 * se emite/borra como cookie HttpOnly ({@link RefreshCookieFactory}).
 *
 * <p>Cada operación declara su status de éxito real y sus errores propios: al declarar un
 * {@code @ApiResponse}, springdoc deja de inferir la respuesta de éxito. Los transversales
 * (500, 401 en rutas privadas, 403 con {@code @PreAuthorize}) los añade {@code OpenApiErrorsConfig}.
 */
@RestController
@RequestMapping("/auth")
@Tag(name = "auth", description = "Autenticación")
public class AuthController {

    private final AuthService authService;
    private final RefreshCookieFactory refreshCookieFactory;

    public AuthController(AuthService authService, RefreshCookieFactory refreshCookieFactory) {
        this.authService = authService;
        this.refreshCookieFactory = refreshCookieFactory;
    }

    @Operation(operationId = "register", summary = "Registrar una cuenta e iniciar sesión")
    @ApiResponse(responseCode = "201", description = "Cuenta creada; sesión iniciada",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "400", description = "Datos inválidos",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "409", description = "El correo ya está registrado",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterCommand command = new RegisterCommand(request.email(), request.password(), request.fullName());
        return authResponse(authService.register(command), HttpStatus.CREATED);
    }

    @Operation(operationId = "login", summary = "Iniciar sesión")
    @ApiResponse(responseCode = "200", description = "Sesión iniciada",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "400", description = "Datos inválidos",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ValidationProblem.class)))
    @ApiResponse(responseCode = "401", description = "Credenciales inválidas o cuenta bloqueada temporalmente",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "403", description = "Cuenta deshabilitada por un administrador",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return authResponse(authService.login(request.email(), request.password()), HttpStatus.OK);
    }

    @Operation(operationId = "refresh", summary = "Renovar la sesión con la cookie de refresco")
    @ApiResponse(responseCode = "200", description = "Sesión renovada",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = AuthResponse.class)))
    @ApiResponse(responseCode = "401", description = "Refresco ausente, inválido o expirado",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @ApiResponse(responseCode = "403", description = "Cuenta deshabilitada por un administrador",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PostMapping("/refresh")
    public ResponseEntity<AuthResponse> refresh(
            @CookieValue(name = "${app.security.cookie.refresh-name}", required = false) String refreshToken) {
        return authResponse(authService.refresh(refreshToken), HttpStatus.OK);
    }

    @Operation(operationId = "logout", summary = "Cerrar la sesión")
    @ApiResponse(responseCode = "204", description = "Sesión cerrada")
    @PostMapping("/logout")
    public ResponseEntity<Void> logout(
            @CookieValue(name = "${app.security.cookie.refresh-name}", required = false) String refreshToken) {
        authService.logout(refreshToken);
        return ResponseEntity.noContent()
            .header(HttpHeaders.SET_COOKIE, refreshCookieFactory.clear().toString())
            .build();
    }

    private ResponseEntity<AuthResponse> authResponse(AuthResult result, HttpStatus status) {
        ResponseCookie cookie = refreshCookieFactory.create(result.refreshToken(), result.refreshExpiresAt());
        return ResponseEntity.status(status)
            .header(HttpHeaders.SET_COOKIE, cookie.toString())
            .body(AuthResponse.from(result));
    }
}
