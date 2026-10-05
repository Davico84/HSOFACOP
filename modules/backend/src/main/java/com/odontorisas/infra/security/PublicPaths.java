package com.odontorisas.infra.security;

import org.springframework.http.server.PathContainer;
import org.springframework.web.util.pattern.PathPattern;
import org.springframework.web.util.pattern.PathPatternParser;

import java.util.List;

/**
 * Fuente única de las rutas públicas (sin sesión). La usan {@link SecurityConfig}
 * ({@code permitAll}) y el customizer de OpenAPI ({@code 401} transversal), así el
 * {@code 401} documentado no puede divergir del real. {@link #matches} usa
 * {@link PathPatternParser}, la misma semántica que {@code requestMatchers(String...)}
 * con MVC (lo fija {@code PublicPathsTest}).
 */
public final class PublicPaths {

    public static final List<String> PATTERNS = List.of(
        "/auth/**",
        "/actuator/health/**",
        "/v3/api-docs/**", "/swagger-ui/**", "/swagger-ui.html");

    private static final List<PathPattern> PARSED = PATTERNS.stream()
        .map(PathPatternParser.defaultInstance::parse)
        .toList();

    private PublicPaths() {
    }

    public static boolean matches(String path) {
        PathContainer container = PathContainer.parsePath(path);
        return PARSED.stream().anyMatch(pattern -> pattern.matches(container));
    }
}
