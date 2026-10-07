package com.odontorisas.presentation.dto;

import com.odontorisas.common.UserStatus;
import com.odontorisas.service.dashboard.AdminDashboardView;
import io.swagger.v3.oas.annotations.media.Schema;

import java.time.Instant;
import java.util.List;

import static io.swagger.v3.oas.annotations.media.Schema.RequiredMode.REQUIRED;

/** Métricas globales de Inicio para el ADMIN (solo id y nombre de las cuentas, nunca el correo). */
public record AdminDashboardResponse(
    @Schema(requiredMode = REQUIRED) Users users,
    @Schema(requiredMode = REQUIRED) Records records,
    @Schema(requiredMode = REQUIRED, description = "Cuentas USER con más historias (hasta 5)") List<AuthorItem> topAuthors,
    @Schema(requiredMode = REQUIRED) Quotas quotas,
    @Schema(requiredMode = REQUIRED) UnlockRequests unlockRequests) {

    @Schema(name = "AdminDashboardUsers")
    public record Users(
        @Schema(requiredMode = REQUIRED) long total,
        @Schema(requiredMode = REQUIRED) long active,
        @Schema(requiredMode = REQUIRED) long disabled,
        @Schema(requiredMode = REQUIRED, description = "Creadas en el mes en curso") long newThisMonth) {
    }

    /** Todas las historias (también las de autor ADMIN o de cuentas deshabilitadas). */
    @Schema(name = "AdminDashboardRecords")
    public record Records(
        @Schema(requiredMode = REQUIRED) long total,
        @Schema(requiredMode = REQUIRED) long createdThisMonth,
        @Schema(requiredMode = REQUIRED, description = "Pasos clínicos 1–7 con datos") long complete,
        @Schema(requiredMode = REQUIRED) long inProgress,
        @Schema(requiredMode = REQUIRED) long notComputed,
        @Schema(requiredMode = REQUIRED, description = "Últimos 6 meses, del más antiguo al actual") List<MonthItem> perMonth) {
    }

    @Schema(name = "DashboardMonthCount")
    public record MonthItem(
        @Schema(requiredMode = REQUIRED, example = "2026-05") String month,
        @Schema(requiredMode = REQUIRED) long count) {
    }

    @Schema(name = "DashboardTopAuthor")
    public record AuthorItem(
        @Schema(requiredMode = REQUIRED) long userId,
        @Schema(requiredMode = REQUIRED) String fullName,
        @Schema(requiredMode = REQUIRED) UserStatus status,
        @Schema(requiredMode = REQUIRED) long records,
        @Schema(description = "Promedio de pasos clínicos con datos; vacío si ninguna calculada", nullable = true)
        Double averageFilledSteps) {
    }

    @Schema(name = "AdminDashboardQuotas")
    public record Quotas(
        @Schema(requiredMode = REQUIRED, description = "Cuentas con cupo lleno o al 80 % o más") long total,
        @Schema(requiredMode = REQUIRED, description = "Las 10 más cerca del tope, llenas primero") List<QuotaItem> items) {
    }

    @Schema(name = "DashboardQuotaAlert")
    public record QuotaItem(
        @Schema(requiredMode = REQUIRED) long userId,
        @Schema(requiredMode = REQUIRED) String fullName,
        @Schema(requiredMode = REQUIRED) long used,
        @Schema(requiredMode = REQUIRED) int limit,
        @Schema(requiredMode = REQUIRED, description = "Cupo lleno (también si lo creado lo supera)") boolean reached) {
    }

    @Schema(name = "AdminDashboardUnlockRequests")
    public record UnlockRequests(
        @Schema(requiredMode = REQUIRED, description = "Solicitudes de desbloqueo pendientes") long total,
        @Schema(requiredMode = REQUIRED, description = "Las 10 más antiguas") List<UnlockRequestItem> items) {
    }

    @Schema(name = "DashboardUnlockRequest")
    public record UnlockRequestItem(
        @Schema(requiredMode = REQUIRED) long recordId,
        @Schema(requiredMode = REQUIRED, example = "AOC-0015") String recordNumber,
        @Schema(requiredMode = REQUIRED) String patientName,
        @Schema(requiredMode = REQUIRED, description = "Tratante (autor de la historia)") String authorName,
        @Schema(requiredMode = REQUIRED) Instant requestedAt,
        @Schema(requiredMode = REQUIRED) String reason) {
    }

    public static AdminDashboardResponse from(AdminDashboardView v) {
        var c = v.completeness();
        return new AdminDashboardResponse(
            new Users(v.users().total(), v.users().active(), v.users().disabled(), v.users().newThisMonth()),
            new Records(v.totalRecords(), v.recordsCreatedThisMonth(), c.complete(), c.inProgress(), c.notComputed(),
                v.perMonth().stream().map(m -> new MonthItem(m.month(), m.count())).toList()),
            v.topAuthors().stream().map(a -> new AuthorItem(a.userId(), a.fullName(), UserStatus.valueOf(a.status()),
                a.records(), a.averageFilledSteps())).toList(),
            new Quotas(v.quotas().total(), v.quotas().items().stream()
                .map(q -> new QuotaItem(q.userId(), q.fullName(), q.used(), q.limit(), q.reached())).toList()),
            new UnlockRequests(v.unlockRequests().total(), v.unlockRequests().items().stream()
                .map(r -> new UnlockRequestItem(r.recordId(), r.recordNumber(), r.patientName(), r.authorName(),
                    r.requestedAt(), r.reason())).toList()));
    }
}
