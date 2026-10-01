package com.odontorisas.auth;

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

import java.sql.Timestamp;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenario "Cuenta bloqueada durante el propio login", de forma determinista: otra
 * transacción bloquea la cuenta justo mientras el login compara la contraseña (el
 * hueco real entre la lectura inicial del bloqueo y el reset del contador).
 */
@SpringBootTest
@AutoConfigureMockMvc
class LoginLockoutRaceIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "carrera-password";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @MockitoSpyBean PasswordEncoder passwordEncoder;

    private static String body(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"fullName\":\"Ana Pérez\"}";
    }

    @Test
    void account_locked_while_checking_the_password_gets_no_session() throws Exception {
        String email = "carrera-" + UUID.randomUUID() + "@clinica.test";
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(email, PASSWORD)))
            .andExpect(status().isCreated());
        Long userId = jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
        int tokensBefore = jdbc.queryForObject(
            "SELECT count(*) FROM refresh_tokens WHERE user_id = ?", Integer.class, userId);
        Instant lockedUntil = Instant.now().plus(10, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.MICROS);

        doAnswer(inv -> {
            // La lectura inicial ya vio la cuenta desbloqueada; otra "petición" la bloquea ahora.
            jdbc.update("UPDATE users SET failed_login_attempts = 5, locked_until = ? WHERE id = ?",
                Timestamp.from(lockedUntil), userId);
            return inv.callRealMethod();
        }).when(passwordEncoder).matches(eq(PASSWORD), any());

        mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(email, PASSWORD)))
            .andExpect(status().isUnauthorized())
            .andExpect(cookie().doesNotExist("refresh_token"));

        OffsetDateTime stored = jdbc.queryForObject(
            "SELECT locked_until FROM users WHERE id = ?", OffsetDateTime.class, userId);
        assertThat(stored.toInstant()).isEqualTo(lockedUntil);
        assertThat(jdbc.queryForObject("SELECT failed_login_attempts FROM users WHERE id = ?", Integer.class, userId))
            .isEqualTo(5);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE user_id = ?", Integer.class, userId))
            .isEqualTo(tokensBefore);
    }
}
