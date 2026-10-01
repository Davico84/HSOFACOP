package com.odontorisas.contract;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import testsupport.openapi.TransversalErrorsTestController;
import tools.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.util.HashSet;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenarios "Errores transversales heredados sin declararlos" y "Rutas públicas con una sola
 * fuente" sobre el documento FINAL que publica springdoc (no solo objetos sintéticos) y sobre
 * la seguridad real: lo que {@code PublicPaths} dice que es privado lo es en ambos sitios.
 */
@SpringBootTest
@TestPropertySource(properties = "SWAGGER_ENABLED=true")
@AutoConfigureMockMvc
@Import(OpenApiTransversalErrorsIT.Config.class)
class OpenApiTransversalErrorsIT extends AbstractIntegrationTest {

    @TestConfiguration
    static class Config {
        @Bean
        TransversalErrorsTestController transversalErrorsTestController() {
            return new TransversalErrorsTestController();
        }
    }

    @Autowired
    MockMvc mockMvc;

    private Set<String> responseCodes(String path, String method) throws Exception {
        String body = mockMvc.perform(get("/v3/api-docs")).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        JsonNode op = ContractJson.parse(body).get("paths").get(path).get(method);
        assertThat(op).as("%s %s publicado", method, path).isNotNull();
        return new HashSet<>(op.get("responses").propertyNames());
    }

    @Test
    void private_route_inherits_401_and_500() throws Exception {
        assertThat(responseCodes("/api/__test/private", "get"))
            .containsExactlyInAnyOrder("200", "401", "500");
    }

    @Test
    void role_protected_route_inherits_401_403_and_500() throws Exception {
        assertThat(responseCodes("/api/__test/admin", "get"))
            .containsExactlyInAnyOrder("200", "401", "403", "500");
    }

    @Test
    void public_route_does_not_inherit_401() throws Exception {
        assertThat(responseCodes("/auth/register", "post")).doesNotContain("401");
    }

    @Test
    void security_agrees_with_the_document() throws Exception {
        // Privada según PublicPaths → 401 real sin sesión, igual que documenta.
        mockMvc.perform(get("/api/__test/private")).andExpect(status().isUnauthorized());
        // Pública según PublicPaths → no exige sesión (llega al controller: 400 por cuerpo vacío).
        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest());
    }
}
