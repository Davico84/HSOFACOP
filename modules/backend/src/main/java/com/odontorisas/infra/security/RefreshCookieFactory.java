package com.odontorisas.infra.security;

import org.springframework.http.ResponseCookie;
import org.springframework.stereotype.Component;

import java.time.Duration;
import java.time.Instant;

/**
 * Construye la cookie del refresh token: {@code HttpOnly} + {@code Secure} +
 * {@code SameSite=Lax}, acotada al path {@code /auth}. El valor nunca es
 * accesible por JavaScript.
 */
@Component
public class RefreshCookieFactory {

    private static final String COOKIE_PATH = "/auth";

    private final SecurityProperties props;

    public RefreshCookieFactory(SecurityProperties props) {
        this.props = props;
    }

    public String cookieName() {
        return props.cookie().refreshName();
    }

    /** Cookie con el refresh token y su vida útil hasta {@code expiresAt}. */
    public ResponseCookie create(String value, Instant expiresAt) {
        long maxAgeSeconds = Math.max(0, Duration.between(Instant.now(), expiresAt).getSeconds());
        return baseBuilder(value).maxAge(maxAgeSeconds).build();
    }

    /** Cookie de borrado (maxAge=0) para el logout. */
    public ResponseCookie clear() {
        return baseBuilder("").maxAge(0).build();
    }

    private ResponseCookie.ResponseCookieBuilder baseBuilder(String value) {
        return ResponseCookie.from(props.cookie().refreshName(), value)
            .httpOnly(true)
            .secure(props.cookie().secure())
            .sameSite("Lax")
            .path(COOKIE_PATH);
    }
}
