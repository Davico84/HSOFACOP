package com.odontorisas;

import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.SpringBootTest;

/**
 * Scenario "Arranque de la aplicación": el contexto de Spring Boot carga sin errores
 * (contra un PostgreSQL real vía Testcontainers).
 */
@SpringBootTest
class OdontorisasApplicationTests extends AbstractIntegrationTest {

    @Test
    void contextLoads() {
        // Si el contexto no arranca, el test falla.
    }
}
