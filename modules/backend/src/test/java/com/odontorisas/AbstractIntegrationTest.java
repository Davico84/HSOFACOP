package com.odontorisas;

import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Testcontainers;

/**
 * Base para tests de integración: levanta un PostgreSQL real (Testcontainers)
 * y provee los datos de conexión, garantizando paridad con producción.
 *
 * <p>Patrón <em>singleton container</em>: el contenedor se arranca una sola vez
 * (bloque estático) y se reutiliza en toda la suite; Ryuk lo limpia al terminar
 * la JVM. Deliberadamente NO se usa {@code @Container} (que arranca/destruye por
 * clase) ni {@code stop()}. Se conserva {@code @Testcontainers(disabledWithoutDocker=true)}
 * solo por su condición de ejecución: sin Docker la clase se desactiva y el bloque
 * estático nunca corre (los ITs se saltan limpios en entornos sin Docker).
 */
@Testcontainers(disabledWithoutDocker = true)
public abstract class AbstractIntegrationTest {

    static final PostgreSQLContainer<?> POSTGRES = new PostgreSQLContainer<>("postgres:16-alpine");

    /**
     * Secreto JWT solo para tests (≥ 32 bytes). Se registra con {@code @DynamicPropertySource},
     * que tiene la máxima precedencia: gana al secrets.properties local, a la variable JWT_SECRET
     * y a las propiedades de sistema. Así la CI no firma con el placeholder literal y los tests
     * no dependen del secreto de cada desarrollador.
     */
    public static final String TEST_JWT_SECRET = "test-only-jwt-secret-do-not-use-in-production-0123456789";

    static {
        POSTGRES.start();
    }

    @DynamicPropertySource
    static void datasourceProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", POSTGRES::getJdbcUrl);
        registry.add("spring.datasource.username", POSTGRES::getUsername);
        registry.add("spring.datasource.password", POSTGRES::getPassword);
        registry.add("app.security.jwt.secret", () -> TEST_JWT_SECRET);
    }
}
