package com.odontorisas.users;

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
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Scenarios de la capacidad users y de las cuentas deshabilitadas en authentication, contra PostgreSQL real. */
@SpringBootTest
@AutoConfigureMockMvc
class UserAccountStatusIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String REFRESH_COOKIE = "refresh_token";
    private static final String DISABLED_DETAIL = "Tu cuenta está deshabilitada. Contacta con el administrador.";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    /** Sesión de prueba: id, access token y cookie de refresco. */
    record Session(long id, String email, String accessToken, Cookie refresh) {}

    private static String body(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"fullName\":\"Ana Pérez\"}";
    }

    private Session sessionFrom(MvcResult result, String email) throws Exception {
        JsonNode node = json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
        return new Session(node.get("user").get("id").asLong(), email, node.get("accessToken").stringValue(),
            result.getResponse().getCookie(REFRESH_COOKIE));
    }

    private Session register() throws Exception {
        String email = "status-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content(body(email, PASSWORD)))
            .andExpect(status().isCreated()).andReturn();
        return sessionFrom(result, email);
    }

    private MvcResult login(String email, String password) throws Exception {
        return mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content(body(email, password))).andReturn();
    }

    /** Un ADMIN: se registra, se promueve en BD y vuelve a entrar (el rol va en el token). */
    private Session admin() throws Exception {
        Session user = register();
        jdbc.update("UPDATE users SET role = 'ADMIN' WHERE id = ?", user.id());
        return sessionFrom(login(user.email(), PASSWORD), user.email());
    }

    private MvcResult changeStatus(Session as, long id, String status) throws Exception {
        return mockMvc.perform(patch("/api/users/" + id + "/status")
            .header("Authorization", "Bearer " + as.accessToken())
            .contentType(MediaType.APPLICATION_JSON).content("{\"status\":\"" + status + "\"}")).andReturn();
    }

    private String statusOf(long id) {
        return jdbc.queryForObject("SELECT status FROM users WHERE id = ?", String.class, id);
    }

    private int failedAttempts(long id) {
        return jdbc.queryForObject("SELECT failed_login_attempts FROM users WHERE id = ?", Integer.class, id);
    }

    private MvcResult refresh(Cookie cookie) throws Exception {
        return mockMvc.perform(post("/auth/refresh").cookie(cookie)).andReturn();
    }

    // --- Estado de la cuenta ---

    @Test
    void registered_user_is_active() throws Exception {
        assertThat(statusOf(register().id())).isEqualTo("ACTIVE");
    }

    @Test
    void status_change_preserves_lockout_fields() throws Exception {
        Session admin = admin();
        Session ana = register();
        Instant lockedUntil = Instant.now().plus(5, ChronoUnit.MINUTES).truncatedTo(ChronoUnit.MICROS);
        jdbc.update("UPDATE users SET failed_login_attempts = 3, locked_until = ? WHERE id = ?",
            Timestamp.from(lockedUntil), ana.id());

        assertThat(changeStatus(admin, ana.id(), "DISABLED").getResponse().getStatus()).isEqualTo(200);

        assertThat(failedAttempts(ana.id())).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT locked_until FROM users WHERE id = ?", Timestamp.class, ana.id())
            .toInstant()).isEqualTo(lockedUntil);
    }

    @Test
    void disabled_email_remains_registered() throws Exception {
        Session admin = admin();
        Session ana = register();
        changeStatus(admin, ana.id(), "DISABLED");

        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(ana.email(), PASSWORD)))
            .andExpect(status().isConflict());
    }

    // --- Cambio de estado ---

    @Test
    void disabling_a_user_revokes_sessions_and_blocks_login_with_specific_403() throws Exception {
        Session admin = admin();
        Session ana = register();

        MvcResult result = changeStatus(admin, ana.id(), "DISABLED");
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(json.readTree(result.getResponse().getContentAsString()).get("status").stringValue()).isEqualTo("DISABLED");
        assertThat(statusOf(ana.id())).isEqualTo("DISABLED");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE user_id = ? AND NOT revoked",
            Integer.class, ana.id())).isZero();

        MvcResult disabledLogin = login(ana.email(), PASSWORD);
        assertThat(disabledLogin.getResponse().getStatus()).isEqualTo(403);
        assertThat(disabledLogin.getResponse().getContentAsString(StandardCharsets.UTF_8)).contains(DISABLED_DETAIL)
            .contains("/errors/account-disabled");
        assertThat(disabledLogin.getResponse().getCookie(REFRESH_COOKIE)).isNull();
        assertThat(failedAttempts(ana.id())).isZero();
    }

    @Test
    void disabled_wrong_password_counts_failure() throws Exception {
        Session admin = admin();
        Session ana = register();
        changeStatus(admin, ana.id(), "DISABLED");

        MvcResult result = login(ana.email(), "incorrecta");

        assertThat(result.getResponse().getStatus()).isEqualTo(401);
        assertThat(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).doesNotContain(DISABLED_DETAIL);
        assertThat(failedAttempts(ana.id())).isEqualTo(1);
    }

    @Test
    void disabled_refresh_is_403_with_specific_message() throws Exception {
        Session admin = admin();
        Session ana = register();
        changeStatus(admin, ana.id(), "DISABLED");

        MvcResult result = refresh(ana.refresh());

        assertThat(result.getResponse().getStatus()).isEqualTo(403);
        assertThat(result.getResponse().getContentAsString(StandardCharsets.UTF_8)).contains(DISABLED_DETAIL);
    }

    @Test
    void reactivated_account_logs_in_but_old_refresh_stays_invalid() throws Exception {
        Session admin = admin();
        Session ana = register();
        changeStatus(admin, ana.id(), "DISABLED");

        assertThat(changeStatus(admin, ana.id(), "ACTIVE").getResponse().getStatus()).isEqualTo(200);

        assertThat(refresh(ana.refresh()).getResponse().getStatus()).isEqualTo(401);
        assertThat(login(ana.email(), PASSWORD).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void same_status_is_idempotent() throws Exception {
        Session admin = admin();
        Session ana = register();

        MvcResult result = changeStatus(admin, ana.id(), "ACTIVE");

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(statusOf(ana.id())).isEqualTo("ACTIVE");
    }

    @Test
    void admin_accounts_are_409_including_own_and_missing_is_404() throws Exception {
        Session admin = admin();
        Session other = admin();

        for (String target : List.of("DISABLED", "ACTIVE")) {
            assertThat(changeStatus(admin, other.id(), target).getResponse().getStatus()).isEqualTo(409);
            assertThat(changeStatus(admin, admin.id(), target).getResponse().getStatus()).isEqualTo(409);
        }
        assertThat(statusOf(admin.id())).isEqualTo("ACTIVE");
        assertThat(changeStatus(admin, 999_999_999L, "DISABLED").getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void user_role_cannot_use_the_api() throws Exception {
        Session user = register();
        Session target = register();

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + user.accessToken()))
            .andExpect(status().isForbidden());
        assertThat(changeStatus(user, target.id(), "DISABLED").getResponse().getStatus()).isEqualTo(403);
        assertThat(statusOf(target.id())).isEqualTo("ACTIVE");
    }

    // --- Listado ---

    @Test
    void list_first_page_next_page_empty_page_and_cap() throws Exception {
        Session admin = admin();
        for (int i = 0; i < 21; i++) {
            register();
        }
        long total = jdbc.queryForObject("SELECT count(*) FROM users", Long.class);

        mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + admin.accessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.page").value(0))
            .andExpect(jsonPath("$.size").value(20))
            .andExpect(jsonPath("$.content.length()").value(20))
            .andExpect(jsonPath("$.totalElements").value(total))
            .andExpect(jsonPath("$.last").value(false));

        mockMvc.perform(get("/api/users").param("page", "1").header("Authorization", "Bearer " + admin.accessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.page").value(1));

        mockMvc.perform(get("/api/users").param("page", "100000").header("Authorization", "Bearer " + admin.accessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content.length()").value(0))
            .andExpect(jsonPath("$.totalElements").value(total));

        mockMvc.perform(get("/api/users").param("size", "1000").header("Authorization", "Bearer " + admin.accessToken()))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.size").value(100));
    }

    @Test
    void list_exposes_only_summary_fields() throws Exception {
        Session admin = admin();
        String body = mockMvc.perform(get("/api/users").header("Authorization", "Bearer " + admin.accessToken()))
            .andExpect(status().isOk()).andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);

        JsonNode first = json.readTree(body).get("content").get(0);
        assertThat(new HashSet<>(first.propertyNames())).isEqualTo(Set.of("id", "email", "fullName", "role", "status"));
        assertThat(body).doesNotContain("passwordHash", "password_hash", "failedLoginAttempts", "lockedUntil",
            "createdAt", "updatedAt");
    }

    // --- Concurrencia ---

    @Test
    void concurrent_disable_and_refresh_never_500_and_ends_disabled() throws Exception {
        Session admin = admin();
        Session ana = register();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            Future<Integer> disable = pool.submit(() -> {
                start.await();
                return changeStatus(admin, ana.id(), "DISABLED").getResponse().getStatus();
            });
            Future<MvcResult> renew = pool.submit(() -> {
                start.await();
                return refresh(ana.refresh());
            });
            start.countDown();
            assertThat(disable.get(30, TimeUnit.SECONDS)).isEqualTo(200);
            MvcResult renewed = renew.get(30, TimeUnit.SECONDS);
            assertThat(renewed.getResponse().getStatus()).isIn(200, 401, 403);

            assertThat(statusOf(ana.id())).isEqualTo("DISABLED");
            // Cualquier refresh posterior (con el token viejo o el rotado) se rechaza.
            Cookie latest = renewed.getResponse().getCookie(REFRESH_COOKIE);
            assertThat(refresh(latest != null && !latest.getValue().isEmpty() ? latest : ana.refresh())
                .getResponse().getStatus()).isIn(401, 403);
        } finally {
            pool.shutdownNow();
        }
    }
}
