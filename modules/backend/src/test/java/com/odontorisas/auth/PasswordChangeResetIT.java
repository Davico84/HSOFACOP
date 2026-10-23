package com.odontorisas.auth;

import com.odontorisas.AbstractIntegrationTest;
import jakarta.servlet.http.Cookie;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * Scenarios de add-password-change-reset de punta a punta (JWT real, cookies, PostgreSQL): cambio
 * de contraseña con la sesión iniciada y enlace de restablecimiento generado por el ADMIN.
 */
@SpringBootTest
@AutoConfigureMockMvc
class PasswordChangeResetIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String NEW_PASSWORD = "nuevaClave456";
    private static final String REFRESH_COOKIE = "refresh_token";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String email, String token, Cookie refresh) {}

    // --- Ayudas ---

    private JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Session session(MvcResult result, String email) throws Exception {
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), email, node.get("accessToken").stringValue(),
            result.getResponse().getCookie(REFRESH_COOKIE));
    }

    private Session register() throws Exception {
        String email = "pw-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"Ana Pérez\"}"))
            .andReturn();
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        return session(result, email);
    }

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + password + "\"}")).andReturn();
    }

    private Session admin() throws Exception {
        Session user = register();
        jdbc.update("UPDATE users SET role = 'ADMIN', record_quota = NULL WHERE id = ?", user.id());
        return session(login(user.email(), PASSWORD), user.email());
    }

    private MvcResult send(Session as, MockHttpServletRequestBuilder request, String body) throws Exception {
        if (as != null) {
            request.header("Authorization", "Bearer " + as.token());
        }
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request).andReturn();
    }

    private MvcResult changePassword(Session as, String current, String next) throws Exception {
        return send(as, put("/api/me/password"), "{\"currentPassword\":\"" + current + "\",\"newPassword\":\"" + next + "\"}");
    }

    private MvcResult refresh(Cookie cookie) throws Exception {
        return mockMvc.perform(post("/auth/refresh").cookie(cookie)).andReturn();
    }

    private String createReset(Session admin, long userId) throws Exception {
        MvcResult result = send(admin, post("/api/users/" + userId + "/password-reset"), null);
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        return read(result).get("token").stringValue();
    }

    private MvcResult reset(String token, String password) throws Exception {
        return send(null, post("/auth/password-reset"), "{\"token\":\"" + token + "\",\"newPassword\":\"" + password + "\"}");
    }

    private static String type(JsonNode problem) {
        return problem.get("type").stringValue();
    }

    private int failedAttempts(long id) {
        return jdbc.queryForObject("SELECT failed_login_attempts FROM users WHERE id = ?", Integer.class, id);
    }

    // --- Migración ---

    @Test
    void the_reset_table_keeps_only_unique_hashes() throws Exception {
        Session admin = admin();
        Session ana = register();
        createReset(admin, ana.id());
        String hash = jdbc.queryForObject("SELECT token_hash FROM password_reset_tokens WHERE user_id = ?", String.class, ana.id());

        assertThat(hash).matches("[0-9a-f]{64}");
        org.assertj.core.api.Assertions.assertThatThrownBy(() -> jdbc.update(
                "INSERT INTO password_reset_tokens (user_id, token_hash, expires_at, created_by) VALUES (?, ?, now(), ?)",
                ana.id(), hash, admin.id()))
            .hasMessageContaining("ux_password_reset_tokens_hash");
    }

    // --- Cambio de contraseña ---

    @Test
    void changing_the_password_switches_credentials_and_keeps_only_this_device() throws Exception {
        Session ana = register();
        Session other = session(login(ana.email(), PASSWORD), ana.email());

        MvcResult result = changePassword(ana, PASSWORD, NEW_PASSWORD);

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        Cookie fresh = result.getResponse().getCookie(REFRESH_COOKIE);
        assertThat(fresh).isNotNull();
        assertThat(read(result).get("accessToken").stringValue()).isNotBlank();
        assertThat(login(ana.email(), PASSWORD).getResponse().getStatus()).isEqualTo(401);
        assertThat(login(ana.email(), NEW_PASSWORD).getResponse().getStatus()).isEqualTo(200);
        assertThat(refresh(other.refresh()).getResponse().getStatus()).isEqualTo(401);
        assertThat(refresh(fresh).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void a_wrong_current_password_is_400_and_counts_as_a_failed_attempt() throws Exception {
        Session ana = register();

        MvcResult result = changePassword(ana, "otraClave99", NEW_PASSWORD);

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(result))).isEqualTo("/errors/wrong-current-password");
        assertThat(read(result).get("detail").stringValue()).isEqualTo("La contraseña actual no es correcta.");
        assertThat(failedAttempts(ana.id())).isEqualTo(1);
        assertThat(login(ana.email(), PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void a_locked_account_is_rejected_without_comparing() throws Exception {
        Session ana = register();
        Instant until = Instant.now().plus(10, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.MICROS);
        jdbc.update("UPDATE users SET failed_login_attempts = 3, locked_until = ? WHERE id = ?", Timestamp.from(until), ana.id());

        MvcResult result = changePassword(ana, PASSWORD, NEW_PASSWORD);

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(result))).isEqualTo("/errors/password-change-locked");
        assertThat(failedAttempts(ana.id())).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT locked_until FROM users WHERE id = ?", Timestamp.class, ana.id()).toInstant())
            .isEqualTo(until);
    }

    @Test
    void the_new_password_must_differ_and_have_8_characters() throws Exception {
        Session ana = register();

        MvcResult same = changePassword(ana, PASSWORD, PASSWORD);
        MvcResult shortOne = changePassword(ana, PASSWORD, "corta");

        assertThat(same.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(same))).isEqualTo("/errors/same-password");
        assertThat(shortOne.getResponse().getStatus()).isEqualTo(400);
        assertThat(login(ana.email(), PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void changing_without_session_is_401() throws Exception {
        assertThat(changePassword(null, PASSWORD, NEW_PASSWORD).getResponse().getStatus()).isEqualTo(401);
    }

    // --- Enlace de restablecimiento ---

    @Test
    void the_link_resets_once_and_closes_all_sessions() throws Exception {
        Session admin = admin();
        Session ana = register();
        String token = createReset(admin, ana.id());

        assertThat(jdbc.queryForObject("SELECT count(*) FROM password_reset_tokens WHERE token_hash = ?", Long.class, token))
            .isZero();
        assertThat(reset(token, NEW_PASSWORD).getResponse().getStatus()).isEqualTo(204);

        assertThat(login(ana.email(), NEW_PASSWORD).getResponse().getStatus()).isEqualTo(200);
        assertThat(refresh(ana.refresh()).getResponse().getStatus()).isEqualTo(401);
        MvcResult reused = reset(token, "otraNueva789");
        assertThat(reused.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(reused))).isEqualTo("/errors/invalid-password-reset");
        assertThat(read(reused).get("detail").stringValue())
            .isEqualTo("El enlace no es válido o venció. Pide uno nuevo al administrador.");
    }

    @Test
    void resetting_removes_the_temporary_lock() throws Exception {
        Session admin = admin();
        Session ana = register();
        jdbc.update("UPDATE users SET failed_login_attempts = 3, locked_until = ? WHERE id = ?",
            Timestamp.from(Instant.now().plus(10, ChronoUnit.MINUTES)), ana.id());

        assertThat(reset(createReset(admin, ana.id()), NEW_PASSWORD).getResponse().getStatus()).isEqualTo(204);

        assertThat(login(ana.email(), NEW_PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void expired_replaced_unknown_or_short_links_are_rejected() throws Exception {
        Session admin = admin();
        Session ana = register();
        String first = createReset(admin, ana.id());
        String second = createReset(admin, ana.id());

        assertThat(type(read(reset(first, NEW_PASSWORD)))).isEqualTo("/errors/invalid-password-reset");
        assertThat(type(read(reset("no-existe", NEW_PASSWORD)))).isEqualTo("/errors/invalid-password-reset");
        assertThat(reset(second, "corta").getResponse().getStatus()).isEqualTo(400);
        jdbc.update("UPDATE password_reset_tokens SET expires_at = now() - interval '1 minute' WHERE user_id = ? AND used_at IS NULL",
            ana.id());
        assertThat(type(read(reset(second, NEW_PASSWORD)))).isEqualTo("/errors/invalid-password-reset");
        assertThat(login(ana.email(), PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void links_only_for_active_students_or_coordination() throws Exception {
        Session admin = admin();
        Session other = admin();
        Session disabled = register();
        send(admin, patch("/api/users/" + disabled.id() + "/status"), "{\"status\":\"DISABLED\"}");
        Session ana = register();

        assertThat(send(admin, post("/api/users/" + other.id() + "/password-reset"), null).getResponse().getStatus())
            .isEqualTo(409);
        assertThat(send(admin, post("/api/users/" + disabled.id() + "/password-reset"), null).getResponse().getStatus())
            .isEqualTo(409);
        assertThat(send(ana, post("/api/users/" + disabled.id() + "/password-reset"), null).getResponse().getStatus())
            .isEqualTo(403);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM password_reset_tokens WHERE user_id IN (?, ?)", Long.class,
            other.id(), disabled.id())).isZero();
        assertThat(List.of(201)).contains(send(admin, post("/api/users/" + ana.id() + "/password-reset"), null)
            .getResponse().getStatus());
    }
}
