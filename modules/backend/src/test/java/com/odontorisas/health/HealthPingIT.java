package com.odontorisas.health;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.health.contributor.Health;
import org.springframework.boot.health.contributor.HealthIndicator;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Requirements "Endpoint de ping para mantener el backend despierto" y "Superficie pública de
 * Actuator mínima": el liveness responde sin sesión y sin depender de otros indicadores (un
 * indicador de prueba en DOWN tumba el health general, no el liveness); info pide sesión.
 */
@SpringBootTest
@AutoConfigureMockMvc
class HealthPingIT extends AbstractIntegrationTest {

    @TestConfiguration
    static class FailingIndicatorConfig {
        @Bean
        HealthIndicator failingDependency() {
            return () -> Health.down().withDetail("motivo", "caída simulada").build();
        }
    }

    @Autowired
    MockMvc mockMvc;

    @Test
    void liveness_without_session_is_up_without_db() throws Exception {
        mockMvc.perform(get("/actuator/health/liveness"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.components.db").doesNotExist());
    }

    @Test
    void liveness_ignores_other_indicators_down() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isServiceUnavailable())
            .andExpect(jsonPath("$.status").value("DOWN"));
        mockMvc.perform(get("/actuator/health/liveness"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"));
    }

    @Test
    void info_without_session_is_401() throws Exception {
        mockMvc.perform(get("/actuator/info"))
            .andExpect(status().isUnauthorized());
    }
}
