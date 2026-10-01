package com.odontorisas.service.auth;

import com.odontorisas.infra.security.LoginLockoutProperties;
import com.odontorisas.persistence.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

/**
 * Registra los logins fallidos en su propia transacción: el login lanza 401 justo
 * después, y el incremento tiene que sobrevivir a ese rechazo. Es un bean aparte
 * porque la auto-invocación no pasa por el proxy transaccional.
 */
@Service
public class LoginAttemptService {

    private final UserRepository users;
    private final LoginLockoutProperties lockout;

    public LoginAttemptService(UserRepository users, LoginLockoutProperties lockout) {
        this.users = users;
        this.lockout = lockout;
    }

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void recordFailure(Long userId, Instant now) {
        users.registerFailedLogin(userId, now, now.plus(lockout.window()), lockout.maxAttempts());
    }
}
