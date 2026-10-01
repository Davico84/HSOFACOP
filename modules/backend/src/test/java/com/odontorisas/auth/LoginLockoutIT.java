package com.odontorisas.auth;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.persistence.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.test.web.servlet.ResultActions;
import org.springframework.transaction.support.TransactionTemplate;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Duration;
import java.time.Instant;
import java.time.OffsetDateTime;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;
import java.util.concurrent.TimeUnit;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.cookie;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenarios de "Bloqueo temporal por intentos fallidos de login" (authentication)
 * contra PostgreSQL real. Umbral y ventana por defecto: 5 intentos, 15 minutos.
 */
@SpringBootTest
@AutoConfigureMockMvc
class LoginLockoutIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String REFRESH_COOKIE = "refresh_token";
    private static final int MAX_ATTEMPTS = 5;
    private static final Duration WINDOW = Duration.ofMinutes(15);

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;
    @Autowired UserRepository users;
    @Autowired TransactionTemplate tx;

    private final JsonMapper json = JsonMapper.builder().build();

    record LockState(int failedAttempts, Instant lockedUntil) {}

    private static String body(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"fullName\":\"Ana Pérez\"}";
    }

    private String registered() throws Exception {
        String email = "lockout-" + UUID.randomUUID() + "@clinica.test";
        mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body(email, PASSWORD)))
            .andExpect(status().isCreated());
        return email;
    }

    private ResultActions login(String email, String password) throws Exception {
        return mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON).content(body(email, password)));
    }

    private void failTimes(String email, int times) throws Exception {
        for (int i = 0; i < times; i++) {
            login(email, "incorrecta").andExpect(status().isUnauthorized());
        }
    }

    private LockState state(String email) {
        return jdbc.queryForObject(
            "SELECT failed_login_attempts, locked_until FROM users WHERE email = ?",
            (rs, n) -> {
                OffsetDateTime until = rs.getObject("locked_until", OffsetDateTime.class);
                return new LockState(rs.getInt("failed_login_attempts"), until == null ? null : until.toInstant());
            },
            email);
    }

    private void setLockedUntil(String email, Instant lockedUntil) {
        jdbc.update("UPDATE users SET locked_until = ? WHERE email = ?", Timestamp.from(lockedUntil), email);
    }

    private Long idOf(String email) {
        return jdbc.queryForObject("SELECT id FROM users WHERE email = ?", Long.class, email);
    }

    // --- Inicio de sesión con credenciales (MODIFIED) ---

    @Test
    void valid_credentials_on_unlocked_account_establish_session() throws Exception {
        String email = registered();

        login(email, PASSWORD).andExpect(status().isOk()).andExpect(cookie().exists(REFRESH_COOKIE));
        assertThat(state(email)).isEqualTo(new LockState(0, null));
    }

    // --- Bloqueo temporal ---

    @Test
    void failures_below_threshold_do_not_lock_and_success_resets_counter() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS - 1);
        assertThat(state(email)).isEqualTo(new LockState(MAX_ATTEMPTS - 1, null));

        login(email, PASSWORD).andExpect(status().isOk());
        assertThat(state(email)).isEqualTo(new LockState(0, null));
    }

    @Test
    void reaching_threshold_locks_account_for_the_window() throws Exception {
        String email = registered();
        Instant before = Instant.now();
        failTimes(email, MAX_ATTEMPTS);
        Instant after = Instant.now();

        LockState locked = state(email);
        assertThat(locked.failedAttempts()).isEqualTo(MAX_ATTEMPTS);
        assertThat(locked.lockedUntil())
            .isBetween(before.plus(WINDOW).truncatedTo(ChronoUnit.MILLIS), after.plus(WINDOW));

        login(email, PASSWORD).andExpect(status().isUnauthorized()).andExpect(cookie().doesNotExist(REFRESH_COOKIE));
    }

    @Test
    void locked_account_is_rejected_without_touching_counter_or_window() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS);
        LockState locked = state(email);

        login(email, PASSWORD).andExpect(status().isUnauthorized());
        login(email, "incorrecta").andExpect(status().isUnauthorized());

        assertThat(state(email)).isEqualTo(locked);
    }

    /** add-user-account-status: el bloqueo gana sobre la deshabilitación (genérico, sin BCrypt). */
    @Test
    void disabled_locked_account_stays_generic_401() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS);
        jdbc.update("UPDATE users SET status = 'DISABLED' WHERE email = ?", email);
        LockState locked = state(email);

        for (String password : List.of(PASSWORD, "incorrecta")) {
            MvcResult result = login(email, password).andExpect(status().isUnauthorized()).andReturn();
            assertThat(result.getResponse().getContentAsString(StandardCharsets.UTF_8))
                .contains("Correo electrónico o contraseña incorrectos")
                .doesNotContain("deshabilitada");
        }
        assertThat(state(email)).isEqualTo(locked);
    }

    @Test
    void locked_response_is_indistinguishable_from_invalid_credentials() throws Exception {
        String lockedEmail = registered();
        failTimes(lockedEmail, MAX_ATTEMPTS);
        String otherEmail = registered();

        MvcResult locked = login(lockedEmail, PASSWORD).andReturn();
        MvcResult wrongPassword = login(otherEmail, "incorrecta").andReturn();
        MvcResult unknownEmail = login("nadie-" + UUID.randomUUID() + "@clinica.test", PASSWORD).andReturn();

        for (MvcResult other : List.of(wrongPassword, unknownEmail)) {
            assertThat(locked.getResponse().getStatus()).isEqualTo(401).isEqualTo(other.getResponse().getStatus());
            JsonNode a = json.readTree(locked.getResponse().getContentAsString());
            JsonNode b = json.readTree(other.getResponse().getContentAsString());
            for (String field : List.of("status", "type", "title", "detail")) {
                assertThat(a.get(field)).as(field).isNotNull().isEqualTo(b.get(field));
            }
            // Solo difieren los campos variables de cualquier error.
            assertThat(fieldNames(a)).isEqualTo(fieldNames(b));
        }
        assertThat(locked.getResponse().getCookie(REFRESH_COOKIE)).isNull();
        assertThat(locked.getResponse().getHeaders("Set-Cookie")).isEmpty();
    }

    private static List<String> fieldNames(JsonNode node) {
        return node.propertyNames().stream().filter(n -> !n.equals("traceId")).sorted().toList();
    }

    @Test
    void failure_after_expired_window_restarts_count_at_one() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS);
        setLockedUntil(email, Instant.now().minus(1, ChronoUnit.HOURS));

        login(email, "incorrecta").andExpect(status().isUnauthorized());

        assertThat(state(email)).isEqualTo(new LockState(1, null));
    }

    @Test
    void valid_login_after_expired_window_establishes_session_and_clears_lock() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS);
        setLockedUntil(email, Instant.now().minus(1, ChronoUnit.HOURS));

        login(email, PASSWORD).andExpect(status().isOk()).andExpect(cookie().exists(REFRESH_COOKIE));

        assertThat(state(email)).isEqualTo(new LockState(0, null));
    }

    @Test
    void failure_is_persisted_even_though_the_request_ends_in_401() throws Exception {
        String email = registered();

        login(email, "incorrecta").andExpect(status().isUnauthorized());

        assertThat(state(email).failedAttempts()).isEqualTo(1);
    }

    @Test
    void concurrent_failures_are_all_counted() throws Exception {
        String email = registered();
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<Integer>> results = List.of(
                pool.submit(() -> {
                    start.await();
                    return login(email, "incorrecta").andReturn().getResponse().getStatus();
                }),
                pool.submit(() -> {
                    start.await();
                    return login(email, "incorrecta").andReturn().getResponse().getStatus();
                }));
            start.countDown();
            for (Future<Integer> result : results) {
                assertThat(result.get(30, TimeUnit.SECONDS)).isEqualTo(401);
            }
        } finally {
            pool.shutdownNow();
        }

        assertThat(state(email).failedAttempts()).isEqualTo(2);
    }

    // --- Repositorio: casos límite de los UPDATE atómicos ---

    @Test
    void single_attempt_threshold_locks_again_after_expired_window() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS);
        setLockedUntil(email, Instant.now().minus(1, ChronoUnit.HOURS));
        Instant now = Instant.now().truncatedTo(ChronoUnit.MICROS);
        Instant until = now.plus(WINDOW);

        tx.executeWithoutResult(s -> users.registerFailedLogin(idOf(email), now, until, 1));

        assertThat(state(email)).isEqualTo(new LockState(1, until));
    }

    @Test
    void conditional_reset_does_not_touch_an_account_locked_in_the_future() throws Exception {
        String email = registered();
        failTimes(email, MAX_ATTEMPTS);
        LockState locked = state(email);

        Integer affected = tx.execute(s -> users.resetFailedLogins(idOf(email), Instant.now()));

        assertThat(affected).isZero();
        assertThat(state(email)).isEqualTo(locked);
    }
}
