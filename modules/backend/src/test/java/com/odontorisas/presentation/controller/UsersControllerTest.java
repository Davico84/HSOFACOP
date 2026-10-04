package com.odontorisas.presentation.controller;

import com.odontorisas.common.Role;
import com.odontorisas.common.UserStatus;
import com.odontorisas.infra.security.JwtAuthenticationFilter;
import com.odontorisas.service.users.AccountStatusNotChangeableException;
import com.odontorisas.service.users.QuotaNotApplicableException;
import com.odontorisas.service.users.UserAdminService;
import com.odontorisas.service.users.UserNotFoundException;
import com.odontorisas.service.users.UserSummaryView;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.ComponentScan;
import org.springframework.context.annotation.FilterType;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Forma de la API de gestión (capacidad users) sin BD: autorización por rol (@PreAuthorize),
 * validación del body, mapeo de errores de negocio y paginación. Service mockeado.
 */
@WebMvcTest(controllers = UsersController.class,
    excludeFilters = @ComponentScan.Filter(type = FilterType.ASSIGNABLE_TYPE, classes = JwtAuthenticationFilter.class))
@AutoConfigureMockMvc(addFilters = false)
@Import(UsersControllerTest.MethodSecurity.class)
class UsersControllerTest {

    @TestConfiguration
    @EnableMethodSecurity
    static class MethodSecurity {
    }

    @Autowired
    MockMvc mockMvc;

    @MockitoBean
    UserAdminService userAdmin;

    private static final UserSummaryView ANA =
        new UserSummaryView(2L, "ana@empresa.test", "Ana Pérez", Role.USER, UserStatus.DISABLED, 5, 3L);

    private static String body(String json) {
        return json;
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_lists_users_with_fixed_sort_and_capped_size() throws Exception {
        when(userAdmin.list(any(Pageable.class))).thenAnswer(inv -> {
            Pageable p = inv.getArgument(0);
            return new PageImpl<>(List.of(ANA), p, 1);
        });

        mockMvc.perform(get("/api/users").param("page", "0").param("size", "500").param("sort", "passwordHash"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].email").value("ana@empresa.test"))
            .andExpect(jsonPath("$.size").value(100))
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.totalElements").value(1));

        verify(userAdmin).list(eq(PageRequest.of(0, 100, org.springframework.data.domain.Sort.by("id"))));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void negative_page_is_400() throws Exception {
        mockMvc.perform(get("/api/users").param("page", "-1"))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
    }

    @Test
    @WithMockUser(roles = "USER")
    void user_cannot_list_users() throws Exception {
        mockMvc.perform(get("/api/users")).andExpect(status().isForbidden());
    }

    @Test
    @WithMockUser(roles = "USER")
    void user_cannot_change_status() throws Exception {
        mockMvc.perform(patch("/api/users/2/status").contentType(MediaType.APPLICATION_JSON)
                .content(body("{\"status\":\"DISABLED\"}")))
            .andExpect(status().isForbidden());
        verify(userAdmin, never()).changeStatus(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_changes_status() throws Exception {
        when(userAdmin.changeStatus(2L, UserStatus.DISABLED)).thenReturn(ANA);

        mockMvc.perform(patch("/api/users/2/status").contentType(MediaType.APPLICATION_JSON)
                .content(body("{\"status\":\"DISABLED\"}")))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.status").value("DISABLED"))
            .andExpect(jsonPath("$.passwordHash").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void null_status_is_400_validation_problem() throws Exception {
        mockMvc.perform(patch("/api/users/2/status").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.errors[0].field").value("status"));
        verify(userAdmin, never()).changeStatus(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void unknown_status_is_400_problem() throws Exception {
        mockMvc.perform(patch("/api/users/2/status").contentType(MediaType.APPLICATION_JSON)
                .content(body("{\"status\":\"PAUSED\"}")))
            .andExpect(status().isBadRequest())
            .andExpect(content().contentTypeCompatibleWith(MediaType.APPLICATION_PROBLEM_JSON));
        verify(userAdmin, never()).changeStatus(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void missing_account_is_404_and_admin_account_is_409() throws Exception {
        when(userAdmin.changeStatus(99L, UserStatus.DISABLED)).thenThrow(new UserNotFoundException());
        when(userAdmin.changeStatus(1L, UserStatus.DISABLED)).thenThrow(new AccountStatusNotChangeableException());

        mockMvc.perform(patch("/api/users/99/status").contentType(MediaType.APPLICATION_JSON)
                .content(body("{\"status\":\"DISABLED\"}")))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.type").value("/errors/user-not-found"));
        mockMvc.perform(patch("/api/users/1/status").contentType(MediaType.APPLICATION_JSON)
                .content(body("{\"status\":\"DISABLED\"}")))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.type").value("/errors/account-status-not-changeable"))
            .andExpect(jsonPath("$.detail").value("Solo se puede cambiar el estado de cuentas con rol USER."));
    }

    // --- Cupo de historias (add-record-quota) ---

    @Test
    @WithMockUser(roles = "ADMIN")
    void admin_sets_a_record_quota_and_gets_the_account_with_quota_and_count() throws Exception {
        when(userAdmin.changeRecordQuota(2L, 5)).thenReturn(ANA);

        mockMvc.perform(patch("/api/users/2/record-quota").contentType(MediaType.APPLICATION_JSON).content("{\"recordQuota\":5}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.recordQuota").value(5))
            .andExpect(jsonPath("$.recordCount").value(3));
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void null_quota_removes_the_limit() throws Exception {
        when(userAdmin.changeRecordQuota(2L, null)).thenReturn(
            new UserSummaryView(2L, "ana@empresa.test", "Ana Pérez", Role.USER, UserStatus.ACTIVE, null, 3L));

        mockMvc.perform(patch("/api/users/2/record-quota").contentType(MediaType.APPLICATION_JSON).content("{\"recordQuota\":null}"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.recordQuota").doesNotExist());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void invalid_quota_is_400_and_does_not_call_the_service() throws Exception {
        for (String value : new String[] {"-1", "10000", "2.5"}) {
            mockMvc.perform(patch("/api/users/2/record-quota").contentType(MediaType.APPLICATION_JSON)
                    .content("{\"recordQuota\":" + value + "}"))
                .andExpect(status().isBadRequest());
        }
        verify(userAdmin, never()).changeRecordQuota(any(), any());
    }

    @Test
    @WithMockUser(roles = "ADMIN")
    void quota_on_an_admin_account_is_409() throws Exception {
        when(userAdmin.changeRecordQuota(1L, 5)).thenThrow(new QuotaNotApplicableException());

        mockMvc.perform(patch("/api/users/1/record-quota").contentType(MediaType.APPLICATION_JSON).content("{\"recordQuota\":5}"))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.type").value(org.hamcrest.Matchers.endsWith("/errors/quota-not-applicable")));
    }

    @Test
    @WithMockUser(roles = "USER")
    void user_cannot_change_a_quota() throws Exception {
        mockMvc.perform(patch("/api/users/2/record-quota").contentType(MediaType.APPLICATION_JSON).content("{\"recordQuota\":5}"))
            .andExpect(status().isForbidden());
        verify(userAdmin, never()).changeRecordQuota(any(), any());
    }
}
