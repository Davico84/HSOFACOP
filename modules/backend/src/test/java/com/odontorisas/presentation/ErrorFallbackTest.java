package com.odontorisas.presentation;

import com.odontorisas.infra.security.JwtAuthenticationFilter;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.EnumSource;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import testsupport.errors.ErrorsTestController;

import static org.assertj.core.api.Assertions.assertThat;
import static org.hamcrest.Matchers.not;
import static org.hamcrest.Matchers.containsString;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Mapa status → mensaje de {@link GlobalExceptionHandler}, su fallback genérico y el 500,
 * de forma determinista y sin Docker. {@link ErrorsTestController} vive en
 * {@code testsupport} y se registra como {@code @Bean} solo aquí (ver MethodSecurityTest).
 */
@WebMvcTest(controllers = ErrorsTestController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class))
@AutoConfigureMockMvc(addFilters = false)
@Import(ErrorFallbackTest.Config.class)
class ErrorFallbackTest {

    @TestConfiguration
    static class Config {
        @Bean
        ErrorsTestController errorsTestController() {
            return new ErrorsTestController();
        }
    }

    @Autowired
    MockMvc mockMvc;

    @ParameterizedTest
    @EnumSource(value = HttpStatus.class, names = {
        "BAD_REQUEST", "NOT_FOUND", "METHOD_NOT_ALLOWED", "NOT_ACCEPTABLE",
        "CONTENT_TOO_LARGE", "UNSUPPORTED_MEDIA_TYPE", "SERVICE_UNAVAILABLE"})
    void every_mapped_status_gets_its_spanish_detail(HttpStatus status) throws Exception {
        String expected = GlobalExceptionHandler.DEFAULT_DETAILS.get(status);
        assertThat(expected).isNotBlank();

        mockMvc.perform(get("/__test/status/" + status.value()))
            .andExpect(status().is(status.value()))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.detail").value(expected))
            .andExpect(jsonPath("$.type").value("/errors/" + status.name().toLowerCase().replace('_', '-')))
            .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void mapped_statuses_are_exactly_the_documented_ones() {
        assertThat(GlobalExceptionHandler.DEFAULT_DETAILS.keySet()).containsExactlyInAnyOrder(
            HttpStatus.BAD_REQUEST, HttpStatus.NOT_FOUND, HttpStatus.METHOD_NOT_ALLOWED, HttpStatus.NOT_ACCEPTABLE,
            HttpStatus.CONTENT_TOO_LARGE, HttpStatus.UNSUPPORTED_MEDIA_TYPE, HttpStatus.SERVICE_UNAVAILABLE);
    }

    @Test
    void status_without_specific_message_gets_the_generic_one() throws Exception {
        mockMvc.perform(get("/__test/status/418"))
            .andExpect(status().is(418))
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.detail").value("Ocurrió un error al procesar la solicitud."))
            .andExpect(jsonPath("$.type").value("/errors/i-am-a-teapot"))
            .andExpect(content().string(not(containsString("texto interno"))))
            .andExpect(jsonPath("$.timestamp").isNotEmpty());
    }

    @Test
    void unexpected_error_returns_500_without_internal_message() throws Exception {
        mockMvc.perform(get("/__test/boom"))
            .andExpect(status().isInternalServerError())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON))
            .andExpect(jsonPath("$.detail").value("Ocurrió un error inesperado."))
            .andExpect(jsonPath("$.type").value("/errors/internal-server-error"))
            .andExpect(jsonPath("$.timestamp").isNotEmpty())
            .andExpect(content().string(not(containsString("secreto"))));
    }
}
