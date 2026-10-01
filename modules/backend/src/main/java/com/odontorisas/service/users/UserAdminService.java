package com.odontorisas.service.users;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.RefreshTokenRepository;
import com.odontorisas.persistence.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/**
 * Gestión de cuentas por un administrador (capacidad {@code users}): listado paginado y cambio
 * de estado de cuentas USER. La autorización (solo ADMIN) la aplica {@code UsersController}.
 */
@Service
public class UserAdminService {

    private static final Logger log = LoggerFactory.getLogger(UserAdminService.class);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;

    public UserAdminService(UserRepository users, RefreshTokenRepository refreshTokens) {
        this.users = users;
        this.refreshTokens = refreshTokens;
    }

    @Transactional(readOnly = true)
    public Page<UserSummaryView> list(Pageable pageable) {
        return users.findAll(pageable).map(UserAdminService::toView);
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

    private static UserSummaryView toView(User user) {
        return new UserSummaryView(user.getId(), user.getEmail(), user.getFullName(), user.getRole(), user.getStatus());
    }
}
