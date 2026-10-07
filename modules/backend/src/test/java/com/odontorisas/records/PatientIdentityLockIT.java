package com.odontorisas.records;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.TestRecordNumbers;
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
import java.time.Clock;
import java.time.Instant;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Datos del paciente fijos tras imprimir, impresión registrada, desbloqueo con eventos y solicitudes
 * (add-patient-identity-lock), de punta a punta. Reloj de la app fijo el 5 de octubre de 2026 en Lima.
 */
@SpringBootTest
@AutoConfigureMockMvc
@Import(PatientIdentityLockIT.FixedClock.class)
class PatientIdentityLockIT extends AbstractIntegrationTest {

    static final ZoneId LIMA = ZoneId.of("America/Lima");
    static final Instant NOW = ZonedDateTime.of(2026, 10, 5, 22, 30, 0, 0, LIMA).toInstant(); // 6 oct en UTC

    @TestConfiguration
    static class FixedClock {
        @Bean
        @Primary
        Clock fixedClock() {
            return Clock.fixed(NOW, LIMA);
        }
    }

    private static final String PASSWORD = "password123";
    private static final String BASE = "/api/orthodontic-records";

    /** Identidad de partida de las historias de estos tests. */
    private static final Map<String, Object> ANA = Map.of(
        "patientName", "Ana Quispe", "documentType", "DNI", "documentNumber", "74125896",
        "birthDate", "2012-05-20", "patientSex", "FEMALE", "birthPlace", "Lima");

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String token) {}

    // --- Ayudas ---

    private JsonNode read(MvcResult result) throws Exception {
        String body = result.getResponse().getContentAsString(StandardCharsets.UTF_8);
        return body.isEmpty() ? null : json.readTree(body);
    }

    private Session register(String fullName) throws Exception {
        String email = "lock-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"" + fullName + "\"}"))
            .andExpect(status().isCreated()).andReturn();
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), node.get("accessToken").stringValue());
    }

    private Session admin() throws Exception {
        Session user = register("Admin FACOP");
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, user.id());
        jdbc.update("UPDATE users SET role = 'ADMIN' WHERE id = ?", user.id());
        MvcResult login = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}")).andReturn();
        return new Session(user.id(), read(login).get("accessToken").stringValue());
    }

    private String body(Map<String, Object> fields) throws Exception {
        return json.writeValueAsString(fields);
    }

    private long create(Session as) throws Exception {
        var fields = new java.util.HashMap<String, Object>(ANA);
        fields.put("recordNumber", TestRecordNumbers.next());
        MvcResult result = mockMvc.perform(post(BASE).header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON).content(body(fields))).andExpect(status().isCreated()).andReturn();
        return read(result).get("id").asLong();
    }

    private String number(long id) {
        return jdbc.queryForObject("SELECT record_number FROM orthodontic_records WHERE id = ?", String.class, id);
    }

    private JsonNode record(Session as, long id) throws Exception {
        return read(mockMvc.perform(get(BASE + "/" + id).header("Authorization", "Bearer " + as.token())).andReturn());
    }

    /** Guarda la historia con la identidad de ANA cambiada por {@code changes}. */
    private MvcResult save(Session as, long id, Map<String, Object> changes) throws Exception {
        long version = record(as, id).get("version").asLong();
        return save(as, id, version, changes);
    }

    private MvcResult save(Session as, long id, long version, Map<String, Object> changes) throws Exception {
        var fields = new java.util.HashMap<String, Object>(ANA);
        fields.put("recordNumber", number(id));
        fields.putAll(changes);
        fields.put("version", version);
        return mockMvc.perform(put(BASE + "/" + id).header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON).content(body(fields))).andReturn();
    }

    private MvcResult print(Session as, long id, String body) throws Exception {
        var request = post(BASE + "/" + id + "/print").header("Authorization", "Bearer " + as.token());
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request).andReturn();
    }

    private MvcResult unlock(Session as, long id) throws Exception {
        return mockMvc.perform(delete(BASE + "/" + id + "/patient-lock").header("Authorization", "Bearer " + as.token()))
            .andReturn();
    }

    private MvcResult request(Session as, long id, String reason) throws Exception {
        return mockMvc.perform(post(BASE + "/" + id + "/unlock-request").header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON).content("{\"reason\":\"" + reason + "\"}")).andReturn();
    }

    private MvcResult discard(Session as, long id) throws Exception {
        return mockMvc.perform(delete(BASE + "/" + id + "/unlock-request").header("Authorization", "Bearer " + as.token()))
            .andReturn();
    }

    private static boolean isNull(JsonNode node) {
        return node == null || node.isNull();
    }

    private String type(MvcResult result) throws Exception {
        return read(result).get("type").stringValue();
    }

    // --- Número de historia tras imprimir ---

    private JsonNode search(Session as, String q) throws Exception {
        return read(mockMvc.perform(get(BASE).param("q", q).header("Authorization", "Bearer " + as.token())).andReturn());
    }

    @Test
    void author_corrects_the_number_after_printing_and_the_old_one_is_freed() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        String old = number(id);
        assertThat(print(torres, id, null).getResponse().getStatus()).isEqualTo(200);
        String corrected = TestRecordNumbers.next();

        MvcResult saved = save(torres, id, Map.of("recordNumber", corrected));

        assertThat(saved.getResponse().getStatus()).isEqualTo(200);
        assertThat(read(saved).get("recordNumber").stringValue()).isEqualTo(corrected);
        assertThat(read(saved).get("patientLockedAt")).isNotNull();
        // Los datos del paciente siguen fijos.
        assertThat(save(torres, id, Map.of("patientName", "Rosa Díaz")).getResponse().getStatus()).isEqualTo(409);
        // La búsqueda encuentra el número nuevo y ya no el anterior.
        assertThat(search(torres, corrected.toLowerCase()).get("content")).hasSize(1);
        assertThat(search(torres, old.toLowerCase()).get("content")).isEmpty();
        // El número anterior queda libre para otra historia.
        Session other = register("Dr. Medina");
        var fields = new java.util.HashMap<String, Object>(ANA);
        fields.put("recordNumber", old);
        assertThat(mockMvc.perform(post(BASE).header("Authorization", "Bearer " + other.token())
            .contentType(MediaType.APPLICATION_JSON).content(body(fields))).andReturn().getResponse().getStatus()).isEqualTo(201);
    }

    // --- Datos fijos ---

    @Test
    void correcting_before_printing_is_saved() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        assertThat(save(torres, id, Map.of("patientName", "Rosa Díaz")).getResponse().getStatus()).isEqualTo(200);
        assertThat(record(torres, id).get("patientName").stringValue()).isEqualTo("Rosa Díaz");
    }

    @Test
    void first_print_locks_and_returns_server_date_and_progress() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        save(torres, id, Map.of("filledSteps", List.of(1, 2, 5, 8)));

        MvcResult printed = print(torres, id, null);
        assertThat(printed.getResponse().getStatus()).isEqualTo(200);
        JsonNode response = read(printed);
        assertThat(response.get("printedOn").stringValue()).isEqualTo("2026-10-05"); // zona de la app, no UTC
        assertThat(response.get("clinicalFilledSteps").asInt()).isEqualTo(3);         // Firmas no cuenta
        assertThat(isNull(response.get("record").get("patientLockedAt"))).isFalse();
        assertThat(isNull(record(torres, id).get("patientLockedAt"))).isFalse();
    }

    @Test
    void each_locked_field_change_is_409_and_nothing_is_saved() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        print(torres, id, null);
        JsonNode before = record(torres, id);

        List<Map<String, Object>> changes = List.of(
            Map.of("patientName", "Rosa Díaz"), Map.of("documentNumber", "74125897"),
            Map.of("birthDate", "2013-01-01"), Map.of("patientSex", "MALE"), Map.of("birthPlace", "Cusco"),
            Map.of("documentType", "PASSPORT"));
        for (Map<String, Object> change : changes) {
            MvcResult result = save(torres, id, change);
            assertThat(result.getResponse().getStatus()).as(change.toString()).isEqualTo(409);
            assertThat(type(result)).isEqualTo("/errors/patient-locked");
        }
        JsonNode after = record(torres, id);
        assertThat(after.get("version").asLong()).isEqualTo(before.get("version").asLong());
        assertThat(after.get("patientName").stringValue()).isEqualTo("Ana Quispe");
        assertThat(after.get("documentNumber").stringValue()).isEqualTo("74125896");
    }

    @Test
    void correcting_only_the_spelling_is_saved() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        print(torres, id, null);
        assertThat(save(torres, id, Map.of("patientName", "ANA  QUÍSPE", "birthPlace", "lima"))
            .getResponse().getStatus()).isEqualTo(200);
        assertThat(save(torres, id, Map.of("patientName", "Ａｎａ Quispe")).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void free_fields_save_and_reprint_is_idempotent() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        String lockedAt = read(print(torres, id, null)).get("record").get("patientLockedAt").stringValue();

        MvcResult saved = save(torres, id, Map.of("address", "Av. Sol 123", "phone", "987654321",
            "treatmentStartDate", "2026-05-19"));
        assertThat(saved.getResponse().getStatus()).isEqualTo(200);
        long version = read(saved).get("version").asLong();

        JsonNode reprint = read(print(torres, id, null));
        assertThat(reprint.get("record").get("patientLockedAt").stringValue()).isEqualTo(lockedAt);
        assertThat(reprint.get("record").get("version").asLong()).isEqualTo(version);
        assertThat(reprint.get("record").get("address").stringValue()).isEqualTo("Av. Sol 123");
    }

    @Test
    void save_from_another_tab_after_printing_cannot_change_locked_data() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        long versionBeforePrint = record(torres, id).get("version").asLong();
        print(torres, id, null);

        // La otra pestaña tenía la misma versión (imprimir no la cambia): cambiar la identidad → 409.
        MvcResult other = save(torres, id, versionBeforePrint, Map.of("patientName", "Rosa Díaz"));
        assertThat(other.getResponse().getStatus()).isEqualTo(409);
        assertThat(type(other)).isEqualTo("/errors/patient-locked");
    }

    @Test
    void concurrent_print_and_save_never_leave_another_patient_locked() throws Exception {
        Session torres = register("Dra. Torres");
        for (int attempt = 0; attempt < 5; attempt++) {
            long id = create(torres);
            long version = record(torres, id).get("version").asLong();
            CountDownLatch start = new CountDownLatch(1);
            ExecutorService pool = Executors.newFixedThreadPool(2);
            try {
                Callable<MvcResult> printTask = () -> { start.await(); return print(torres, id, null); };
                Callable<MvcResult> saveTask = () -> { start.await(); return save(torres, id, version, Map.of("patientName", "Rosa Díaz")); };
                Future<MvcResult> printed = pool.submit(printTask);
                Future<MvcResult> saved = pool.submit(saveTask);
                start.countDown();
                int saveStatus = saved.get().getResponse().getStatus();
                String lockedName = read(printed.get()).get("record").get("patientName").stringValue();
                // O el guardado entró antes (y se imprimió Rosa) o la impresión fijó a Ana y el guardado se rechazó.
                if (saveStatus == 200) {
                    assertThat(lockedName).isEqualTo("Rosa Díaz");
                } else {
                    assertThat(saveStatus).isEqualTo(409);
                    assertThat(lockedName).isEqualTo("Ana Quispe");
                }
                assertThat(record(torres, id).get("patientName").stringValue()).isEqualTo(lockedName);
            } finally {
                pool.shutdownNow();
            }
        }
    }

    @Test
    void admin_authored_record_is_locked_too() throws Exception {
        Session admin = admin();
        long id = create(admin);
        print(admin, id, null);
        assertThat(save(admin, id, Map.of("patientName", "Rosa Díaz")).getResponse().getStatus()).isEqualTo(409);
    }

    @Test
    void never_printed_record_is_unlocked() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        // Historia impresa antes de este cambio: sin registro de impresión, desbloqueada.
        assertThat(isNull(record(torres, id).get("patientLockedAt"))).isTrue();
        assertThat(save(torres, id, Map.of("patientName", "Rosa Díaz")).getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void print_computes_filled_steps_of_records_without_them() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        jdbc.update("UPDATE orthodontic_records SET filled_steps = NULL WHERE id = ?", id);

        JsonNode response = read(print(torres, id, "{\"filledSteps\":[1,2,3,8]}"));
        assertThat(response.get("clinicalFilledSteps").asInt()).isEqualTo(3);
        assertThat(jdbc.queryForObject("SELECT filled_steps FROM orthodontic_records WHERE id = ?", Integer.class, id))
            .isEqualTo(1 + 2 + 4 + 128);
    }

    @Test
    void user_cannot_print_someone_elses_record() throws Exception {
        Session torres = register("Dra. Torres");
        Session medina = register("Dr. Medina");
        long id = create(torres);
        assertThat(print(medina, id, null).getResponse().getStatus()).isEqualTo(404);
        assertThat(isNull(record(torres, id).get("patientLockedAt"))).isTrue();
    }

    // --- Desbloqueo y eventos ---

    @Test
    void admin_unlock_without_request_registers_event_and_relocks_on_next_print() throws Exception {
        Session torres = register("Dra. Torres");
        Session admin = admin();
        long id = create(torres);
        print(torres, id, null);

        assertThat(unlock(admin, id).getResponse().getStatus()).isEqualTo(204);
        JsonNode unlocked = record(torres, id);
        assertThat(isNull(unlocked.get("patientLockedAt"))).isTrue();
        assertThat(unlocked.get("lastUnlock").get("byName").stringValue()).isEqualTo("Admin FACOP");
        assertThat(unlocked.get("lastUnlock").get("at").stringValue()).isEqualTo(NOW.toString());
        assertThat(jdbc.queryForObject("SELECT count(*) FROM record_unlock_events WHERE record_id = ? AND action = 'UNLOCKED'"
            + " AND reason IS NULL", Integer.class, id)).isEqualTo(1);

        assertThat(save(torres, id, Map.of("patientName", "Ana Lucía Quispe")).getResponse().getStatus()).isEqualTo(200);
        print(torres, id, null);
        assertThat(save(torres, id, Map.of("patientName", "Rosa Díaz")).getResponse().getStatus()).isEqualTo(409);
    }

    @Test
    void events_accumulate_and_the_last_unlock_is_shown() throws Exception {
        Session torres = register("Dra. Torres");
        Session first = admin();
        long id = create(torres);
        print(torres, id, null);
        unlock(first, id);
        print(torres, id, null);
        Session second = admin();
        jdbc.update("UPDATE users SET full_name = 'Admin Dos' WHERE id = ?", second.id());
        unlock(second, id);

        assertThat(jdbc.queryForObject("SELECT count(*) FROM record_unlock_events WHERE record_id = ?", Integer.class, id))
            .isEqualTo(2);
        assertThat(record(torres, id).get("lastUnlock").get("byName").stringValue()).isEqualTo("Admin Dos");
    }

    @Test
    void unlocking_a_record_that_is_not_locked_is_409_and_registers_nothing() throws Exception {
        Session torres = register("Dra. Torres");
        Session admin = admin();
        long id = create(torres);
        MvcResult result = unlock(admin, id);
        assertThat(result.getResponse().getStatus()).isEqualTo(409);
        assertThat(type(result)).isEqualTo("/errors/patient-not-locked");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM record_unlock_events WHERE record_id = ?", Integer.class, id))
            .isZero();
    }

    // --- Solicitudes ---

    @Test
    void request_then_admin_unlock_closes_it_and_keeps_the_reason_in_the_event() throws Exception {
        Session torres = register("Dra. Torres");
        Session admin = admin();
        long id = create(torres);
        print(torres, id, null);

        assertThat(request(torres, id, "Error en el número de DNI").getResponse().getStatus()).isEqualTo(204);
        JsonNode pending = record(torres, id).get("unlockRequest");
        assertThat(pending.get("reason").stringValue()).isEqualTo("Error en el número de DNI");
        assertThat(pending.get("requestedAt").stringValue()).isEqualTo(NOW.toString());

        unlock(admin, id);
        assertThat(isNull(record(torres, id).get("unlockRequest"))).isTrue();
        assertThat(jdbc.queryForObject("SELECT reason FROM record_unlock_events WHERE record_id = ?", String.class, id))
            .isEqualTo("Error en el número de DNI");
    }

    @Test
    void repeated_or_unlocked_requests_are_409() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        MvcResult notLocked = request(torres, id, "Error");
        assertThat(notLocked.getResponse().getStatus()).isEqualTo(409);
        assertThat(type(notLocked)).isEqualTo("/errors/patient-not-locked");

        print(torres, id, null);
        request(torres, id, "Error");
        MvcResult again = request(torres, id, "Otra vez");
        assertThat(again.getResponse().getStatus()).isEqualTo(409);
        assertThat(type(again)).isEqualTo("/errors/unlock-already-requested");
    }

    @Test
    void simultaneous_requests_leave_one() throws Exception {
        Session torres = register("Dra. Torres");
        long id = create(torres);
        print(torres, id, null);
        CountDownLatch start = new CountDownLatch(1);
        ExecutorService pool = Executors.newFixedThreadPool(2);
        try {
            List<Future<MvcResult>> results = new ArrayList<>();
            for (String reason : List.of("Motivo A", "Motivo B")) {
                results.add(pool.submit(() -> { start.await(); return request(torres, id, reason); }));
            }
            start.countDown();
            List<Integer> statuses = new ArrayList<>();
            for (Future<MvcResult> r : results) {
                statuses.add(r.get().getResponse().getStatus());
            }
            assertThat(statuses).containsExactlyInAnyOrder(204, 409);
        } finally {
            pool.shutdownNow();
        }
    }

    @Test
    void admin_discard_keeps_the_lock_registers_event_and_allows_a_new_request() throws Exception {
        Session torres = register("Dra. Torres");
        Session admin = admin();
        long id = create(torres);
        print(torres, id, null);
        request(torres, id, "Error en el DNI");

        assertThat(discard(admin, id).getResponse().getStatus()).isEqualTo(204);
        JsonNode after = record(torres, id);
        assertThat(isNull(after.get("unlockRequest"))).isTrue();
        assertThat(isNull(after.get("patientLockedAt"))).isFalse();
        assertThat(jdbc.queryForObject("SELECT action FROM record_unlock_events WHERE record_id = ?", String.class, id))
            .isEqualTo("DISCARDED");
        assertThat(request(torres, id, "Ahora sí").getResponse().getStatus()).isEqualTo(204);
        // Descartar sin solicitud no hace nada.
        discard(admin, id);
        assertThat(discard(admin, id).getResponse().getStatus()).isEqualTo(204);
    }

    // --- Listado ---

    @Test
    void list_shows_the_lock() throws Exception {
        Session torres = register("Dra. Torres");
        long printed = create(torres);
        create(torres);
        print(torres, printed, null);

        JsonNode page = read(mockMvc.perform(get(BASE).header("Authorization", "Bearer " + torres.token())).andReturn());
        page.get("content").forEach(row ->
            assertThat(row.get("patientLocked").asBoolean()).isEqualTo(row.get("id").asLong() == printed));
    }
}
