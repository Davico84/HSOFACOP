package com.odontorisas.dashboard;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.TestRecordNumbers;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.sql.Timestamp;
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenarios de dashboard de punta a punta (JWT real, SQL nativo, PostgreSQL). El reloj de la app
 * queda fijo el 15 de octubre de 2030 en Lima; las métricas del ADMIN son globales, así que cada
 * test empieza con las tablas vacías.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(DashboardIT.FixedClock.class)
class DashboardIT extends AbstractIntegrationTest {

    static final ZoneId LIMA = ZoneId.of("America/Lima");
    static final Instant NOW = ZonedDateTime.of(2030, 10, 15, 12, 0, 0, 0, LIMA).toInstant();

    @TestConfiguration
    static class FixedClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(NOW, LIMA);
        }
    }

    private static final String PASSWORD = "password123";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String token) {}

    @BeforeEach
    void emptyTables() {
        jdbc.execute("TRUNCATE orthodontic_records, refresh_tokens, users RESTART IDENTITY CASCADE");
    }

    // --- Ayudas ---

    private JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Session register(String fullName) throws Exception {
        String email = "dash-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"" + fullName + "\"}"))
            .andExpect(status().isCreated()).andReturn();
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), node.get("accessToken").stringValue());
    }

    private Session admin(String fullName) throws Exception {
        Session user = register(fullName);
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, user.id());
        jdbc.update("UPDATE users SET role = 'ADMIN' WHERE id = ?", user.id());
        MvcResult login = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}")).andReturn();
        return new Session(user.id(), read(login).get("accessToken").stringValue());
    }

    /** Crea una historia y devuelve su id. */
    private long record(Session as, String body) throws Exception {
        MvcResult result = mockMvc.perform(post("/api/orthodontic-records").header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON).content(TestRecordNumbers.withNumber(body, TestRecordNumbers.next())))
            .andExpect(status().isCreated()).andReturn();
        return read(result).get("id").asLong();
    }

    private long record(Session as) throws Exception {
        return record(as, "{\"patientName\":\"Paciente\"}");
    }

    private void set(long recordId, String column, Object value) {
        jdbc.update("UPDATE orthodontic_records SET " + column + " = ? WHERE id = ?", value, recordId);
    }

    private static Timestamp at(int year, int month, int day) {
        return Timestamp.from(ZonedDateTime.of(year, month, day, 10, 0, 0, 0, LIMA).toInstant());
    }

    private JsonNode me(Session as) throws Exception {
        return read(mockMvc.perform(get("/api/dashboard/me").header("Authorization", "Bearer " + as.token()))
            .andExpect(status().isOk()).andReturn());
    }

    private JsonNode adminDashboard(Session as) throws Exception {
        return read(mockMvc.perform(get("/api/dashboard/admin").header("Authorization", "Bearer " + as.token()))
            .andExpect(status().isOk()).andReturn());
    }

    private static boolean isNull(JsonNode node) {
        return node == null || node.isNull();
    }

    private static List<Long> emptyStepOrder(JsonNode dashboard) {
        List<Long> out = new ArrayList<>();
        dashboard.get("missing").get("emptySteps").forEach(e -> out.add(e.get("step").asLong()));
        return out;
    }

    // --- Tratante ---

    @Test
    void quota_and_totals() throws Exception {
        Session torres = register("Dra. Torres");
        jdbc.update("UPDATE users SET record_quota = 5 WHERE id = ?", torres.id());
        set(record(torres), "created_at", at(2030, 10, 2));
        set(record(torres), "created_at", at(2030, 8, 20));
        set(record(torres), "created_at", at(2030, 9, 30));

        JsonNode d = me(torres);
        assertThat(d.get("records").get("total").asLong()).isEqualTo(3);
        assertThat(d.get("records").get("createdThisMonth").asLong()).isEqualTo(1);
        assertThat(d.get("quota").get("limit").asInt()).isEqualTo(5);
        assertThat(d.get("quota").get("used").asLong()).isEqualTo(3);
    }

    @Test
    void unlimited_quota() throws Exception {
        Session torres = register("Dra. Torres");
        assertThat(isNull(me(torres).get("quota").get("limit"))).isTrue();
    }

    @Test
    void completeness_ignores_signatures_step() throws Exception {
        Session torres = register("Dra. Torres");
        set(record(torres), "filled_steps", 127);   // pasos 1–7: completa
        set(record(torres), "filled_steps", 15);    // pasos 1–4
        set(record(torres), "filled_steps", null);  // sin calcular

        JsonNode c = me(torres).get("completeness");
        assertThat(c.get("complete").asLong()).isEqualTo(1);
        assertThat(c.get("inProgress").asLong()).isEqualTo(1);
        assertThat(c.get("notComputed").asLong()).isEqualTo(1);
        assertThat(c.get("averageFilledSteps").asDouble()).isEqualTo(5.5);

        // Pasos 1–6 + Firmas: en progreso, y Firmas nunca figura entre los pasos vacíos.
        set(record(torres), "filled_steps", 63 + 128);
        JsonNode again = me(torres);
        assertThat(again.get("completeness").get("inProgress").asLong()).isEqualTo(2);
        assertThat(emptyStepOrder(again)).hasSize(7).doesNotContain(8L);
    }

    @Test
    void average_is_null_without_computed() throws Exception {
        Session torres = register("Dra. Torres");
        set(record(torres), "filled_steps", null);
        JsonNode c = me(torres).get("completeness");
        assertThat(c.get("notComputed").asLong()).isEqualTo(1);
        assertThat(isNull(c.get("averageFilledSteps"))).isTrue();
    }

    @Test
    void missing_data_and_empty_steps_order() throws Exception {
        Session torres = register("Dra. Torres");
        long a = record(torres, "{\"patientName\":\"A\",\"documentType\":\"DNI\",\"documentNumber\":\"74125896\","
            + "\"birthDate\":\"2012-05-20\",\"treatmentStartDate\":\"2026-05-19\"}");
        long b = record(torres, "{\"patientName\":\"B\",\"birthDate\":\"2012-05-20\",\"treatmentStartDate\":\"2026-05-19\"}");
        long c = record(torres, "{\"patientName\":\"C\",\"birthDate\":\"2012-05-20\"}");
        set(a, "filled_steps", 1 + 2 + 4);        // vacíos 4,5,6,7
        set(b, "filled_steps", 1 + 2 + 8);        // vacíos 3,5,6,7
        set(c, "filled_steps", 1 + 2 + 4 + 8);    // vacíos 5,6,7

        JsonNode d = me(torres);
        JsonNode missing = d.get("missing");
        assertThat(missing.get("withoutDocument").asLong()).isEqualTo(2);
        assertThat(missing.get("withoutBirthDate").asLong()).isZero();
        assertThat(missing.get("withoutTreatmentStart").asLong()).isEqualTo(1);
        // 5, 6 y 7 vacíos en las 3; 3 y 4 en una; 1 y 2 en ninguna (empates por número de paso).
        assertThat(emptyStepOrder(d)).containsExactly(5L, 6L, 7L, 3L, 4L, 1L, 2L);
    }

    @Test
    void only_own_records() throws Exception {
        Session torres = register("Dra. Torres");
        Session medina = register("Dr. Medina");
        record(torres);
        for (int i = 0; i < 4; i++) {
            record(medina);
        }
        assertThat(me(torres).get("records").get("total").asLong()).isEqualTo(1);
    }

    @Test
    void empty_dashboard() throws Exception {
        JsonNode d = me(register("Dra. Torres"));
        assertThat(d.get("records").get("total").asLong()).isZero();
        assertThat(d.get("resume")).isEmpty();
        assertThat(emptyStepOrder(d)).containsExactly(1L, 2L, 3L, 4L, 5L, 6L, 7L);
        d.get("missing").get("emptySteps").forEach(e -> assertThat(e.get("count").asLong()).isZero());
        assertThat(isNull(d.get("completeness").get("averageFilledSteps"))).isTrue();
    }

    @Test
    void resume_links_last_step_or_1() throws Exception {
        Session torres = register("Dra. Torres");
        long complete = record(torres);
        set(complete, "filled_steps", 127);
        List<Long> incomplete = new ArrayList<>();
        for (int day = 1; day <= 6; day++) {
            long id = record(torres);
            set(id, "updated_at", at(2030, 10, day));
            incomplete.add(id);
        }
        set(incomplete.get(5), "last_step", 6);
        set(incomplete.get(4), "filled_steps", null);

        JsonNode resume = me(torres).get("resume");
        assertThat(resume).hasSize(5);
        // Más recientes primero (día 6 … día 2); la completa no aparece.
        assertThat(resume.get(0).get("id").asLong()).isEqualTo(incomplete.get(5));
        assertThat(resume.get(0).get("lastStep").asInt()).isEqualTo(6);
        assertThat(resume.get(0).get("filledSteps").asInt()).isEqualTo(1);
        assertThat(isNull(resume.get(1).get("filledSteps"))).isTrue();
        assertThat(isNull(resume.get(1).get("lastStep"))).isTrue();
        resume.forEach(r -> assertThat(r.get("id").asLong()).isNotEqualTo(complete));
    }

    @Test
    void resume_empty_when_all_complete() throws Exception {
        Session torres = register("Dra. Torres");
        set(record(torres), "filled_steps", 127);
        set(record(torres), "filled_steps", 255);
        assertThat(me(torres).get("resume")).isEmpty();
    }

    @Test
    void admin_cannot_read_user_dashboard() throws Exception {
        Session admin = admin("Admin");
        mockMvc.perform(get("/api/dashboard/me").header("Authorization", "Bearer " + admin.token()))
            .andExpect(status().isForbidden());
    }

    // --- ADMIN ---

    @Test
    void user_counts_by_status() throws Exception {
        Session admin = admin("Admin");
        Session a = register("Ana");
        Session b = register("Beto");
        register("Carla");
        jdbc.update("UPDATE users SET status = 'DISABLED' WHERE id = ?", b.id());
        jdbc.update("UPDATE users SET created_at = ? WHERE id IN (?, ?)", at(2030, 9, 1), admin.id(), a.id());
        jdbc.update("UPDATE users SET created_at = ? WHERE id <> ? AND id <> ?", at(2030, 10, 3), admin.id(), a.id());

        JsonNode users = adminDashboard(admin).get("users");
        assertThat(users.get("total").asLong()).isEqualTo(4);
        assertThat(users.get("active").asLong()).isEqualTo(3);
        assertThat(users.get("disabled").asLong()).isEqualTo(1);
        assertThat(users.get("newThisMonth").asLong()).isEqualTo(2);
    }

    @Test
    void per_month_fills_zeros() throws Exception {
        Session admin = admin("Admin");
        Session torres = register("Dra. Torres");
        for (int i = 0; i < 4; i++) {
            set(record(torres), "created_at", at(2030, 5, 10));
        }
        for (int i = 0; i < 7; i++) {
            set(record(torres), "created_at", at(2030, 10, 1));
        }
        set(record(torres), "created_at", at(2030, 4, 30)); // fuera de la ventana de 6 meses

        JsonNode perMonth = adminDashboard(admin).get("records").get("perMonth");
        List<String> months = new ArrayList<>();
        List<Long> counts = new ArrayList<>();
        perMonth.forEach(m -> {
            months.add(m.get("month").stringValue());
            counts.add(m.get("count").asLong());
        });
        assertThat(months).containsExactly("2030-05", "2030-06", "2030-07", "2030-08", "2030-09", "2030-10");
        assertThat(counts).containsExactly(4L, 0L, 0L, 0L, 0L, 7L);
    }

    @Test
    void month_cut_uses_app_zone() throws Exception {
        Session admin = admin("Admin");
        Session torres = register("Dra. Torres");
        // 31 de mayo 21:00 en Lima = 1 de junio 02:00 UTC.
        Instant lateMay = ZonedDateTime.of(2030, 5, 31, 21, 0, 0, 0, LIMA).toInstant();
        set(record(torres), "created_at", Timestamp.from(lateMay));

        JsonNode perMonth = adminDashboard(admin).get("records").get("perMonth");
        assertThat(perMonth.get(0).get("month").stringValue()).isEqualTo("2030-05");
        assertThat(perMonth.get(0).get("count").asLong()).isEqualTo(1);
        assertThat(perMonth.get(1).get("count").asLong()).isZero();
    }

    @Test
    void top_authors_only_users_with_status() throws Exception {
        Session admin = admin("Admin");
        for (int i = 0; i < 9; i++) {
            record(admin);
        }
        int[] counts = {6, 5, 4, 3, 2, 1};
        List<Session> users = new ArrayList<>();
        for (int u = 0; u < counts.length; u++) {
            Session s = register("Tratante " + (char) ('A' + u));
            users.add(s);
            for (int i = 0; i < counts[u]; i++) {
                set(record(s), "filled_steps", 127);
            }
        }
        jdbc.update("UPDATE users SET status = 'DISABLED' WHERE id = ?", users.get(1).id());

        JsonNode top = adminDashboard(admin).get("topAuthors");
        assertThat(top).hasSize(5);
        List<String> names = new ArrayList<>();
        top.forEach(t -> names.add(t.get("fullName").stringValue()));
        assertThat(names).containsExactly("Tratante A", "Tratante B", "Tratante C", "Tratante D", "Tratante E");
        assertThat(top.get(1).get("status").stringValue()).isEqualTo("DISABLED");
        assertThat(top.get(0).get("averageFilledSteps").asDouble()).isEqualTo(7.0);
    }

    @Test
    void admin_and_disabled_records_count_in_totals() throws Exception {
        Session admin = admin("Admin");
        for (int i = 0; i < 6; i++) {
            record(admin);
        }
        Session disabled = register("Deshabilitado");
        for (int i = 0; i < 9; i++) {
            record(disabled);
        }
        jdbc.update("UPDATE users SET status = 'DISABLED' WHERE id = ?", disabled.id());

        JsonNode d = adminDashboard(admin);
        assertThat(d.get("records").get("total").asLong()).isEqualTo(15);
        assertThat(d.get("topAuthors")).hasSize(1);
        assertThat(d.get("topAuthors").get(0).get("status").stringValue()).isEqualTo("DISABLED");
    }

    @Test
    void quotas_zero_and_reduced_are_full() throws Exception {
        Session admin = admin("Admin");
        Session zero = register("Cupo cero");
        jdbc.update("UPDATE users SET record_quota = 0 WHERE id = ?", zero.id());
        Session reduced = register("Cupo reducido");
        for (int i = 0; i < 3; i++) {
            record(reduced);
        }
        jdbc.update("UPDATE users SET record_quota = 2 WHERE id = ?", reduced.id());
        Session near = register("Cerca");
        jdbc.update("UPDATE users SET record_quota = 5 WHERE id = ?", near.id());
        for (int i = 0; i < 4; i++) {
            record(near);
        }
        Session far = register("Lejos");
        jdbc.update("UPDATE users SET record_quota = 5 WHERE id = ?", far.id());
        for (int i = 0; i < 3; i++) {
            record(far);
        }
        Session unlimited = register("Sin cupo");
        for (int i = 0; i < 8; i++) {
            record(unlimited);
        }

        JsonNode quotas = adminDashboard(admin).get("quotas");
        assertThat(quotas.get("total").asLong()).isEqualTo(3);
        List<String> names = new ArrayList<>();
        quotas.get("items").forEach(q -> names.add(q.get("fullName").stringValue()));
        // Llenas primero (cupo reducido 3/2 = 150 % antes que cupo 0), luego 4/5.
        assertThat(names).containsExactly("Cupo reducido", "Cupo cero", "Cerca");
        assertThat(quotas.get("items").get(1).get("reached").asBoolean()).isTrue();
        assertThat(quotas.get("items").get(2).get("reached").asBoolean()).isFalse();
    }

    @Test
    void quotas_exclude_disabled() throws Exception {
        Session admin = admin("Admin");
        Session full = register("Lleno deshabilitado");
        jdbc.update("UPDATE users SET record_quota = 0, status = 'DISABLED' WHERE id = ?", full.id());
        JsonNode quotas = adminDashboard(admin).get("quotas");
        assertThat(quotas.get("total").asLong()).isZero();
        assertThat(quotas.get("items")).isEmpty();
    }

    @Test
    void quotas_top_10_and_total() throws Exception {
        Session admin = admin("Admin");
        for (int i = 0; i < 12; i++) {
            Session s = register("Tratante " + i);
            jdbc.update("UPDATE users SET record_quota = 0 WHERE id = ?", s.id());
        }
        JsonNode quotas = adminDashboard(admin).get("quotas");
        assertThat(quotas.get("total").asLong()).isEqualTo(12);
        assertThat(quotas.get("items")).hasSize(10);
    }

    @Test
    void lists_never_null() throws Exception {
        JsonNode d = adminDashboard(admin("Admin"));
        assertThat(d.get("topAuthors").isArray()).isTrue();
        assertThat(d.get("topAuthors")).isEmpty();
        assertThat(d.get("quotas").get("items").isArray()).isTrue();
        assertThat(d.get("records").get("perMonth")).hasSize(6);
    }

    @Test
    void unlock_requests_oldest_first_10_and_total() throws Exception {
        Session admin = admin("Admin");
        Session torres = register("Dra. Torres");
        List<Long> ids = new ArrayList<>();
        for (int i = 0; i < 12; i++) {
            long id = record(torres);
            ids.add(id);
            jdbc.update("UPDATE orthodontic_records SET patient_locked_at = ?, unlock_requested_at = ?,"
                + " unlock_request_reason = ? WHERE id = ?", at(2030, 10, 1), at(2030, 10, 1 + i), "Motivo " + i, id);
        }
        JsonNode requests = adminDashboard(admin).get("unlockRequests");
        assertThat(requests.get("total").asLong()).isEqualTo(12);
        assertThat(requests.get("items")).hasSize(10);
        assertThat(requests.get("items").get(0).get("recordId").asLong()).isEqualTo(ids.get(0));
        assertThat(requests.get("items").get(0).get("reason").stringValue()).isEqualTo("Motivo 0");
        assertThat(requests.get("items").get(0).get("authorName").stringValue()).isEqualTo("Dra. Torres");
    }

    @Test
    void no_unlock_requests_is_an_empty_list() throws Exception {
        JsonNode requests = adminDashboard(admin("Admin")).get("unlockRequests");
        assertThat(requests.get("total").asLong()).isZero();
        assertThat(requests.get("items").isArray()).isTrue();
        assertThat(requests.get("items")).isEmpty();
    }

    @Test
    void user_cannot_read_admin_dashboard() throws Exception {
        Session torres = register("Dra. Torres");
        mockMvc.perform(get("/api/dashboard/admin").header("Authorization", "Bearer " + torres.token()))
            .andExpect(status().isForbidden());
    }
}
