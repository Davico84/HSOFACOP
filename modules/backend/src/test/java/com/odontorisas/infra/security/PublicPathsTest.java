package com.odontorisas.infra.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.mock.web.MockHttpServletRequest;
import org.springframework.security.web.servlet.util.matcher.PathPatternRequestMatcher;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * {@link PublicPaths#matches} debe decidir exactamente lo mismo que el matcher que Spring
 * Security 7 aplica con MVC a {@code requestMatchers(String...)} ({@link PathPatternRequestMatcher}):
 * la equivalencia no se asume, se prueba en los casos límite.
 */
class PublicPathsTest {

    private static boolean securityMatches(String path) {
        MockHttpServletRequest request = new MockHttpServletRequest("GET", path);
        request.setRequestURI(path);
        return PublicPaths.PATTERNS.stream()
            .map(pattern -> PathPatternRequestMatcher.withDefaults().matcher(pattern))
            .anyMatch(matcher -> matcher.matches(request));
    }

    @ParameterizedTest
    @ValueSource(strings = {
        "/auth", "/auth/", "/auth/login", "/v3/api-docs", "/v3/api-docs.yaml", "/v3/api-docs/swagger-config",
        "/swagger-ui.html", "/swagger-ui/", "/swagger-ui/index.html", "/actuator/health",
        "/actuator/health/liveness", "/actuator/info", "/actuator/env", "/api/x", "/", "/authx"})
    void matches_like_spring_security(String path) {
        assertThat(PublicPaths.matches(path)).as(path).isEqualTo(securityMatches(path));
    }

    @Test
    void public_and_private_examples() {
        assertThat(PublicPaths.matches("/auth/login")).isTrue();
        assertThat(PublicPaths.matches("/actuator/health/liveness")).isTrue();
        assertThat(PublicPaths.matches("/actuator/info")).isFalse();
        assertThat(PublicPaths.matches("/v3/api-docs/swagger-config")).isTrue();
        assertThat(PublicPaths.matches("/api/x")).isFalse();
        assertThat(PublicPaths.matches("/actuator/env")).isFalse();
    }
}
