package com.odontorisas.contract;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenario "Documentación deshabilitada por defecto" (api-type-contracts). La propiedad se fija a
 * {@code false} de forma EXPLÍCITA: el test no depende de su ausencia, que un secrets.properties
 * local o el entorno podrían romper. El valor por defecto lo fija {@code ApiDocsDefaultTest}.
 */
@SpringBootTest
@TestPropertySource(properties = "SWAGGER_ENABLED=false")
@AutoConfigureMockMvc
class ApiDocsExposureIT extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    @Test
    void api_docs_and_swagger_ui_are_not_served() throws Exception {
        // Rutas públicas (PublicPaths): sin springdoc no existen → 404.
        mockMvc.perform(get("/v3/api-docs")).andExpect(status().isNotFound());
        mockMvc.perform(get("/swagger-ui.html")).andExpect(status().isNotFound());
        // /v3/api-docs.yaml no está en PublicPaths ("/v3/api-docs/**" no la cubre): la corta la
        // seguridad antes (401). Tampoco se sirve; lo que importa es que no responda 200.
        mockMvc.perform(get("/v3/api-docs.yaml")).andExpect(status().isUnauthorized());
    }

    @Test
    void the_rest_of_the_api_still_works() throws Exception {
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
    }
}
