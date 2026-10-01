package com.odontorisas.infra.security;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import testsupport.methodsecurity.OnlyAdminTestController;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Prueba que {@code @EnableMethodSecurity} (SecurityConfig) realmente enforza
 * {@code @PreAuthorize} — sin esa anotación en la config, un {@code @PreAuthorize}
 * en un método no hace nada, en silencio (no falla al arrancar, solo deja pasar
 * a cualquiera). Mismo patrón base que {@code BrandingControllerTest}: slice de
 * controller + seguridad de método, sin la {@code SecurityConfig} real ni JWT.
 *
 * <p>{@link OnlyAdminTestController} vive en el paquete {@code testsupport} (fuera del árbol
 * {@code com.odontorisas} que escanea {@code @SpringBootApplication}) para que NINGÚN otro test
 * de contexto completo (ej. {@code ContractDriftIT}) lo levante por scan y contamine el OpenAPI
 * real — ya pasó una vez. Por eso no llega a este slice por scan: se registra explícito como
 * {@code @Bean} en {@link MethodSecurityTestConfig}, que solo existe cuando este test la importa.
 */
@WebMvcTest(controllers = OnlyAdminTestController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class))
@AutoConfigureMockMvc(addFilters = false)
@Import(MethodSecurityTest.MethodSecurityTestConfig.class)
class MethodSecurityTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurityTestConfig {
        @Bean
        OnlyAdminTestController onlyAdminTestController() {
            return new OnlyAdminTestController();
        }
    }

    @Autowired
    MockMvc mockMvc;

    @Test
    @WithMockUser(roles = "USER")
    void non_admin_gets_403_with_rfc9457_body() throws Exception {
        mockMvc.perform(get("/__test/only-admin"))
            .andExpect(status().isForbidden())
            .andExpect(jsonPath("$.status").value(403))
            .andExpect(jsonPath("$.type").value("/errors/access-denied"))
            .andExpect(jsonPath("$.title").value("Forbidden"))
            .andExpect(jsonPath("$.detail").value("No tienes permiso para realizar esta acción."))
            .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_gets_200() throws Exception {
        mockMvc.perform(get("/__test/only-admin"))
            .andExpect(status().isOk());
    }
}
