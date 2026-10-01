package com.odontorisas.presentation;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.infra.config.TraceIdFilter;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenarios de "Formato uniforme de error en toda la API" (api-type-contracts) contra el
 * backend real: SecurityConfig (rutas públicas, delegación del 401), TraceIdFilter y los
 * conversores de MVC. Las rutas de MVC van bajo {@code /auth/**} (pública) para que la
 * seguridad no responda 401 antes. Se asevera el {@code detail} exacto de la aplicación,
 * no los textos internos de Spring (cambian entre versiones).
 */
@SpringBootTest
@AutoConfigureMockMvc
class ErrorContractIT extends AbstractIntegrationTest {

    @Autowired
    MockMvc mockMvc;

    /** Formato completo común a todo error: problem+json, campos RFC 9457, timestamp, traceId == X-Trace-Id. */
    private MvcResult assertProblem(ResultActions result, int status, String detail) throws Exception {
        MvcResult mvc = result
            .andExpect(status().is(status))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.status").value(status))
            .andExpect(jsonPath("$.type").isNotEmpty())
            .andExpect(jsonPath("$.title").isNotEmpty())
            .andExpect(jsonPath("$.detail").value(detail))
            .andExpect(jsonPath("$.timestamp").isNotEmpty())
            .andExpect(jsonPath("$.traceId").isNotEmpty())
            .andReturn();
        String header = mvc.getResponse().getHeader(TraceIdFilter.TRACE_ID_HEADER);
        assertThat(header).isNotBlank();
        assertThat(mvc.getResponse().getContentAsString()).contains("\"traceId\":\"" + header + "\"");
        return mvc;
    }

    // --- Excepción resuelta por el manejador por defecto de Spring MVC ---

    @Test
    void malformed_json_returns_400_in_spanish_keeping_parent_metadata() throws Exception {
        assertProblem(mockMvc.perform(post("/auth/register")
                    .contentType(MediaType.APPLICATION_JSON).content("{\"email\": ")),
                400, "La solicitud no es válida.");

        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content("{\"email\": "))
            .andExpect(jsonPath("$.type").value("/errors/bad-request"))
            .andExpect(jsonPath("$.title").value("Bad Request"))
            .andExpect(jsonPath("$.instance").value("/auth/register"));
    }

    @Test
    void unknown_route_returns_404_in_spanish() throws Exception {
        assertProblem(mockMvc.perform(get("/auth/__ruta_inexistente__")),
            404, "No se encontró el recurso solicitado.");
    }

    @Test
    void unsupported_method_returns_405_in_spanish() throws Exception {
        assertProblem(mockMvc.perform(get("/auth/login")),
            405, "Método no permitido para este recurso.");
    }

    @Test
    void unsupported_media_type_returns_415_in_spanish() throws Exception {
        assertProblem(mockMvc.perform(post("/auth/login").contentType(MediaType.TEXT_PLAIN).content("{}")),
            415, "Tipo de contenido no soportado.");
    }

    // --- Excepción de negocio con handler explícito ---

    @Test
    void business_exception_keeps_its_curated_detail() throws Exception {
        String email = "error-contract-" + UUID.randomUUID() + "@clinica.test";
        String body = "{\"email\":\"" + email + "\",\"password\":\"password123\",\"fullName\":\"Ana Pérez\"}";
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
            .andExpect(status().isCreated());

        assertProblem(mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body)),
                409, "El correo ya está registrado: " + email);
    }

    // --- Error de autenticación ---

    @Test
    void missing_session_on_private_route_returns_401_with_full_format() throws Exception {
        assertProblem(mockMvc.perform(get("/api/recurso-privado")),
                401, "Necesitas iniciar sesión para acceder a este recurso.");
    }
}
