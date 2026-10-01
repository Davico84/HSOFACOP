package com.odontorisas.users;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoSpyBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenario "Cuenta deshabilitada durante el propio login", determinista: otra transacción
 * deshabilita la cuenta mientras el login compara la contraseña (tras leerla ACTIVE).
 */
@SpringBootTest
@AutoConfigureMockMvc
class UserStatusRaceIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "carrera-estado-password";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @MockitoSpyBean PasswordEncoder passwordEncoder;

    private static String body(String email) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"Ana Pérez\"}";
    }

    @Test
    void account_disabled_while_checking_the_password_gets_no_session() throws Exception {
        String email = "carrera-estado-" + UUID.randomUUID() + "@empresa.test";
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(email)))
            .andExpect(status().isCreated());
        Long id = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        int tokensBefore = jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE user_id = ?", Integer.class, id);

        doAnswer(inv -> {
            jdbc.update("UPDATE users SET status = 'DISABLED' WHERE id = ?", id);
            return inv.callRealMethod();
        }).when(passwordEncoder).matches(eq(PASSWORD), any());

        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(email)))
            .andExpect(status().isUnauthorized()) // la lectura inicial vio ACTIVE: no es el 403
            .andExpect(cookie().doesNotExist("refresh_token"));

        assertThat(jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE user_id = ?", Integer.class, id))
            .isEqualTo(tokensBefore);
        assertThat(jdbc.queryForObject("SELECT failed_login_attempts FROM users WHERE id = ?", Integer.class, id)).isZero();
        assertThat(jdbc.queryForObject("SELECT locked_until FROM users WHERE id = ?", Object.class, id)).isNull();
    }
}
