package com.odontorisas.cohorts;

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

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

import static com.odontorisas.TestRecordNumbers.next;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/** Scenarios de cohorts (y de los cambios en users y orthodontic-records) de punta a punta, contra PostgreSQL real. */
@SpringBootTest(properties = "app.records.default-quota=5")
@AutoConfigureMockMvc
class CohortsCoordinatorIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";
    private static final String RECORDS = "/api/orthodontic-records";
    private static final int DEFAULT_QUOTA = 5;
    private static final List<Integer> ALL_CLINICAL = List.of(1, 2, 3, 4, 5, 6, 7);

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String email, String fullName, String token) {}

    // --- Ayudas ---

    private JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Session register(String fullName) throws Exception {
        String email = "coh-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"" + fullName + "\"}"))
            .andReturn();
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), email, fullName, node.get("accessToken").stringValue());
    }

    /** Vuelve a entrar: el token lleva el rol leído de la base. */
    private Session relogin(Session s) throws Exception {
        MvcResult login = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + s.email() + "\",\"password\":\"" + PASSWORD + "\"}")).andReturn();
        assertThat(login.getResponse().getStatus()).isEqualTo(200);
        return new Session(s.id(), s.email(), s.fullName(), read(login).get("accessToken").stringValue());
    }

    private Session admin() throws Exception {
        Session user = register("Dr. Supervisor");
        jdbc.update("UPDATE users SET role = 'ADMIN', record_quota = NULL WHERE id = ?", user.id());
        return relogin(user);
    }

    private MvcResult send(Session as, org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder request,
                           String body) throws Exception {
        request.header("Authorization", "Bearer " + as.token());
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request).andReturn();
    }

    private static String unique(String base) {
        return base + " " + UUID.randomUUID().toString().substring(0, 8);
    }

    private long createCohort(Session admin, String name) throws Exception {
        MvcResult result = send(admin, post("/api/cohorts"), "{\"name\":\"" + name + "\"}");
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        return read(result).get("id").asLong();
    }

    private JsonNode cohorts(Session as) throws Exception {
        MvcResult result = send(as, get("/api/cohorts"), null);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        return read(result);
    }

    private static JsonNode cohortById(JsonNode list, long id) {
        for (JsonNode c : list) {
            if (c.get("id").asLong() == id) {
                return c;
            }
        }
        return null;
    }

    private MvcResult assignCohort(Session admin, long userId, Long cohortId) throws Exception {
        return send(admin, patch("/api/users/" + userId + "/cohort"), "{\"cohortId\":" + cohortId + "}");
    }

    private MvcResult changeRole(Session admin, long userId, String role, List<Long> cohortIds) throws Exception {
        String ids = cohortIds == null ? "null" : cohortIds.toString();
        return send(admin, patch("/api/users/" + userId + "/role"), "{\"role\":\"" + role + "\",\"cohortIds\":" + ids + "}");
    }

    /** Alumno en esa turma (o sin turma si es nula). */
    private Session student(Session admin, String name, Long cohortId) throws Exception {
        Session s = register(name);
        if (cohortId != null) {
            assertThat(assignCohort(admin, s.id(), cohortId).getResponse().getStatus()).isEqualTo(200);
        }
        return s;
    }

    /** Coordinación de esas turmas, con su token ya renovado. */
    private Session coordinator(Session admin, List<Long> cohortIds) throws Exception {
        Session s = register("Dra. Coordinación");
        assertThat(changeRole(admin, s.id(), "COORDINATOR", cohortIds).getResponse().getStatus()).isEqualTo(200);
        return relogin(s);
    }

    private long createRecord(Session as, String patient, List<Integer> filledSteps) throws Exception {
        String steps = filledSteps == null ? "" : ",\"filledSteps\":" + filledSteps;
        MvcResult result = send(as, post(RECORDS),
            "{\"recordNumber\":\"" + next() + "\",\"patientName\":\"" + patient + "\"" + steps + "}");
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        return read(result).get("id").asLong();
    }

    private JsonNode listRecords(Session as, Long cohortId) throws Exception {
        var request = get(RECORDS).param("size", "100");
        if (cohortId != null) {
            request.param("cohortId", cohortId.toString());
        }
        MvcResult result = send(as, request, null);
        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        return read(result);
    }

    private static List<Long> ids(JsonNode page) {
        List<Long> out = new ArrayList<>();
        page.get("content").forEach(row -> out.add(row.get("id").asLong()));
        return out;
    }

    private JsonNode userRow(Session admin, long userId) throws Exception {
        MvcResult result = send(admin, get("/api/users").param("size", "100").param("page", "0"), null);
        JsonNode page = read(result);
        int pages = page.get("totalPages").asInt();
        for (int p = 0; p < pages; p++) {
            JsonNode current = p == 0 ? page
                : read(send(admin, get("/api/users").param("size", "100").param("page", String.valueOf(p)), null));
            for (JsonNode row : current.get("content")) {
                if (row.get("id").asLong() == userId) {
                    return row;
                }
            }
        }
        throw new AssertionError("La cuenta " + userId + " no aparece en el listado");
    }

    private String roleOf(long id) {
        return jdbc.queryForObject("SELECT role FROM users WHERE id = ?", String.class, id);
    }

    private List<Long> coordinatorCohortsOf(long id) {
        return jdbc.queryForList("SELECT cohort_id FROM coordinator_cohorts WHERE user_id = ? ORDER BY cohort_id",
            Long.class, id);
    }

    /** Campo ausente o nulo en la respuesta. */
    private static boolean absent(JsonNode node) {
        return node == null || node.isNull();
    }

    private static String detail(JsonNode problem) {
        return problem.get("detail").stringValue();
    }

    // --- Migración ---

    @Test
    void database_rejects_unknown_roles_and_a_cohort_on_non_students() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma M"));
        Session ana = register("Ana");

        assertThatThrownBy(() -> jdbc.update("UPDATE users SET role = 'ROOT' WHERE id = ?", ana.id()))
            .hasMessageContaining("ck_users_role");
        assertThatThrownBy(() -> jdbc.update("UPDATE users SET cohort_id = ? WHERE id = ?", cohort, admin.id()))
            .hasMessageContaining("ck_users_cohort_only_user");
        // Mismo nombre normalizado con un código propio (V19 lo exige): choca solo con el índice del nombre.
        String freeCode = jdbc.queryForObject("SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789',"
            + " 1 + floor(random() * 32)::int, 1), '') FROM generate_series(1, 8)", String.class);
        assertThatThrownBy(() -> jdbc.update("INSERT INTO cohorts (name, name_key, registration_code) VALUES ('X', ?, ?)",
                jdbc.queryForObject("SELECT name_key FROM cohorts WHERE id = ?", String.class, cohort), freeCode))
            .hasMessageContaining("ux_cohorts_name_key");
    }

    // --- Turmas gestionadas por el ADMIN ---

    @Test
    void admin_creates_a_cohort_listed_with_zero_students_and_coordinators() throws Exception {
        Session admin = admin();
        String name = unique("Turma 1");

        long id = createCohort(admin, "  " + name.replace(" ", "   ") + " ");

        JsonNode created = cohortById(cohorts(admin), id);
        assertThat(created.get("name").stringValue()).isEqualTo(name);
        assertThat(created.get("students").asLong()).isZero();
        assertThat(created.get("coordinators").asLong()).isZero();
    }

    @Test
    void repeated_name_on_create_or_rename_is_rejected_with_409_and_nothing_changes() throws Exception {
        Session admin = admin();
        String name = unique("Turma 1");
        createCohort(admin, name);
        long other = createCohort(admin, unique("Turma 2"));
        String otherName = cohortById(cohorts(admin), other).get("name").stringValue();
        String variant = " " + name.toLowerCase() + " ";

        MvcResult onCreate = send(admin, post("/api/cohorts"), "{\"name\":\"" + variant + "\"}");
        MvcResult onRename = send(admin, patch("/api/cohorts/" + other), "{\"name\":\"" + variant + "\"}");

        assertThat(onCreate.getResponse().getStatus()).isEqualTo(409);
        assertThat(detail(read(onCreate))).isEqualTo("Ya existe una turma con ese nombre.");
        assertThat(onRename.getResponse().getStatus()).isEqualTo(409);
        assertThat(detail(read(onRename))).isEqualTo("Ya existe una turma con ese nombre.");
        assertThat(cohortById(cohorts(admin), other).get("name").stringValue()).isEqualTo(otherName);
    }

    @Test
    void renaming_keeps_students_and_coordinators_with_the_new_name() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 2"));
        Session ana = student(admin, "Ana", cohort);
        Session coord = coordinator(admin, List.of(cohort));
        String renamed = unique("Turma 2 – 2026");

        MvcResult result = send(admin, patch("/api/cohorts/" + cohort), "{\"name\":\"" + renamed + "\"}");

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode row = cohortById(cohorts(admin), cohort);
        assertThat(row.get("name").stringValue()).isEqualTo(renamed);
        assertThat(row.get("students").asLong()).isEqualTo(1);
        assertThat(row.get("coordinators").asLong()).isEqualTo(1);
        assertThat(userRow(admin, ana.id()).get("cohort").get("name").stringValue()).isEqualTo(renamed);
        assertThat(cohorts(coord).get(0).get("name").stringValue()).isEqualTo(renamed);
    }

    @Test
    void coordinator_lists_only_its_cohorts_with_id_and_name() throws Exception {
        Session admin = admin();
        long one = createCohort(admin, unique("Turma 1"));
        long two = createCohort(admin, unique("Turma 2"));
        createCohort(admin, unique("Turma 3"));
        Session coord = coordinator(admin, List.of(one, two));

        JsonNode list = cohorts(coord);

        assertThat(list).hasSize(2);
        assertThat(List.of(list.get(0).get("id").asLong(), list.get(1).get("id").asLong()))
            .containsExactlyInAnyOrder(one, two);
        assertThat(absent(list.get(0).get("students"))).isTrue();
    }

    @Test
    void other_roles_cannot_manage_cohorts() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session user = register("Ana");
        Session coord = coordinator(admin, List.of(cohort));

        assertThat(send(user, get("/api/cohorts"), null).getResponse().getStatus()).isEqualTo(403);
        assertThat(send(user, post("/api/cohorts"), "{\"name\":\"X\"}").getResponse().getStatus()).isEqualTo(403);
        assertThat(send(coord, post("/api/cohorts"), "{\"name\":\"X\"}").getResponse().getStatus()).isEqualTo(403);
        assertThat(send(user, patch("/api/cohorts/" + cohort), "{\"name\":\"X\"}").getResponse().getStatus()).isEqualTo(403);
        assertThat(send(coord, patch("/api/cohorts/" + cohort), "{\"name\":\"X\"}").getResponse().getStatus()).isEqualTo(403);
    }

    // --- Turma del alumno ---

    @Test
    void assigning_and_removing_the_cohort_changes_what_the_coordinator_sees_at_once() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session coord = coordinator(admin, List.of(cohort));
        Session ana = register("Ana");
        long record = createRecord(ana, "Paciente A", null);
        assertThat(ids(listRecords(coord, null))).doesNotContain(record);

        assertThat(assignCohort(admin, ana.id(), cohort).getResponse().getStatus()).isEqualTo(200);
        assertThat(ids(listRecords(coord, null))).contains(record);
        assertThat(userRow(admin, ana.id()).get("recordQuota").asInt()).isEqualTo(DEFAULT_QUOTA);

        assertThat(assignCohort(admin, ana.id(), null).getResponse().getStatus()).isEqualTo(200);
        assertThat(ids(listRecords(coord, null))).doesNotContain(record);
        assertThat(send(coord, get(RECORDS + "/" + record), null).getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void a_student_cohort_for_an_admin_or_coordinator_account_is_rejected() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session coord = coordinator(admin, List.of(cohort));

        assertThat(assignCohort(admin, admin.id(), cohort).getResponse().getStatus()).isEqualTo(409);
        assertThat(assignCohort(admin, coord.id(), cohort).getResponse().getStatus()).isEqualTo(409);
        assertThat(jdbc.queryForObject("SELECT cohort_id FROM users WHERE id = ?", Long.class, coord.id())).isNull();
    }

    // --- Cuentas de coordinación ---

    @Test
    void converting_a_user_without_records_makes_it_coordinator_without_cohort_or_quota() throws Exception {
        Session admin = admin();
        long one = createCohort(admin, unique("Turma 1"));
        long two = createCohort(admin, unique("Turma 2"));
        Session ana = student(admin, "Ana", one);

        MvcResult result = changeRole(admin, ana.id(), "COORDINATOR", List.of(one, two));

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode row = userRow(admin, ana.id());
        assertThat(row.get("role").stringValue()).isEqualTo("COORDINATOR");
        assertThat(absent(row.get("cohort"))).isTrue();
        assertThat(absent(row.get("recordQuota"))).isTrue();
        List<Long> coordinated = new ArrayList<>();
        row.get("coordinatorCohorts").forEach(c -> coordinated.add(c.get("id").asLong()));
        assertThat(coordinated).containsExactlyInAnyOrder(one, two);
    }

    @Test
    void an_account_with_records_cannot_become_coordinator() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session ana = register("Ana");
        createRecord(ana, "Paciente A", null);

        MvcResult result = changeRole(admin, ana.id(), "COORDINATOR", List.of(cohort));

        assertThat(result.getResponse().getStatus()).isEqualTo(409);
        assertThat(detail(read(result))).isEqualTo("La cuenta tiene historias clínicas: no puede pasar a coordinación.");
        assertThat(roleOf(ana.id())).isEqualTo("USER");
        assertThat(coordinatorCohortsOf(ana.id())).isEmpty();
    }

    @Test
    void a_converted_account_cannot_create_with_its_previous_user_session() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session ana = register("Ana");
        assertThat(changeRole(admin, ana.id(), "COORDINATOR", List.of(cohort)).getResponse().getStatus()).isEqualTo(200);

        MvcResult result = send(ana, post(RECORDS), "{\"recordNumber\":\"" + next() + "\",\"patientName\":\"X\"}");

        assertThat(result.getResponse().getStatus()).isEqualTo(403);
        assertThat(jdbc.queryForObject("SELECT count(*) FROM orthodontic_records WHERE author_id = ?", Long.class,
            ana.id())).isZero();
    }

    @Test
    void a_coordinator_without_cohorts_is_rejected_and_keeps_its_cohorts() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session coord = coordinator(admin, List.of(cohort));

        assertThat(changeRole(admin, coord.id(), "COORDINATOR", List.of()).getResponse().getStatus()).isEqualTo(400);
        assertThat(changeRole(admin, coord.id(), "COORDINATOR", null).getResponse().getStatus()).isEqualTo(400);

        assertThat(coordinatorCohortsOf(coord.id())).containsExactly(cohort);
    }

    @Test
    void changing_the_cohorts_of_a_coordinator_replaces_them() throws Exception {
        Session admin = admin();
        long one = createCohort(admin, unique("Turma 1"));
        long two = createCohort(admin, unique("Turma 2"));
        Session coord = coordinator(admin, List.of(one));

        assertThat(changeRole(admin, coord.id(), "COORDINATOR", List.of(two)).getResponse().getStatus()).isEqualTo(200);

        assertThat(coordinatorCohortsOf(coord.id())).containsExactly(two);
    }

    @Test
    void back_to_user_loses_coordination_and_gets_the_default_quota() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session ana = student(admin, "Ana", cohort);
        long record = createRecord(ana, "Paciente A", null);
        Session coord = coordinator(admin, List.of(cohort));
        assertThat(ids(listRecords(coord, null))).contains(record);

        MvcResult result = changeRole(admin, coord.id(), "USER", null);

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode row = userRow(admin, coord.id());
        assertThat(row.get("role").stringValue()).isEqualTo("USER");
        assertThat(row.get("coordinatorCohorts")).isEmpty();
        assertThat(absent(row.get("cohort"))).isTrue();
        assertThat(row.get("recordQuota").asInt()).isEqualTo(DEFAULT_QUOTA);
        // Su token aún dice COORDINATOR, pero las turmas se leen de la base.
        assertThat(ids(listRecords(coord, null))).isEmpty();
        assertThat(send(coord, get(RECORDS + "/" + record), null).getResponse().getStatus()).isEqualTo(404);
    }

    @Test
    void an_admin_role_is_not_changeable_and_admin_is_not_assignable() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session ana = register("Ana");

        assertThat(changeRole(admin, admin.id(), "COORDINATOR", List.of(cohort)).getResponse().getStatus()).isEqualTo(409);
        assertThat(changeRole(admin, ana.id(), "ADMIN", null).getResponse().getStatus()).isEqualTo(400);
        assertThat(roleOf(admin.id())).isEqualTo("ADMIN");
        assertThat(roleOf(ana.id())).isEqualTo("USER");
    }

    @Test
    void only_admin_changes_roles_and_cohorts_of_accounts() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session ana = register("Ana");
        Session coord = coordinator(admin, List.of(cohort));

        assertThat(changeRole(coord, ana.id(), "COORDINATOR", List.of(cohort)).getResponse().getStatus()).isEqualTo(403);
        assertThat(assignCohort(ana, ana.id(), cohort).getResponse().getStatus()).isEqualTo(403);
        assertThat(send(coord, get("/api/users"), null).getResponse().getStatus()).isEqualTo(403);
    }

    // --- Historias de las turmas en solo lectura ---

    @Test
    void coordinator_lists_only_records_of_its_cohort_students_with_author_and_cohort() throws Exception {
        Session admin = admin();
        String name = unique("Turma 1");
        long one = createCohort(admin, name);
        long other = createCohort(admin, unique("Turma 9"));
        Session ana = student(admin, "Ana Alumna", one);
        Session luis = student(admin, "Luis Otro", other);
        Session solo = student(admin, "Sin Turma", null);
        long mine = createRecord(ana, "Paciente A", null);
        long foreign = createRecord(luis, "Paciente B", null);
        long loose = createRecord(solo, "Paciente C", null);
        Session coord = coordinator(admin, List.of(one));

        JsonNode page = listRecords(coord, null);

        assertThat(ids(page)).containsExactly(mine);
        JsonNode row = page.get("content").get(0);
        assertThat(row.get("authorName").stringValue()).isEqualTo("Ana Alumna");
        assertThat(row.get("cohortName").stringValue()).isEqualTo(name);
        assertThat(ids(page)).doesNotContain(foreign, loose);
    }

    @Test
    void coordinator_filters_by_one_of_its_cohorts_and_a_foreign_one_is_empty() throws Exception {
        Session admin = admin();
        long one = createCohort(admin, unique("Turma 1"));
        long two = createCohort(admin, unique("Turma 2"));
        long other = createCohort(admin, unique("Turma 9"));
        long recordOne = createRecord(student(admin, "Ana", one), "Paciente A", null);
        long recordTwo = createRecord(student(admin, "Bea", two), "Paciente B", null);
        createRecord(student(admin, "Luis", other), "Paciente C", null);
        Session coord = coordinator(admin, List.of(one, two));

        assertThat(ids(listRecords(coord, null))).containsExactlyInAnyOrder(recordOne, recordTwo);
        assertThat(ids(listRecords(coord, two))).containsExactly(recordTwo);
        assertThat(ids(listRecords(coord, other))).isEmpty();
    }

    @Test
    void coordinator_reads_a_record_of_its_cohort_and_gets_404_outside() throws Exception {
        Session admin = admin();
        long one = createCohort(admin, unique("Turma 1"));
        long other = createCohort(admin, unique("Turma 9"));
        long mine = createRecord(student(admin, "Ana", one), "Paciente A", null);
        long foreign = createRecord(student(admin, "Luis", other), "Paciente B", null);
        long loose = createRecord(student(admin, "Sin Turma", null), "Paciente C", null);
        Session coord = coordinator(admin, List.of(one));

        MvcResult result = send(coord, get(RECORDS + "/" + mine), null);

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(absent(read(result).get("patientLockedAt"))).isTrue();
        assertThat(jdbc.queryForObject("SELECT patient_locked_at FROM orthodontic_records WHERE id = ?",
            java.sql.Timestamp.class, mine)).isNull();
        assertThat(send(coord, get(RECORDS + "/" + foreign), null).getResponse().getStatus()).isEqualTo(404);
        assertThat(send(coord, get(RECORDS + "/" + loose), null).getResponse().getStatus()).isEqualTo(404);
    }

    // --- La coordinación no modifica historias ---

    @Test
    void every_record_write_of_a_coordinator_is_403_and_changes_nothing() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session ana = student(admin, "Ana", cohort);
        long record = createRecord(ana, "Paciente A", null);
        Session coord = coordinator(admin, List.of(cohort));
        long version = jdbc.queryForObject("SELECT version FROM orthodontic_records WHERE id = ?", Long.class, record);
        String number = jdbc.queryForObject("SELECT record_number FROM orthodontic_records WHERE id = ?", String.class, record);

        List<MvcResult> attempts = List.of(
            send(coord, post(RECORDS), "{\"recordNumber\":\"" + next() + "\",\"patientName\":\"X\"}"),
            send(coord, put(RECORDS + "/" + record),
                "{\"version\":" + version + ",\"recordNumber\":\"" + number + "\",\"patientName\":\"Cambiado\"}"),
            send(coord, post(RECORDS + "/" + record + "/print"), null),
            send(coord, post(RECORDS + "/" + record + "/unlock-request"), "{\"reason\":\"Error de tipeo\"}"),
            send(coord, delete(RECORDS + "/" + record + "/unlock-request"), null),
            send(coord, delete(RECORDS + "/" + record + "/patient-lock"), null),
            send(coord, get(RECORDS + "/quota"), null),
            send(coord, get("/api/dashboard/me"), null));

        assertThat(attempts).allSatisfy(r -> assertThat(r.getResponse().getStatus()).isEqualTo(403));
        assertThat(jdbc.queryForObject("SELECT version FROM orthodontic_records WHERE id = ?", Long.class, record))
            .isEqualTo(version);
        assertThat(jdbc.queryForObject("SELECT patient_name FROM orthodontic_records WHERE id = ?", String.class, record))
            .isEqualTo("Paciente A");
        assertThat(jdbc.queryForObject("SELECT patient_locked_at FROM orthodontic_records WHERE id = ?",
            java.sql.Timestamp.class, record)).isNull();
        assertThat(jdbc.queryForObject("SELECT count(*) FROM orthodontic_records WHERE author_id = ?", Long.class,
            coord.id())).isZero();
    }

    @Test
    void a_user_discarding_an_unlock_request_is_still_403() throws Exception {
        Session ana = register("Ana");
        long record = createRecord(ana, "Paciente A", null);

        assertThat(send(ana, delete(RECORDS + "/" + record + "/unlock-request"), null).getResponse().getStatus())
            .isEqualTo(403);
    }

    // --- Estado de una cuenta de coordinación ---

    @Test
    void disabling_a_coordinator_revokes_sessions_and_keeps_its_cohorts() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin, unique("Turma 1"));
        Session coord = coordinator(admin, List.of(cohort));

        MvcResult result = send(admin, patch("/api/users/" + coord.id() + "/status"), "{\"status\":\"DISABLED\"}");

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        assertThat(jdbc.queryForObject("SELECT status FROM users WHERE id = ?", String.class, coord.id()))
            .isEqualTo("DISABLED");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM refresh_tokens WHERE user_id = ? AND NOT revoked",
            Long.class, coord.id())).isZero();
        assertThat(coordinatorCohortsOf(coord.id())).containsExactly(cohort);
    }

    // --- Avance de las turmas en Inicio ---

    @Test
    void coordinator_dashboard_shows_each_cohort_and_its_students() throws Exception {
        Session admin = admin();
        String name = unique("Turma 1");
        long one = createCohort(admin, name);
        long empty = createCohort(admin, unique("Turma Vacía"));
        long other = createCohort(admin, unique("Turma 9"));
        Session ana = student(admin, "Ana Alumna", one);
        createRecord(ana, "Paciente A", ALL_CLINICAL);
        createRecord(ana, "Paciente B", List.of(1, 2));
        long legacy = createRecord(ana, "Paciente C", null);
        // Guardada antes de registrar los pasos con datos: sin calcular.
        jdbc.update("UPDATE orthodontic_records SET filled_steps = NULL WHERE id = ?", legacy);
        student(admin, "Bea Sin Historias", one);
        createRecord(student(admin, "Luis Otro", other), "Paciente D", ALL_CLINICAL);
        Session coord = coordinator(admin, List.of(one, empty));

        MvcResult result = send(coord, get("/api/dashboard/coordinator"), null);

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        JsonNode list = read(result).get("cohorts");
        assertThat(list).hasSize(2);
        JsonNode first = cohortById(list, one);
        assertThat(first.get("name").stringValue()).isEqualTo(name);
        assertThat(first.get("students").asLong()).isEqualTo(2);
        assertThat(first.get("records").asLong()).isEqualTo(3);
        assertThat(first.get("complete").asLong()).isEqualTo(1);
        assertThat(first.get("inProgress").asLong()).isEqualTo(1);
        assertThat(first.get("notComputed").asLong()).isEqualTo(1);
        assertThat(first.get("studentsWithoutRecords").asLong()).isEqualTo(1);
        JsonNode students = first.get("studentList");
        assertThat(students).hasSize(2);
        assertThat(students.get(0).get("fullName").stringValue()).isEqualTo("Ana Alumna");
        assertThat(students.get(0).get("records").asLong()).isEqualTo(3);
        assertThat(students.get(0).get("complete").asLong()).isEqualTo(1);
        assertThat(students.get(1).get("records").asLong()).isZero();
        JsonNode none = cohortById(list, empty);
        assertThat(none.get("students").asLong()).isZero();
        assertThat(none.get("records").asLong()).isZero();
        assertThat(none.get("studentList")).isEmpty();
    }

    @Test
    void other_roles_get_403_for_the_coordinator_dashboard() throws Exception {
        Session admin = admin();
        Session user = register("Ana");

        assertThat(send(user, get("/api/dashboard/coordinator"), null).getResponse().getStatus()).isEqualTo(403);
        assertThat(send(admin, get("/api/dashboard/coordinator"), null).getResponse().getStatus()).isEqualTo(403);
    }
}
