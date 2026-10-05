package com.odontorisas.service.dashboard;

import java.time.Instant;
import java.util.List;

/** Métricas globales de Inicio para el ADMIN. */
public record AdminDashboardView(
    Users users,
    long totalRecords,
    long recordsCreatedThisMonth,
    DashboardService.Completeness completeness,
    List<MonthItem> perMonth,
    List<AuthorItem> topAuthors,
    Quotas quotas,
    UnlockRequests unlockRequests) {

    public record Users(long total, long active, long disabled, long newThisMonth) {
    }

    /** Historias creadas en el mes ("2026-05"). */
    public record MonthItem(String month, long count) {
    }

    /** Cuenta USER con su cantidad de historias y promedio de pasos clínicos con datos (nulo = ninguna calculada). */
    public record AuthorItem(long userId, String fullName, String status, long records, Double averageFilledSteps) {
    }

    /** Cupos llenos o al 80 % o más: hasta 10 ({@code items}) y cuántos cumplen en total. */
    public record Quotas(long total, List<QuotaItem> items) {
    }

    public record QuotaItem(long userId, String fullName, long used, int limit, boolean reached) {
    }

    /** Solicitudes de desbloqueo pendientes: hasta 10 ({@code items}, más antiguas primero) y el total. */
    public record UnlockRequests(long total, List<UnlockRequestItem> items) {
    }

    public record UnlockRequestItem(long recordId, String recordNumber, String patientName, String authorName,
                                    Instant requestedAt, String reason) {
    }
}
