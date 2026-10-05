package com.odontorisas.presentation.controller;

import com.odontorisas.infra.security.JwtAuthenticationFilter;
import com.odontorisas.service.dashboard.DashboardService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Acceso a las métricas de Inicio por rol (service mockeado). */
@WebMvcTest(controllers = DashboardController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class))
@AutoConfigureMockMvc(addFilters = false)
@Import(DashboardControllerTest.MethodSecurity.class)
class DashboardControllerTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurity {
    }

    @Autowired MockMvc mockMvc;
    @MockitoBean DashboardService service;

    private static RequestPostProcessor as(long userId, String role) {
        var auth = new UsernamePasswordAuthenticationToken("u" + userId, null,
            List.of(new SimpleGrantedAuthority("ROLE_" + role)));
        auth.setDetails(userId);
        return request -> {
            SecurityContextHolder.getContext().setAuthentication(auth);
            return request;
        };
    }

    @AfterEach
    void clearSecurityContext() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void without_session_is_401() throws Exception {
        mockMvc.perform(get("/api/dashboard/me")).andExpect(status().isUnauthorized());
        mockMvc.perform(get("/api/dashboard/admin")).andExpect(status().isUnauthorized());
    }

    @Test
    void admin_endpoint_is_403_for_user() throws Exception {
        mockMvc.perform(get("/api/dashboard/admin").with(as(1, "USER"))).andExpect(status().isForbidden());
        verify(service, never()).forAdmin();
    }

    @Test
    void me_endpoint_is_403_for_admin() throws Exception {
        mockMvc.perform(get("/api/dashboard/me").with(as(9, "ADMIN"))).andExpect(status().isForbidden());
        verify(service, never()).forUser(any());
    }
}
