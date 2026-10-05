package com.odontorisas.persistence.repository;

import org.springframework.jdbc.core.namedparam.MapSqlParameterSource;
import org.springframework.jdbc.core.namedparam.NamedParameterJdbcTemplate;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Consultas agregadas de las métricas de Inicio, en SQL nativo (PostgreSQL): JPQL no tiene
 * operadores de bits. Nunca leen el contenido clínico ({@code content}). Los pasos con datos son
 * una máscara ({@code filled_steps}, bit n-1 = paso n); los clínicos son los pasos 1–7
 * ({@code & 127}) y una historia sin máscara está "sin calcular".
 */
@Repository
public class DashboardQueries {

    private static final String CLINICAL = "(filled_steps & 127)";
    private static final String FILLED_COUNT = "bit_count(" + CLINICAL + "::bit(8))";

    private final NamedParameterJdbcTemplate jdbc;

    public DashboardQueries(NamedParameterJdbcTemplate jdbc) {
        this.jdbc = jdbc;
    }

    /** Totales de historias (de un autor, o de todos si {@code authorId} es nulo). */
    public RecordTotals recordTotals(Long authorId, Instant monthStart) {
        StringBuilder sql = new StringBuilder("SELECT count(*) AS total,"
            + " count(*) FILTER (WHERE created_at >= :monthStart) AS created_this_month,"
            + " count(*) FILTER (WHERE filled_steps IS NOT NULL AND " + CLINICAL + " = 127) AS complete,"
            + " count(*) FILTER (WHERE filled_steps IS NOT NULL AND " + CLINICAL + " <> 127) AS in_progress,"
            + " count(*) FILTER (WHERE filled_steps IS NULL) AS not_computed,"
            + " avg(" + FILLED_COUNT + ") FILTER (WHERE filled_steps IS NOT NULL) AS average_filled,"
            + " count(*) FILTER (WHERE document_number IS NULL) AS without_document,"
            + " count(*) FILTER (WHERE birth_date IS NULL) AS without_birth_date,"
            + " count(*) FILTER (WHERE treatment_start_date IS NULL) AS without_treatment_start");
        for (int step = 1; step <= 7; step++) {
            sql.append(", count(*) FILTER (WHERE filled_steps IS NOT NULL AND filled_steps & ")
                .append(1 << (step - 1)).append(" = 0) AS empty_").append(step);
        }
        sql.append(" FROM orthodontic_records");
        MapSqlParameterSource params = new MapSqlParameterSource("monthStart", Timestamp.from(monthStart));
        if (authorId != null) {
            sql.append(" WHERE author_id = :authorId");
            params.addValue("authorId", authorId);
        }
        return jdbc.queryForObject(sql.toString(), params, (rs, i) -> {
            List<Long> empty = new ArrayList<>();
            for (int step = 1; step <= 7; step++) {
                empty.add(rs.getLong("empty_" + step));
            }
            return new RecordTotals(rs.getLong("total"), rs.getLong("created_this_month"), rs.getLong("complete"),
                rs.getLong("in_progress"), rs.getLong("not_computed"), rs.getBigDecimal("average_filled"),
                rs.getLong("without_document"), rs.getLong("without_birth_date"),
                rs.getLong("without_treatment_start"), empty);
        });
    }

    /** Historias no completas (en progreso o sin calcular) de un autor, más recientes primero. */
    public List<ResumeRow> resume(long authorId, int limit) {
        String sql = "SELECT id, record_number, patient_name, last_step, filled_steps, updated_at"
            + " FROM orthodontic_records WHERE author_id = :authorId"
            + " AND (filled_steps IS NULL OR " + CLINICAL + " <> 127)"
            + " ORDER BY updated_at DESC, id DESC LIMIT :limit";
        return jdbc.query(sql, new MapSqlParameterSource("authorId", authorId).addValue("limit", limit),
            (rs, i) -> new ResumeRow(rs.getLong("id"), rs.getString("record_number"), rs.getString("patient_name"),
                nullableInt(rs, "last_step"), nullableInt(rs, "filled_steps"),
                rs.getTimestamp("updated_at").toInstant()));
    }

    /** Cuentas por estado y nuevas desde {@code monthStart}. */
    public UserTotals userTotals(Instant monthStart) {
        String sql = "SELECT count(*) AS total,"
            + " count(*) FILTER (WHERE status = 'ACTIVE') AS active,"
            + " count(*) FILTER (WHERE status = 'DISABLED') AS disabled,"
            + " count(*) FILTER (WHERE created_at >= :monthStart) AS new_this_month FROM users";
        return jdbc.queryForObject(sql, new MapSqlParameterSource("monthStart", Timestamp.from(monthStart)),
            (rs, i) -> new UserTotals(rs.getLong("total"), rs.getLong("active"), rs.getLong("disabled"),
                rs.getLong("new_this_month")));
    }

    /** Historias creadas por mes ("2026-05") desde {@code from}, con el mes en la zona {@code zone}. */
    public List<MonthCount> recordsPerMonth(Instant from, String zone) {
        String sql = "SELECT to_char(date_trunc('month', created_at AT TIME ZONE :zone), 'YYYY-MM') AS month,"
            + " count(*) AS total FROM orthodontic_records WHERE created_at >= :from GROUP BY 1 ORDER BY 1";
        return jdbc.query(sql, new MapSqlParameterSource("zone", zone).addValue("from", Timestamp.from(from)),
            (rs, i) -> new MonthCount(rs.getString("month"), rs.getLong("total")));
    }

    /** Cuentas USER con más historias (activas y deshabilitadas), con su promedio de pasos clínicos. */
    public List<AuthorRow> topAuthors(int limit) {
        String sql = "SELECT u.id, u.full_name, u.status, count(r.id) AS records,"
            + " avg(bit_count((r.filled_steps & 127)::bit(8))) FILTER (WHERE r.filled_steps IS NOT NULL) AS average_filled"
            + " FROM users u JOIN orthodontic_records r ON r.author_id = u.id"
            + " WHERE u.role = 'USER' GROUP BY u.id, u.full_name, u.status"
            + " ORDER BY records DESC, u.full_name ASC, u.id ASC LIMIT :limit";
        return jdbc.query(sql, new MapSqlParameterSource("limit", limit),
            (rs, i) -> new AuthorRow(rs.getLong("id"), rs.getString("full_name"), rs.getString("status"),
                rs.getLong("records"), rs.getBigDecimal("average_filled")));
    }

    /**
     * Cuentas USER activas con cupo lleno (incluido cupo 0 o cupo reducido por debajo de lo creado)
     * o al 80 % o más: llenas primero, luego por uso relativo (sin dividir por cero) y nombre.
     * {@code total} es la cantidad de cuentas que cumplen la condición (antes del límite).
     */
    public List<QuotaRow> quotasNearLimit(int limit) {
        String sql = "WITH q AS (SELECT u.id, u.full_name, u.record_quota AS quota,"
            + " (SELECT count(*) FROM orthodontic_records r WHERE r.author_id = u.id) AS used"
            + " FROM users u WHERE u.role = 'USER' AND u.status = 'ACTIVE' AND u.record_quota IS NOT NULL)"
            + " SELECT id, full_name, used, quota, count(*) OVER () AS total FROM q"
            + " WHERE used >= quota OR used >= ceil(0.8 * quota)"
            + " ORDER BY (used >= quota) DESC,"
            + " CASE WHEN quota = 0 THEN 1 ELSE used::numeric / quota END DESC, full_name ASC, id ASC"
            + " LIMIT :limit";
        return jdbc.query(sql, new MapSqlParameterSource("limit", limit),
            (rs, i) -> new QuotaRow(rs.getLong("id"), rs.getString("full_name"), rs.getLong("used"),
                rs.getInt("quota"), rs.getLong("total")));
    }

    private static Integer nullableInt(ResultSet rs, String column) throws SQLException {
        int value = rs.getInt(column);
        return rs.wasNull() ? null : value;
    }

    /** Totales de historias; {@code emptyByStep} = historias calculadas con cada paso 1–7 vacío. */
    public record RecordTotals(long total, long createdThisMonth, long complete, long inProgress, long notComputed,
                               BigDecimal averageFilled, long withoutDocument, long withoutBirthDate,
                               long withoutTreatmentStart, List<Long> emptyByStep) {
    }

    public record ResumeRow(long id, String recordNumber, String patientName, Integer lastStep, Integer filledSteps,
                            Instant updatedAt) {
    }

    public record UserTotals(long total, long active, long disabled, long newThisMonth) {
    }

    public record MonthCount(String month, long count) {
    }

    public record AuthorRow(long userId, String fullName, String status, long records, BigDecimal averageFilled) {
    }

    public record QuotaRow(long userId, String fullName, long used, int quota, long total) {
    }
}
