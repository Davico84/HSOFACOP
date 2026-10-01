package com.odontorisas.health;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenario "Arranque de la aplicación": el endpoint de salud responde 200 OK (UP).
 */
@SpringBootTest
@AutoConfigureMockMvc
class HealthEndpointTest extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void should_return_200_when_health_endpoint_is_called() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(content().string(containsString("UP")));
    }
}
