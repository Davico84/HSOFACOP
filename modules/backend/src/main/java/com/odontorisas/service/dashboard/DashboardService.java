package com.odontorisas.service.dashboard;

import com.odontorisas.persistence.repository.DashboardQueries;
import com.odontorisas.persistence.repository.DashboardQueries.MonthCount;
import com.odontorisas.persistence.repository.DashboardQueries.RecordTotals;
import com.odontorisas.service.records.FilledSteps;
import com.odontorisas.service.records.OrthodonticRecordService;
import com.odontorisas.service.records.RecordActor;
import com.odontorisas.service.records.RecordQuotaView;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.Clock;
import java.time.Instant;
import java.time.YearMonth;
import java.time.ZoneId;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;
import java.util.stream.IntStream;

/**
 * Métricas de Inicio. "Este mes" y los últimos 6 meses se cortan en la zona del {@link Clock} de
 * la app: los límites se calculan aquí como instantes y la agrupación por mes usa la misma zona.
 */
@Service
public class DashboardService {

    static final int RESUME_LIMIT = 5;
    static final int TOP_AUTHORS_LIMIT = 5;
    static final int QUOTAS_LIMIT = 10;
    static final int MONTHS = 6;
    private static final DateTimeFormatter MONTH = DateTimeFormatter.ofPattern("yyyy-MM");

    private final DashboardQueries queries;
    private final OrthodonticRecordService records;
    private final Clock clock;

    public DashboardService(DashboardQueries queries, OrthodonticRecordService records, Clock clock) {
        this.queries = queries;
        this.records = records;
        this.clock = clock;
    }

    /** Métricas del tratante autenticado: solo sus historias. */
    @Transactional(readOnly = true)
    public UserDashboardView forUser(RecordActor actor) {
        RecordTotals totals = queries.recordTotals(actor.userId(), monthStart(currentMonth()));
        RecordQuotaView quota = records.quota(actor);
        List<UserDashboardView.EmptyStep> emptySteps = IntStream.rangeClosed(1, FilledSteps.CLINICAL_STEPS)
            .mapToObj(step -> new UserDashboardView.EmptyStep(step, totals.emptyByStep().get(step - 1)))
            .sorted(Comparator.comparingLong(UserDashboardView.EmptyStep::count).reversed()
                .thenComparingInt(UserDashboardView.EmptyStep::step))
            .toList();
        List<UserDashboardView.ResumeItem> resume = queries.resume(actor.userId(), RESUME_LIMIT).stream()
            .map(r -> new UserDashboardView.ResumeItem(r.id(), r.recordNumber(), r.patientName(), r.lastStep(),
                r.filledSteps() == null ? null : Integer.bitCount(r.filledSteps() & FilledSteps.CLINICAL_MASK),
                r.updatedAt()))
            .toList();
        return new UserDashboardView(totals.total(), totals.createdThisMonth(), quota,
            new Completeness(totals.complete(), totals.inProgress(), totals.notComputed(),
                round(totals.averageFilled())),
            new UserDashboardView.Missing(totals.withoutDocument(), totals.withoutBirthDate(),
                totals.withoutTreatmentStart(), emptySteps),
            resume);
    }

    /** Métricas globales para el ADMIN. */
    @Transactional(readOnly = true)
    public AdminDashboardView forAdmin() {
        YearMonth current = currentMonth();
        YearMonth first = current.minusMonths(MONTHS - 1L);
        RecordTotals totals = queries.recordTotals(null, monthStart(current));
        Map<String, Long> perMonthFound = queries.recordsPerMonth(monthStart(first), zone().getId()).stream()
            .collect(Collectors.toMap(MonthCount::month, MonthCount::count));
        List<AdminDashboardView.MonthItem> perMonth = new ArrayList<>();
        for (int i = 0; i < MONTHS; i++) {
            String month = first.plusMonths(i).format(MONTH);
            perMonth.add(new AdminDashboardView.MonthItem(month, perMonthFound.getOrDefault(month, 0L)));
        }
        var users = queries.userTotals(monthStart(current));
        List<AdminDashboardView.AuthorItem> topAuthors = queries.topAuthors(TOP_AUTHORS_LIMIT).stream()
            .map(a -> new AdminDashboardView.AuthorItem(a.userId(), a.fullName(), a.status(), a.records(),
                round(a.averageFilled())))
            .toList();
        var quotaRows = queries.quotasNearLimit(QUOTAS_LIMIT);
        List<AdminDashboardView.QuotaItem> quotaItems = quotaRows.stream()
            .map(q -> new AdminDashboardView.QuotaItem(q.userId(), q.fullName(), q.used(), q.quota(),
                q.used() >= q.quota()))
            .toList();
        long quotaTotal = quotaRows.isEmpty() ? 0 : quotaRows.getFirst().total();
        return new AdminDashboardView(
            new AdminDashboardView.Users(users.total(), users.active(), users.disabled(), users.newThisMonth()),
            totals.total(), totals.createdThisMonth(),
            new Completeness(totals.complete(), totals.inProgress(), totals.notComputed(),
                round(totals.averageFilled())),
            perMonth, topAuthors, new AdminDashboardView.Quotas(quotaTotal, quotaItems));
    }

    private ZoneId zone() {
        return clock.getZone();
    }

    private YearMonth currentMonth() {
        return YearMonth.now(clock);
    }

    private Instant monthStart(YearMonth month) {
        return month.atDay(1).atStartOfDay(zone()).toInstant();
    }

    /** Promedio con un decimal (nulo si no hay historias calculadas). */
    private static Double round(BigDecimal average) {
        return average == null ? null : average.setScale(1, RoundingMode.HALF_UP).doubleValue();
    }

    /** Completas (pasos 1–7 con datos), en progreso, sin calcular y promedio de pasos clínicos. */
    public record Completeness(long complete, long inProgress, long notComputed, Double averageFilledSteps) {
    }
}
