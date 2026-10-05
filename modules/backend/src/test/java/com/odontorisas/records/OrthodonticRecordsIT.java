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

    private static List<Integer> steps(JsonNode node) {
        List<Integer> out = new ArrayList<>();
        node.forEach(n -> out.add(n.asInt()));
        return out;
    }

    @Test
    void create_without_filled_steps_starts_with_step_1() throws Exception {
        Session torres = register("Dra. Torres");
        JsonNode created = createOk(torres, "Ana Quispe");
        assertThat(steps(created.get("filledSteps"))).containsExactly(1);
    }

    @Test
    void create_with_empty_filled_steps_starts_with_step_1() throws Exception {
        Session torres = register("Dra. Torres");
        MvcResult result = create(torres, "{\"patientName\":\"Ana Quispe\",\"filledSteps\":[]}");
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        assertThat(steps(read(result).get("filledSteps"))).containsExactly(1);
    }

    @Test
    void save_stores_and_returns_filled_steps() throws Exception {
        Session torres = register("Dra. Torres");
        long id = createOk(torres, "Ana Quispe").get("id").asLong();

        JsonNode saved = read(save(torres, id, "{\"version\":0,\"patientName\":\"Ana Quispe\",\"filledSteps\":[2,5]}"));
        assertThat(steps(saved.get("filledSteps"))).containsExactly(1, 2, 5);

        // Sin filledSteps, el guardado los conserva.
        JsonNode again = read(save(torres, id, "{\"version\":" + saved.get("version").asLong()
            + ",\"patientName\":\"Ana Lucía Quispe\"}"));
        assertThat(steps(again.get("filledSteps"))).containsExactly(1, 2, 5);
        assertThat(steps(read(getRecord(torres, id)).get("filledSteps"))).containsExactly(1, 2, 5);
    }

    @Test
    void old_record_is_not_computed() throws Exception {
        Session torres = register("Dra. Torres");
        long id = createOk(torres, "Ana Quispe").get("id").asLong();
        jdbc.update("UPDATE orthodontic_records SET filled_steps = NULL WHERE id = ?", id);

        JsonNode record = read(getRecord(torres, id));
        assertThat(record.get("filledSteps") == null || record.get("filledSteps").isNull()).isTrue();
    }

    @Test
    void last_step_is_saved_returned_and_kept_when_absent() throws Exception {
        Session torres = register("Dra. Torres");
        JsonNode created = createOk(torres, "Ana Quispe");
        long id = created.get("id").asLong();
        assertThat(created.get("lastStep").isNull()).isTrue();

        JsonNode saved = read(save(torres, id, "{\"version\":0,\"patientName\":\"Ana Quispe\",\"lastStep\":6}"));
        assertThat(saved.get("lastStep").asInt()).isEqualTo(6);

        // Sin lastStep, el guardado conserva el último paso.
        JsonNode again = read(save(torres, id, "{\"version\":" + saved.get("version").asLong()
            + ",\"patientName\":\"Ana Lucía Quispe\"}"));
        assertThat(again.get("lastStep").asInt()).isEqualTo(6);
        assertThat(read(getRecord(torres, id)).get("lastStep").asInt()).isEqualTo(6);

        // Fuera de rango: 400 en lastStep y no se guarda.
        MvcResult invalid = save(torres, id, "{\"version\":" + again.get("version").asLong()
            + ",\"patientName\":\"X\",\"lastStep\":9}");
        assertThat(invalid.getResponse().getStatus()).isEqualTo(400);
        assertThat(read(invalid).get("errors").get(0).get("field").stringValue()).isEqualTo("lastStep");
        assertThat(read(getRecord(torres, id)).get("patientName").stringValue()).isEqualTo("Ana Lucía Quispe");
    }

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
    void transversal_analysis_is_saved_and_a_record_without_models_still_opens_and_saves() throws Exception {
        Session torres = register("Dra. Torres");
        JsonNode created = createOk(torres, "Ana");
        long id = created.get("id").asLong();
        assertThat(created.get("content").get("models").get("transversal").isObject()).isTrue();

        // Historia guardada antes del análisis de modelos (schemaVersion 2, sin "models").
        jdbc.update("UPDATE orthodontic_records SET content = (content - 'models') || '{\"schemaVersion\":2}'::jsonb WHERE id = ?", id);
        JsonNode old = read(getRecord(torres, id));
        assertThat(old.get("content").get("models").get("transversal").get("walaToEv").isObject()).isTrue();

        ObjectNode body = json.createObjectNode();
        body.put("version", old.get("version").asLong());
        body.put("patientName", "Ana");
        ObjectNode transversal = body.putObject("content").putObject("models").putObject("transversal");
        transversal.put("intermolarUpper", 50.1).put("xIdealWidth", 50.0).put("interpretation", " Compresión leve ");
        transversal.putObject("walaToEv").put("firstMolar", 2.6);

        JsonNode saved = read(save(torres, id, json.writeValueAsString(body)));

        JsonNode t = saved.get("content").get("models").get("transversal");
        assertThat(t.get("intermolarUpper").decimalValue()).isEqualByComparingTo("50.1");
        assertThat(t.get("walaToEv").get("firstMolar").decimalValue()).isEqualByComparingTo("2.6");
        assertThat(t.get("interpretation").stringValue()).isEqualTo("Compresión leve");
        assertThat(saved.get("content").get("schemaVersion").asInt()).isEqualTo(7);
    }

    @Test
    void moyers_analysis_is_saved_with_a_date_before_treatment_and_a_record_without_it_still_opens() throws Exception {
        Session torres = register("Dra. Torres");
        long id = createOk(torres, "Ana").get("id").asLong();

        // Historia guardada antes del análisis de Moyers (schemaVersion 3, sin "moyers").
        jdbc.update("UPDATE orthodontic_records SET content = jsonb_set(content #- '{models,moyers}', '{schemaVersion}', '3') WHERE id = ?", id);
        JsonNode old = read(getRecord(torres, id));
        JsonNode emptyMoyers = old.get("content").get("models").get("moyers");
        assertThat(emptyMoyers.get("lowerIncisors").isObject()).isTrue();
        assertThat(emptyMoyers.get("availableSpace").isObject()).isTrue();

        ObjectNode body = json.createObjectNode();
        body.put("version", old.get("version").asLong());
        body.put("patientName", "Ana");
        body.put("treatmentStartDate", "2026-09-15");
        ObjectNode moyers = body.putObject("content").putObject("models").putObject("moyers");
        moyers.put("analysisDate", "2026-09-01").put("interpretation", " Discrepancia negativa ")
            .put("crowdingNegative", " Mandíbula derecho ");
        moyers.putObject("lowerIncisors").put("tooth42", 6.0).put("tooth41", 5.5).put("tooth31", 5.4).put("tooth32", 6.1);
        moyers.putObject("availableSpace").put("mandibleRight", 21.0).put("maxillaLeft", 22.6);

        JsonNode saved = read(save(torres, id, json.writeValueAsString(body)));

        JsonNode y = saved.get("content").get("models").get("moyers");
        assertThat(y.get("analysisDate").stringValue()).isEqualTo("2026-09-01");
        assertThat(y.get("lowerIncisors").get("tooth32").decimalValue()).isEqualByComparingTo("6.1");
        assertThat(y.get("availableSpace").get("mandibleRight").decimalValue()).isEqualByComparingTo("21.0");
        assertThat(y.get("crowdingNegative").stringValue()).isEqualTo("Mandíbula derecho");
        assertThat(y.get("crowdingPositive").isNull()).isTrue();
        assertThat(y.get("interpretation").stringValue()).isEqualTo("Discrepancia negativa");
        assertThat(saved.get("content").get("schemaVersion").asInt()).isEqualTo(7);
        assertThat(jdbc.queryForObject("SELECT content->'models'->'moyers'->>'analysisDate' FROM orthodontic_records WHERE id = ?",
            String.class, id)).isEqualTo("2026-09-01");
    }

    @Test
    void nance_analysis_is_saved_and_a_record_without_it_still_opens() throws Exception {
        Session torres = register("Dra. Torres");
        long id = createOk(torres, "Ana").get("id").asLong();

        // Historia guardada antes del análisis de Nance (schemaVersion 4, sin "nance").
        jdbc.update("UPDATE orthodontic_records SET content = jsonb_set(content #- '{models,nance}', '{schemaVersion}', '4') WHERE id = ?", id);
        JsonNode old = read(getRecord(torres, id));
        assertThat(old.get("content").get("models").get("nance").get("upperWidths").isObject()).isTrue();

        ObjectNode body = json.createObjectNode();
        body.put("version", old.get("version").asLong());
        body.put("patientName", "Ana");
        ObjectNode nance = body.putObject("content").putObject("models").putObject("nance");
        nance.put("analysisDate", "2026-09-01").put("availableUpper", 70.5).put("conclusionUpper", " Falta de espacio leve ");
        nance.putObject("upperWidths").put("tooth15", 7.0).put("tooth25", 6.9);
        nance.putObject("lowerWidths").put("tooth31", 5.4);

        JsonNode saved = read(save(torres, id, json.writeValueAsString(body)));

        JsonNode n = saved.get("content").get("models").get("nance");
        assertThat(n.get("availableUpper").decimalValue()).isEqualByComparingTo("70.5");
        assertThat(n.get("upperWidths").get("tooth25").decimalValue()).isEqualByComparingTo("6.9");
        assertThat(n.get("lowerWidths").get("tooth31").decimalValue()).isEqualByComparingTo("5.4");
        assertThat(n.get("conclusionUpper").stringValue()).isEqualTo("Falta de espacio leve");
        assertThat(saved.get("content").get("schemaVersion").asInt()).isEqualTo(7);
    }

    @Test
    void bolton_analysis_is_saved_and_a_record_without_it_still_opens() throws Exception {
        Session torres = register("Dra. Torres");
        long id = createOk(torres, "Ana").get("id").asLong();

        // Historia guardada antes del análisis de Bolton (schemaVersion 5, sin "bolton").
        jdbc.update("UPDATE orthodontic_records SET content = jsonb_set(content #- '{models,bolton}', '{schemaVersion}', '5') WHERE id = ?", id);
        JsonNode old = read(getRecord(torres, id));
        assertThat(old.get("content").get("models").get("bolton").get("firstMolars").isObject()).isTrue();

        ObjectNode body = json.createObjectNode();
        body.put("version", old.get("version").asLong());
        body.put("patientName", "Ana");
        ObjectNode models = body.putObject("content").putObject("models");
        ObjectNode bolton = models.putObject("bolton");
        bolton.put("analysisDate", "2026-09-01").put("interpretation", " Exceso mandibular ");
        bolton.putObject("firstMolars").put("tooth16", 10.2).put("tooth36", 11.2);
        bolton.putObject("incisors").put("tooth11", 8.7);
        models.putObject("nance").putObject("upperWidths").put("tooth11", 8.6);

        JsonNode saved = read(save(torres, id, json.writeValueAsString(body)));

        JsonNode b = saved.get("content").get("models").get("bolton");
        assertThat(b.get("firstMolars").get("tooth16").decimalValue()).isEqualByComparingTo("10.2");
        assertThat(b.get("firstMolars").get("tooth36").decimalValue()).isEqualByComparingTo("11.2");
        assertThat(b.get("interpretation").stringValue()).isEqualTo("Exceso mandibular");
        // Incisivos propios de Bolton: la misma pieza puede valer distinto en Nance.
        assertThat(b.get("incisors").get("tooth11").decimalValue()).isEqualByComparingTo("8.7");
        assertThat(saved.get("content").get("models").get("nance").get("upperWidths").get("tooth11").decimalValue())
            .isEqualByComparingTo("8.6");
        assertThat(saved.get("content").get("schemaVersion").asInt()).isEqualTo(7);
    }

    @Test
    void without_session_is_401() throws Exception {
        mockMvc.perform(post(BASE).contentType(MediaType.APPLICATION_JSON).content("{\"patientName\":\"Ana\"}"))
            .andExpect(status().isUnauthorized());
    }

    // --- Cupo de historias por tratante (add-record-quota) ---

    private static final String QUOTA_DETAIL = "Alcanzaste el máximo de 2 historias clínicas. Comunícate con el administrador para solicitar más.";

    private JsonNode quota(Session as) throws Exception {
        return read(mockMvc.perform(get(BASE + "/quota").header("Authorization", "Bearer " + as.token())).andReturn());
    }

    private void setQuota(Session admin, long userId, String value) throws Exception {
        MvcResult result = mockMvc.perform(org.springframework.test.web.servlet.request.MockMvcRequestBuilders
                .patch("/api/users/" + userId + "/record-quota").header("Authorization", "Bearer " + admin.token())
                .contentType(MediaType.APPLICATION_JSON).content("{\"recordQuota\":" + value + "}"))
            .andReturn();
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void without_quota_a_user_creates_freely_and_quota_reports_no_limit() throws Exception {
        Session torres = register("Dra. Torres");
        createOk(torres, "Ana");
        createOk(torres, "Luis");
        JsonNode q = quota(torres);
        assertThat(q.get("limit").isNull()).isTrue();
        assertThat(q.get("used").asLong()).isEqualTo(2);
        assertThat(q.get("reached").asBoolean()).isFalse();
    }

    @Test
    void full_quota_rejects_creation_with_409_but_editing_still_works() throws Exception {
        Session admin = admin();
        Session torres = register("Dra. Torres");
        setQuota(admin, torres.id(), "2");
        long first = createOk(torres, "Ana").get("id").asLong();
        createOk(torres, "Luis");

        MvcResult rejected = create(torres, "{\"patientName\":\"Rosa\"}");
        assertThat(rejected.getResponse().getStatus()).isEqualTo(409);
        JsonNode problem = read(rejected);
        assertThat(problem.get("type").stringValue()).endsWith("/errors/record-quota-reached");
        assertThat(problem.get("detail").stringValue()).isEqualTo(QUOTA_DETAIL);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM orthodontic_records WHERE author_id = ?", Long.class, torres.id()))
            .isEqualTo(2);
        assertThat(quota(torres).get("reached").asBoolean()).isTrue();

        // Editar una existente con el cupo lleno funciona igual.
        JsonNode loaded = read(getRecord(torres, first));
        MvcResult saved = save(torres, first, "{\"version\":" + loaded.get("version").asLong() + ",\"patientName\":\"Ana María\"}");
        assertThat(saved.getResponse().getStatus()).isEqualTo(200);
    }

    @Test
    void quota_below_what_was_created_keeps_the_records_and_blocks_new_ones() throws Exception {
        Session admin = admin();
        Session torres = register("Dra. Torres");
        createOk(torres, "Ana");
        createOk(torres, "Luis");
        createOk(torres, "Rosa");
        setQuota(admin, torres.id(), "2");

        assertThat(create(torres, "{\"patientName\":\"Pía\"}").getResponse().getStatus()).isEqualTo(409);
        assertThat(numbers(list(torres, null))).hasSize(3);
    }

    @Test
    void zero_quota_allows_no_records() throws Exception {
        Session admin = admin();
        Session torres = register("Dra. Torres");
        setQuota(admin, torres.id(), "0");
        assertThat(create(torres, "{\"patientName\":\"Ana\"}").getResponse().getStatus()).isEqualTo(409);
        assertThat(quota(torres).get("reached").asBoolean()).isTrue();
    }

    @Test
    void admin_never_has_a_quota() throws Exception {
        Session admin = admin();
        jdbc.update("UPDATE users SET record_quota = 0 WHERE id = ?", admin.id());
        createOk(admin, "Ana");
        JsonNode q = quota(admin);
        assertThat(q.get("limit").isNull()).isTrue();
        assertThat(q.get("used").asLong()).isEqualTo(1);
        assertThat(q.get("reached").asBoolean()).isFalse();
    }

    @Test
    void concurrent_creations_cannot_exceed_the_quota() throws Exception {
        Session admin = admin();
        Session torres = register("Dra. Torres");
        setQuota(admin, torres.id(), "2");
        createOk(torres, "Ana");

        int threads = 4;
        ExecutorService pool = Executors.newFixedThreadPool(threads);
        CountDownLatch start = new CountDownLatch(1);
        List<Future<Integer>> results = new ArrayList<>();
        for (int i = 0; i < threads; i++) {
            int n = i;
            Callable<Integer> task = () -> {
                start.await();
                return create(torres, "{\"patientName\":\"Paciente " + n + "\"}").getResponse().getStatus();
            };
            results.add(pool.submit(task));
        }
        start.countDown();
        List<Integer> statuses = new ArrayList<>();
        for (Future<Integer> f : results) {
            statuses.add(f.get());
        }
        pool.shutdown();

        assertThat(statuses).filteredOn(s -> s == 201).hasSize(1);
        assertThat(statuses).filteredOn(s -> s == 409).hasSize(threads - 1);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM orthodontic_records WHERE author_id = ?", Long.class, torres.id()))
            .isEqualTo(2);
    }

    @Test
    void users_listing_includes_quota_and_record_count() throws Exception {
        Session admin = admin();
        Session torres = register("Dra. Torres");
        setQuota(admin, torres.id(), "5");
        createOk(torres, "Ana");
        createOk(torres, "Luis");
        createOk(torres, "Rosa");

        // La BD de los IT es compartida y el listado va por id: la cuenta nueva puede caer en cualquier página.
        JsonNode row = null;
        JsonNode page;
        int number = 0;
        do {
            page = read(mockMvc.perform(get("/api/users").param("size", "100").param("page", String.valueOf(number++))
                .header("Authorization", "Bearer " + admin.token())).andReturn());
            for (JsonNode r : page.get("content")) {
                if (r.get("id").asLong() == torres.id()) {
                    row = r;
                }
            }
        } while (row == null && !page.get("last").asBoolean());
        assertThat(row).isNotNull();
        assertThat(row.get("recordQuota").asInt()).isEqualTo(5);
        assertThat(row.get("recordCount").asLong()).isEqualTo(3);
    }
}
