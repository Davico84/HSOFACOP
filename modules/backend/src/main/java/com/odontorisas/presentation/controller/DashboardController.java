package com.odontorisas.presentation.controller;

import com.odontorisas.presentation.dto.AdminDashboardResponse;
import com.odontorisas.presentation.dto.ApiProblem;
import com.odontorisas.presentation.dto.UserDashboardResponse;
import com.odontorisas.service.dashboard.DashboardService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.media.Content;
import io.swagger.v3.oas.annotations.media.Schema;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.tags.Tag;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** Métricas de Inicio: las del tratante (solo USER) y las globales (solo ADMIN). */
@RestController
@RequestMapping("/api/dashboard")
@Tag(name = "dashboard", description = "Métricas de Inicio")
public class DashboardController {

    private final DashboardService service;

    public DashboardController(DashboardService service) {
        this.service = service;
    }

    @Operation(operationId = "getMyDashboard", summary = "Métricas del tratante autenticado (sus historias)")
    @ApiResponse(responseCode = "200", description = "Métricas",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = UserDashboardResponse.class)))
    @ApiResponse(responseCode = "403", description = "Solo para cuentas USER (el ADMIN ve las globales)",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PreAuthorize("hasRole('USER')")
    @GetMapping(value = "/me", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<UserDashboardResponse> getMyDashboard() {
        return ResponseEntity.ok(UserDashboardResponse.from(
            service.forUser(OrthodonticRecordsController.currentActor())));
    }

    @Operation(operationId = "getAdminDashboard", summary = "Métricas globales (solo ADMIN)")
    @ApiResponse(responseCode = "200", description = "Métricas",
        content = @Content(mediaType = MediaType.APPLICATION_JSON_VALUE, schema = @Schema(implementation = AdminDashboardResponse.class)))
    @ApiResponse(responseCode = "403", description = "Solo para ADMIN",
        content = @Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class)))
    @PreAuthorize("hasRole('ADMIN')")
    @GetMapping(value = "/admin", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<AdminDashboardResponse> getAdminDashboard() {
        return ResponseEntity.ok(AdminDashboardResponse.from(service.forAdmin()));
    }
}
