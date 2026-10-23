package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.infra.config.RecordsProperties;
import com.odontorisas.infra.security.TokenService;
import com.odontorisas.persistence.entity.PasswordResetToken;
import com.odontorisas.persistence.entity.Cohort;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.CohortRepository;
import com.odontorisas.persistence.repository.OrthodonticRecordRepository;
import com.odontorisas.persistence.repository.PasswordResetTokenRepository;
import com.odontorisas.persistence.repository.RefreshTokenRepository;
import com.odontorisas.persistence.repository.UserRepository;
import com.odontorisas.service.cohorts.CohortNotFoundException;
import com.odontorisas.service.cohorts.CohortRef;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.time.Instant;
import java.util.Collection;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Gestión de cuentas por un administrador (capacidades {@code users} y {@code cohorts}): listado
 * paginado (con el cupo de historias, cuántas creó cada cuenta y sus turmas), cambio de estado, de
 * cupo, de turma de alumno y de rol (alumno o coordinación). La autorización (solo ADMIN) la aplica
 * {@code UsersController}.
 */
@Service
public class UserAdminService {

    private static final Logger log = LoggerFactory.getLogger(UserAdminService.class);

    /** Vigencia del enlace de restablecimiento de contraseña. */
    static final Duration PASSWORD_RESET_TTL = Duration.ofHours(24);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final OrthodonticRecordRepository records;
    private final CohortRepository cohorts;
    private final RecordsProperties recordsProperties;
    private final PasswordResetTokenRepository resetTokens;
    private final TokenService tokenService;

    public UserAdminService(UserRepository users, RefreshTokenRepository refreshTokens, OrthodonticRecordRepository records,
                            CohortRepository cohorts, RecordsProperties recordsProperties,
                            PasswordResetTokenRepository resetTokens, TokenService tokenService) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.records = records;
        this.cohorts = cohorts;
        this.recordsProperties = recordsProperties;
        this.resetTokens = resetTokens;
        this.tokenService = tokenService;
    }

    /** Página de cuentas con sus historias creadas y sus turmas, contadas en consultas por página (sin N+1). */
    @Transactional(readOnly = true)
    public Page<UserSummaryView> list(Pageable pageable) {
        Page<User> page = users.findAll(pageable);
        List<Long> ids = page.map(User::getId).getContent();
        Map<Long, Long> counts = records.countByAuthorIds(ids).stream()
            .collect(Collectors.toMap(OrthodonticRecordRepository.AuthorRecordCount::getAuthorId,
                OrthodonticRecordRepository.AuthorRecordCount::getTotal));
        Map<Long, List<CohortRef>> coordinated = cohorts.findCoordinatorCohortsOf(ids).stream()
            .collect(Collectors.groupingBy(CohortRepository.CoordinatorCohortRow::getUserId,
                Collectors.mapping(r -> new CohortRef(r.getCohortId(), r.getCohortName()), Collectors.toList())));
        return page.map(user -> toView(user, counts.getOrDefault(user.getId(), 0L),
            coordinated.getOrDefault(user.getId(), List.of())));
    }

    /**
     * Asigna, cambia o quita ({@code null}) el cupo de historias de una cuenta USER, con la fila
     * bloqueada: 404 si no existe, 409 si no es USER. Puede quedar por debajo de las ya creadas.
     */
    @Transactional
    public UserSummaryView changeRecordQuota(Long id, Integer quota) {
        User user = users.findByIdForUpdate(id).orElseThrow(UserNotFoundException::new);
        if (user.getRole() != Role.USER) {
            throw new QuotaNotApplicableException();
        }
        user.setRecordQuota(quota);
        log.info("Cuenta {}: cupo de historias {}", id, quota == null ? "sin límite" : quota);
        return toView(user);
    }

    /**
     * Cambia el estado con la fila bloqueada: 404 si no existe, 409 si es ADMIN, idempotente si
     * ya tiene ese estado. Al deshabilitar revoca (no borra) sus sesiones renovables en la misma
     * transacción. Reactivar no las restaura. Una coordinación conserva sus turmas.
     */
    @Transactional
    public UserSummaryView changeStatus(Long id, UserStatus status) {
        User user = users.findByIdForUpdate(id).orElseThrow(UserNotFoundException::new);
        if (user.getRole() == Role.ADMIN) {
            throw new AccountStatusNotChangeableException();
        }
        if (user.getStatus() == status) {
            return toView(user);
        }
        user.setStatus(status);
        if (status == UserStatus.DISABLED) {
            int revoked = refreshTokens.revokeAllByUserId(id);
            log.info("Cuenta {} deshabilitada; sesiones renovables revocadas: {}", id, revoked);
        } else {
            log.info("Cuenta {} reactivada", id);
        }
        return toView(user);
    }

    /**
     * Asigna, cambia o quita ({@code null}) la turma de alumno de una cuenta USER, con la fila
     * bloqueada: 404 si la cuenta o la turma no existen, 409 si no es USER. No toca historias ni cupo.
     */
    @Transactional
    public UserSummaryView changeCohort(Long id, Long cohortId) {
        User user = users.findByIdForUpdate(id).orElseThrow(UserNotFoundException::new);
        if (user.getRole() != Role.USER) {
            throw new CohortNotApplicableException();
        }
        user.setCohort(cohortId == null ? null : cohorts.findById(cohortId).orElseThrow(CohortNotFoundException::new));
        log.info("Cuenta {}: turma {}", id, cohortId == null ? "ninguna" : cohortId);
        return toView(user);
    }

    /**
     * Cambia el rol entre alumno y coordinación, con la fila bloqueada (404 si no existe, 409 si es
     * ADMIN). A coordinación: exige al menos una turma (400) y una cuenta sin historias (409); pierde su
     * turma de alumno y su cupo, y sus turmas se reemplazan (también si ya era coordinación). A alumno:
     * pierde sus turmas de coordinación y, si era coordinación, recibe el cupo inicial configurado. El
     * rol nuevo llega al token en la siguiente renovación; las turmas se leen siempre de la base.
     */
    @Transactional
    public UserSummaryView changeRole(Long id, Role role, Collection<Long> cohortIds) {
        User user = users.findByIdForUpdate(id).orElseThrow(UserNotFoundException::new);
        if (user.getRole() == Role.ADMIN || role == Role.ADMIN) {
            throw new RoleNotChangeableException();
        }
        if (role == Role.COORDINATOR) {
            Set<Long> wanted = new LinkedHashSet<>(cohortIds);
            if (wanted.isEmpty()) {
                throw new CoordinatorWithoutCohortsException();
            }
            List<Cohort> found = cohorts.findAllById(wanted);
            if (found.size() != wanted.size()) {
                throw new CohortNotFoundException();
            }
            if (user.getRole() == Role.USER && records.countByAuthorId(user.getId()) > 0) {
                throw new AccountHasRecordsException();
            }
            user.setRole(Role.COORDINATOR);
            user.setCohort(null);
            user.setRecordQuota(null);
            user.getCoordinatorCohorts().clear();
            user.getCoordinatorCohorts().addAll(found);
            log.info("Cuenta {}: coordinación de las turmas {}", id, wanted);
        } else if (user.getRole() == Role.COORDINATOR) {
            user.setRole(Role.USER);
            user.getCoordinatorCohorts().clear();
            user.setCohort(null);
            user.setRecordQuota(recordsProperties.defaultQuota());
            log.info("Cuenta {}: vuelve a alumno", id);
        }
        users.flush();
        return toView(user);
    }

    /**
     * Enlace de restablecimiento de contraseña de un solo uso (24 h) para una cuenta USER o
     * COORDINATOR activa, con la fila bloqueada: 404 si no existe, 409 si es ADMIN o está
     * deshabilitada. Borra los enlaces sin usar de la cuenta (uno nuevo anula el anterior). El token
     * en claro solo sale en la respuesta; se guarda su hash. Nunca se escribe en el log.
     */
    @Transactional
    public PasswordResetLink createPasswordReset(Long adminId, Long id) {
        User user = users.findByIdForUpdate(id).orElseThrow(UserNotFoundException::new);
        if (user.getRole() == Role.ADMIN || user.getStatus() != UserStatus.ACTIVE) {
            throw new PasswordResetNotApplicableException();
        }
        resetTokens.deleteUnusedByUserId(id);
        String token = tokenService.generateOpaqueToken();
        Instant expiresAt = Instant.now().plus(PASSWORD_RESET_TTL);
        resetTokens.save(PasswordResetToken.builder()
            .user(user)
            .tokenHash(tokenService.hashOpaqueToken(token))
            .expiresAt(expiresAt)
            .createdBy(users.getReferenceById(adminId))
            .build());
        log.info("Cuenta {}: enlace de restablecimiento de contraseña generado por la cuenta {}", id, adminId);
        return new PasswordResetLink(token, expiresAt);
    }

    private UserSummaryView toView(User user) {
        List<CohortRef> coordinated = new HashSet<>(user.getCoordinatorCohorts()).stream()
            .sorted(Comparator.comparing(Cohort::getNameKey).thenComparing(Cohort::getId))
            .map(c -> new CohortRef(c.getId(), c.getName()))
            .toList();
        return toView(user, records.countByAuthorId(user.getId()), coordinated);
    }

    private static UserSummaryView toView(User user, long recordCount, List<CohortRef> coordinatorCohorts) {
        Cohort cohort = user.getCohort();
        return new UserSummaryView(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getStatus(),
            user.getRecordQuota(), recordCount, cohort == null ? null : new CohortRef(cohort.getId(), cohort.getName()),
            coordinatorCohorts, ContactData.of(user));
    }
}
