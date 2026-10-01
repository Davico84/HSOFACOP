package com.odontorisas.records;

import com.odontorisas.AbstractIntegrationTest;
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
import tools.jackson.databind.node.ObjectNode;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.Callable;
import java.util.concurrent.CountDownLatch;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;
import java.util.concurrent.Future;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/** Scenarios de orthodontic-records de punta a punta (JWT real, service, PostgreSQL). */
@SpringBootTest
@AutoConfigureMockMvc
class OrthodonticRecordsIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String BASE = "/api/orthodontic-records";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String fullName, String token) {}

    private JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Session register(String fullName) throws Exception {
        String email = "rec-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"" + fullName + "\"}"))
            .andExpect(status().isCreated()).andReturn();
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), fullName, node.get("accessToken").stringValue());
    }

    /** Un ADMIN: se registra, se promueve en BD y vuelve a entrar (el rol va en el token). */
    private Session admin() throws Exception {
        Session user = register("Dr. Supervisor");
        String email = jdbc.queryForObject("SELECT email FROM users WHERE id = ?", String.class, user.id());
        jdbc.update("UPDATE users SET role = 'ADMIN' WHERE id = ?", user.id());
        MvcResult login = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\"}")).andReturn();
        return new Session(user.id(), user.fullName(), read(login).get("accessToken").stringValue());
    }

    private MvcResult create(Session as, String body) throws Exception {
        return mockMvc.perform(post(BASE).header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
    }

    private JsonNode createOk(Session as, String patient) throws Exception {
        MvcResult result = create(as, "{\"patientName\":\"" + patient + "\"}");
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        return read(result);
    }

    private MvcResult getRecord(Session as, long id) throws Exception {
        return mockMvc.perform(get(BASE + "/" + id).header("Authorization", "Bearer " + as.token())).andReturn();
    }

    private MvcResult save(Session as, long id, String body) throws Exception {
        return mockMvc.perform(put(BASE + "/" + id).header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
    }

    private JsonNode list(Session as, String q) throws Exception {
        var request = get(BASE).header("Authorization", "Bearer " + as.token());
        if (q != null) {
            request.param("q", q);
        }
        return read(mockMvc.perform(request).andReturn());
    }

    private static List<String> numbers(JsonNode page) {
        List<String> out = new ArrayList<>();
        page.get("content").forEach(row -> out.add(row.get("recordNumber").stringValue()));
        return out;
    }

    // --- Creación y correlativo ---

    @Test
    void user_creates_records_with_consecutive_numbers_and_is_the_author() throws Exception {
        Session torres = register("Dra. María Torres");

        JsonNode first = createOk(torres, "Ana Quispe");
        JsonNode second = createOk(torres, "Luis Mamani");

        assertThat(first.get("recordNumber").stringValue()).isEqualTo("AEO-001");
        assertThat(second.get("recordNumber").stringValue()).isEqualTo("AEO-002");
        assertThat(first.get("authorId").asLong()).isEqualTo(torres.id());
        assertThat(first.get("treatingDentist").stringValue()).isEqualTo("Dra. María Torres");
    }

    @Test
    void numbers_are_independent_per_user() throws Exception {
        Session a = register("Dra. Ana");
        Session b = register("Dr. Beto");
        createOk(a, "P1");
        createOk(a, "P2");

        assertThat(createOk(a, "P3").get("recordNumber").stringValue()).isEqualTo("AEO-003");
        assertThat(createOk(b, "P1").get("recordNumber").stringValue()).isEqualTo("AEO-001");
    }

    @Test
    void simultaneous_creations_of_the_same_user_get_distinct_consecutive_numbers() throws Exception {
        Session torres = register("Dra. Torres");
        int n = 4;
        ExecutorService pool = Executors.newFixedThreadPool(n);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<MvcResult>> futures = new ArrayList<>();
        for (int i = 0; i < n; i++) {
            Callable<MvcResult> task = () -> {
                start.await();
                return create(torres, "{\"patientName\":\"Paciente\"}");
            };
            futures.add(pool.submit(task));
        }
        start.countDown();
        List<String> created = new ArrayList<>();
        for (Future<MvcResult> f : futures) {
            MvcResult r = f.get();
            assertThat(r.getResponse().getStatus()).isEqualTo(201);
            created.add(read(r).get("recordNumber").stringValue());
        }
        pool.shutdown();

        assertThat(created).containsExactlyInAnyOrder("AEO-001", "AEO-002", "AEO-003", "AEO-004");
    }

    @Test
    void sent_record_number_is_ignored() throws Exception {
        Session torres = register("Dra. Torres");
        JsonNode created = createOk(torres, "Ana");
        long id = created.get("id").asLong();

        MvcResult saved = save(torres, id, "{\"version\":" + created.get("version").asLong()
            + ",\"patientName\":\"Ana\",\"recordNumber\":\"AEO-999\"}");

        assertThat(read(saved).get("recordNumber").stringValue()).isEqualTo("AEO-001");
    }

    // --- Alcance ---

    @Test
    void user_lists_only_own_records() throws Exception {
        Session torres = register("Dra. Torres");
        Session medina = register("Dr. Medina");
        createOk(torres, "Ana Quispe");
        createOk(medina, "Rosa Quispe");

        JsonNode page = list(torres, null);

        assertThat(page.get("totalElements").asLong()).isEqualTo(1);
        assertThat(page.get("content").get(0).get("patientName").stringValue()).isEqualTo("Ana Quispe");
    }

    @Test
    void another_user_gets_404_reading_or_saving() throws Exception {
        Session torres = register("Dra. Torres");
        Session medina = register("Dr. Medina");
        JsonNode created = createOk(torres, "Ana");
        long id = created.get("id").asLong();

        assertThat(getRecord(medina, id).getResponse().getStatus()).isEqualTo(404);
        MvcResult saving = save(medina, id, "{\"version\":0,\"patientName\":\"Hackeada\"}");
        assertThat(saving.getResponse().getStatus()).isEqualTo(404);
        assertThat(saving.getResponse().getContentAsString(StandardCharsets.UTF_8)).doesNotContain("Ana");
        assertThat(jdbc.queryForObject("SELECT patient_name FROM orthodontic_records WHERE id = ?", String.class, id))
            .isEqualTo("Ana");
    }

    @Test
    void admin_lists_everyone_with_author_and_saves_keeping_the_author() throws Exception {
        Session torres = register("Dra. Torres");
        Session supervisor = admin();
        JsonNode created = createOk(torres, "Paciente Única " + UUID.randomUUID());
        long id = created.get("id").asLong();

        JsonNode page = list(supervisor, created.get("patientName").stringValue());
        assertThat(page.get("content").get(0).get("authorName").stringValue()).isEqualTo("Dra. Torres");

        MvcResult saved = save(supervisor, id, "{\"version\":" + created.get("version").asLong()
            + ",\"patientName\":\"Corregida por supervisor\"}");
        assertThat(saved.getResponse().getStatus()).isEqualTo(200);
        assertThat(read(saved).get("authorId").asLong()).isEqualTo(torres.id());
        assertThat(read(getRecord(torres, id)).get("patientName").stringValue()).isEqualTo("Corregida por supervisor");
    }

    // --- Búsqueda ---

    @Test
    void search_ignores_accents_and_case_and_finds_by_document_or_number() throws Exception {
        Session torres = register("Dra. Torres");
        createOk(torres, "Ana QUÍSPE");
        create(torres, "{\"patientName\":\"Luis\",\"documentType\":\"DNI\",\"documentNumber\":\"74125896\"}");

        assertThat(numbers(list(torres, "quispe"))).containsExactly("AEO-001");
        assertThat(numbers(list(torres, "74125896"))).containsExactly("AEO-002");
        assertThat(numbers(list(torres, "aeo-002"))).containsExactly("AEO-002");
        assertThat(list(torres, "zzz").get("content")).isEmpty();
    }

    // --- Edición concurrente ---

    @Test
    void second_save_with_the_same_version_is_409_without_changes() throws Exception {
        Session torres = register("Dra. Torres");
        JsonNode created = createOk(torres, "Ana");
        long id = created.get("id").asLong();
        long version = created.get("version").asLong();

        MvcResult first = save(torres, id, "{\"version\":" + version + ",\"patientName\":\"Primera\"}");
        MvcResult second = save(torres, id, "{\"version\":" + version + ",\"patientName\":\"Segunda\"}");

        assertThat(first.getResponse().getStatus()).isEqualTo(200);
        assertThat(read(first).get("version").asLong()).isGreaterThan(version);
        assertThat(second.getResponse().getStatus()).isEqualTo(409);
        assertThat(read(second).get("type").stringValue()).isEqualTo("/errors/stale-record");
        assertThat(read(getRecord(torres, id)).get("patientName").stringValue()).isEqualTo("Primera");
    }

    // --- Contenido ---

    @Test
    void content_is_saved_and_conditional_fields_are_discarded() throws Exception {
        Session torres = register("Dra. Torres");
        JsonNode created = createOk(torres, "Juan");
        long id = created.get("id").asLong();
        ObjectNode body = json.createObjectNode();
        body.put("version", created.get("version").asLong());
        body.put("patientName", "Juan");
        body.put("patientSex", "MALE");
        body.put("birthDate", "2012-05-20");
        body.put("treatmentStartDate", "2026-05-19");
        ObjectNode content = body.putObject("content");
        content.putObject("anamnesis").put("chiefComplaint", "  Dientes salidos ").put("menarche", "NO");
        content.putObject("functional").put("bruxism", "WITHOUT_WEAR").putArray("bruxismTeeth").add(16);
        content.putObject("occlusal").put("vertical", "DEEP_BITE").put("deepBitePercent", 60).put("openBiteMm", 3);
        content.putObject("signatures").put("patientSignatureName", "Juan").put("guardianName", "Rosa");

        JsonNode saved = read(save(torres, id, json.writeValueAsString(body)));

        assertThat(saved.get("ageYears").asInt()).isEqualTo(13);
        JsonNode c = saved.get("content");
        assertThat(c.get("anamnesis").get("chiefComplaint").stringValue()).isEqualTo("Dientes salidos");
        assertThat(c.get("anamnesis").get("menarche").isNull()).isTrue();
        assertThat(c.get("functional").get("bruxismTeeth")).isEmpty();
        assertThat(c.get("occlusal").get("deepBitePercent").decimalValue()).isEqualByComparingTo("60");
        assertThat(c.get("occlusal").get("openBiteMm").isNull()).isTrue();
        assertThat(c.get("signatures").get("guardianName").stringValue()).isEqualTo("Rosa");
        assertThat(c.get("signatures").get("patientSignatureName").isNull()).isTrue();
        // Persistido en JSONB tal como se devolvió.
        assertThat(jdbc.queryForObject("SELECT content->'occlusal'->>'openBiteMm' FROM orthodontic_records WHERE id = ?",
            String.class, id)).isNull();
    }

    @Test
    void without_session_is_401() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{\"patientName\":\"Ana\"}"))
            .andExpect(status().isUnauthorized());
    }
}
