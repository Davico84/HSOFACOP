package com.odontorisas.service.auth;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.infra.security.TokenService;
import com.odontorisas.persistence.entity.RefreshToken;
import com.odontorisas.persistence.entity.User;
import com.odontorisas.persistence.repository.RefreshTokenRepository;
import com.odontorisas.persistence.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.PlatformTransactionManager;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionOperations;
import org.springframework.transaction.support.TransactionTemplate;

import java.time.Instant;

/**
 * Casos de uso de autenticación: registro, login, renovación (con rotación del
 * refresh) y logout (revocación). El access token es stateless; el refresh se
 * persiste hasheado para poder rotarlo e invalidarlo de verdad.
 */
@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);

    private final UserRepository users;
    private final RefreshTokenRepository refreshTokens;
    private final PasswordEncoder passwordEncoder;
    private final TokenService tokenService;
    private final LoginAttemptService loginAttempts;
    private final TransactionOperations tx;

    @Autowired
    public AuthService(UserRepository users,
                       RefreshTokenRepository refreshTokens,
                       PasswordEncoder passwordEncoder,
                       TokenService tokenService,
                       LoginAttemptService loginAttempts,
                       PlatformTransactionManager transactionManager) {
        this(users, refreshTokens, passwordEncoder, tokenService, loginAttempts,
            new TransactionTemplate(transactionManager));
    }

    AuthService(UserRepository users,
                RefreshTokenRepository refreshTokens,
                PasswordEncoder passwordEncoder,
                TokenService tokenService,
                LoginAttemptService loginAttempts,
                TransactionOperations tx) {
        this.users = users;
        this.refreshTokens = refreshTokens;
        this.passwordEncoder = passwordEncoder;
        this.tokenService = tokenService;
        this.loginAttempts = loginAttempts;
        this.tx = tx;
    }

    @Transactional
    public AuthResult register(RegisterCommand cmd) {
        if (users.existsByEmail(cmd.email())) {
            throw new EmailAlreadyExistsException(cmd.email());
        }
        User user = users.save(User.builder()
            .email(cmd.email())
            .passwordHash(passwordEncoder.encode(cmd.password()))
            .role(Role.USER)
            .fullName(cmd.fullName())
            .build());
        return issueTokens(user);
    }

    /**
     * Login con bloqueo temporal por intentos fallidos. <b>No es {@code @Transactional}
     * a propósito</b>: cada paso usa su propia transacción corta, así una petición
     * nunca retiene dos conexiones (la del login + la del fallo) ni ninguna durante
     * BCrypt; con una transacción envolvente, unos pocos fallos simultáneos agotarían
     * el pool. Todos los rechazos lanzan la misma {@link InvalidCredentialsException}.
     */
    public AuthResult login(String email, String rawPassword) {
        Instant now = Instant.now();
        User user = users.findByEmail(email).orElseThrow(InvalidCredentialsException::new);
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(now)) {
            // Sin BCrypt y sin tocar el contador: insistir no prolonga el bloqueo.
            log.warn("Login rechazado: cuenta {} bloqueada temporalmente", user.getId());
            throw new InvalidCredentialsException();
        }
        if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
            // También si la cuenta está deshabilitada: cuenta como intento fallido.
            loginAttempts.recordFailure(user.getId(), now);
            throw new InvalidCredentialsException();
        }
        if (user.getStatus() == UserStatus.DISABLED) {
            // Solo tras acertar la contraseña (no revela qué correos existen) y sin tocar el contador.
            log.warn("Login rechazado: cuenta {} deshabilitada", user.getId());
            throw new AccountDisabledException();
        }
        return tx.execute(status -> completeLogin(user));
    }

    /** Reset condicional + emisión de tokens en una sola transacción. */
    private AuthResult completeLogin(User user) {
        // El bloqueo y el estado se leyeron al inicio; si otra petición bloqueó o deshabilitó
        // la cuenta durante BCrypt, el reset no afecta filas y NUNCA se emiten tokens.
        if (users.resetFailedLogins(user.getId(), Instant.now()) == 0) {
            log.warn("Login rechazado: cuenta {} bloqueada o deshabilitada durante el login", user.getId());
            throw new InvalidCredentialsException();
        }
        return issueTokens(user);
    }

    @Transactional
    public AuthResult refresh(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            throw new InvalidRefreshTokenException();
        }
        String tokenHash = tokenService.hashRefreshToken(rawRefreshToken);
        // Lectura sin bloqueo pesimista (no añadir FOR UPDATE: lo exige el diseño de users).
        RefreshToken stored = refreshTokens.findByTokenHash(tokenHash)
            .orElseThrow(InvalidRefreshTokenException::new);
        if (stored.getUser().getStatus() == UserStatus.DISABLED) {
            // Antes de revocado/expirado: así la sesión se cierra explicando el motivo.
            throw new AccountDisabledException();
        }
        if (stored.isRevoked() || stored.getExpiresAt().isBefore(Instant.now())) {
            throw new InvalidRefreshTokenException();
        }
        User user = stored.getUser();
        // Rotación atómica: consume el token con un bulk delete. Si otra petición
        // concurrente ya lo consumió (0 filas), esta pierde la carrera → 401 (no 500).
        if (refreshTokens.deleteByTokenHash(tokenHash) == 0) {
            throw new InvalidRefreshTokenException();
        }
        return issueTokens(user);
    }

    @Transactional
    public void logout(String rawRefreshToken) {
        if (rawRefreshToken == null || rawRefreshToken.isBlank()) {
            return; // idempotente
        }
        refreshTokens.findByTokenHash(tokenService.hashRefreshToken(rawRefreshToken))
            .ifPresent(refreshTokens::delete);
    }

    private AuthResult issueTokens(User user) {
        String accessToken = tokenService.issueAccessToken(user);
        String rawRefresh = tokenService.generateRefreshTokenValue();
        Instant refreshExpiry = tokenService.refreshExpiry();
        refreshTokens.save(RefreshToken.builder()
            .user(user)
            .tokenHash(tokenService.hashRefreshToken(rawRefresh))
            .expiresAt(refreshExpiry)
            .revoked(false)
            .build());
        return new AuthResult(accessToken, rawRefresh, refreshExpiry,
            new UserView(user.getId(), user.getEmail(), user.getRole(), user.getFullName()));
    }
}
