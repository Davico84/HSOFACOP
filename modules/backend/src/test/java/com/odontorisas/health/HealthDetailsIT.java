package com.odontorisas.health;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Scenario "Detalle oculto en despliegue": con HEALTH_SHOW_DETAILS=never el health solo trae status. */
@SpringBootTest(properties = "HEALTH_SHOW_DETAILS=never")
@AutoConfigureMockMvc
class HealthDetailsIT extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void health_without_details_when_never() throws Exception {
        mockMvc.perform(get("/actuator/health"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("UP"))
            .andExpect(jsonPath("$.components").doesNotExist())
            .andExpect(jsonPath("$.details").doesNotExist());
    }
}
