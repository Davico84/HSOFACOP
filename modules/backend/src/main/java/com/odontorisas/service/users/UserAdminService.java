package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.OrthodonticRecordRepository;
import com.odontorisas.persistence.repository.RefreshTokenRepository;
import com.odontorisas.persistence.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;
import java.util.stream.Collectors;

/**
 * Gestión de cuentas por un administrador (capacidad {@code users}): listado paginado (con el cupo
 * de historias y cuántas creó cada cuenta), cambio de estado y de cupo de cuentas USER. La autorización (solo ADMIN) la aplica {@code UsersController}.
 */
@Service
public class UserAdminService {

    private static final Logger log = LoggerFactory.getLogger(UserAdminService.class);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final OrthodonticRecordRepository records;

    public UserAdminService(UserRepository users, RefreshTokenRepository refreshTokens, OrthodonticRecordRepository records) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.records = records;
    }

    /** Página de cuentas con sus historias creadas, contadas en una sola consulta (sin N+1). */
    @Transactional(readOnly = true)
    public Page<UserSummaryView> list(Pageable pageable) {
        Page<User> page = users.findAll(pageable);
        Map<Long, Long> counts = records.countByAuthorIds(page.map(User::getId).getContent()).stream()
            .collect(Collectors.toMap(OrthodonticRecordRepository.AuthorRecordCount::getAuthorId,
                OrthodonticRecordRepository.AuthorRecordCount::getTotal));
        return page.map(user -> toView(user, counts.getOrDefault(user.getId(), 0L)));
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
     * Cambia el estado con la fila bloqueada: 404 si no existe, 409 si no es USER, idempotente si
     * ya tiene ese estado. Al deshabilitar revoca (no borra) sus sesiones renovables en la misma
     * transacción. Reactivar no las restaura.
     */
    @Transactional
    public UserSummaryView changeStatus(Long id, UserStatus status) {
        User user = users.findByIdForUpdate(id).orElseThrow(UserNotFoundException::new);
        if (user.getRole() != Role.USER) {
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

    private UserSummaryView toView(User user) {
        return toView(user, records.countByAuthorId(user.getId()));
    }

    private static UserSummaryView toView(User user, long recordCount) {
        return new UserSummaryView(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getStatus(),
            user.getRecordQuota(), recordCount);
    }
}
