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
import org.springframework.test.web.servlet.request.MockHttpServletRequestBuilder;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.json.JsonMapper;

import java.nio.charset.StandardCharsets;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;

/**
 * Scenarios de add-cohort-registration-code de punta a punta (JWT real, PostgreSQL): código y
 * apertura de la turma, registro con código y datos opcionales, "Mis datos" y el listado de Usuarios.
 */
@SpringBootTest
@AutoConfigureMockMvc
class CohortRegistrationIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String email, String token) {}

    // --- Ayudas ---

    private JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private static String email() {
        return "reg-" + UUID.randomUUID() + "@empresa.test";
    }

    private MvcResult registerRaw(String email, String extra) throws Exception {
        String body = "{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"Ana Pérez\""
            + (extra == null ? "" : "," + extra) + "}";
        return mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON).content(body)).andReturn();
    }

    private Session register(String extra) throws Exception {
        String email = email();
        MvcResult result = registerRaw(email, extra);
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), email, node.get("accessToken").stringValue());
    }

    private Session relogin(Session s) throws Exception {
        MvcResult login = mockMvc.perform(post("/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"" + s.email() + "\",\"password\":\"" + PASSWORD + "\"}")).andReturn();
        return new Session(s.id(), s.email(), read(login).get("accessToken").stringValue());
    }

    private Session admin() throws Exception {
        Session user = register(null);
        jdbc.update("UPDATE users SET role = 'ADMIN', record_quota = NULL WHERE id = ?", user.id());
        return relogin(user);
    }

    private MvcResult send(Session as, MockHttpServletRequestBuilder request, String body) throws Exception {
        request.header("Authorization", "Bearer " + as.token());
        if (body != null) {
            request.contentType(MediaType.APPLICATION_JSON).content(body);
        }
        return mockMvc.perform(request).andReturn();
    }

    private JsonNode createCohort(Session admin) throws Exception {
        MvcResult result = send(admin, post("/api/cohorts"), "{\"name\":\"Turma " + UUID.randomUUID().toString().substring(0, 8) + "\"}");
        assertThat(result.getResponse().getStatus()).isEqualTo(201);
        return read(result);
    }

    private Long cohortOf(long userId) {
        return jdbc.queryForObject("SELECT cohort_id FROM users WHERE id = ?", Long.class, userId);
    }

    private static String type(JsonNode problem) {
        return problem.get("type").stringValue();
    }

    private static String fieldError(JsonNode problem, String field) {
        for (JsonNode error : problem.get("errors")) {
            if (error.get("field").stringValue().equals(field)) {
                return error.get("message").stringValue();
            }
        }
        return null;
    }

    private static boolean absent(JsonNode node) {
        return node == null || node.isNull();
    }

    // --- Código de inscripción de la turma ---

    @Test
    void a_new_cohort_gets_a_distinct_code_and_is_open() throws Exception {
        Session admin = admin();

        JsonNode one = createCohort(admin);
        JsonNode two = createCohort(admin);

        assertThat(one.get("registrationCode").stringValue()).matches("[A-HJ-NP-Z2-9]{8}");
        assertThat(one.get("registrationCode").stringValue()).isNotEqualTo(two.get("registrationCode").stringValue());
        assertThat(one.get("registrationOpen").asBoolean()).isTrue();
    }

    @Test
    void a_new_code_replaces_the_old_one_for_registration() throws Exception {
        Session admin = admin();
        JsonNode cohort = createCohort(admin);
        String old = cohort.get("registrationCode").stringValue();

        MvcResult result = send(admin, post("/api/cohorts/" + cohort.get("id").asLong() + "/registration-code"), null);

        assertThat(result.getResponse().getStatus()).isEqualTo(200);
        String fresh = read(result).get("registrationCode").stringValue();
        assertThat(fresh).isNotEqualTo(old).matches("[A-HJ-NP-Z2-9]{8}");
        MvcResult withOld = registerRaw(email(), "\"cohortCode\":\"" + old + "\"");
        assertThat(withOld.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(withOld))).isEqualTo("/errors/invalid-cohort-code");
        assertThat(cohortOf(register("\"cohortCode\":\"" + fresh + "\"").id())).isEqualTo(cohort.get("id").asLong());
    }

    @Test
    void the_coordinator_does_not_see_the_code() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin).get("id").asLong();
        Session coord = register(null);
        send(admin, patch("/api/users/" + coord.id() + "/role"), "{\"role\":\"COORDINATOR\",\"cohortIds\":[" + cohort + "]}");
        coord = relogin(coord);

        JsonNode list = read(send(coord, get("/api/cohorts"), null));

        assertThat(list).hasSize(1);
        assertThat(absent(list.get(0).get("registrationCode"))).isTrue();
        assertThat(absent(list.get(0).get("registrationOpen"))).isTrue();
    }

    @Test
    void other_roles_cannot_regenerate_or_close() throws Exception {
        Session admin = admin();
        JsonNode cohort = createCohort(admin);
        long id = cohort.get("id").asLong();
        Session user = register(null);

        assertThat(send(user, post("/api/cohorts/" + id + "/registration-code"), null).getResponse().getStatus()).isEqualTo(403);
        assertThat(send(user, patch("/api/cohorts/" + id + "/registration"), "{\"open\":false}").getResponse().getStatus())
            .isEqualTo(403);
        assertThat(jdbc.queryForObject("SELECT registration_code FROM cohorts WHERE id = ?", String.class, id))
            .isEqualTo(cohort.get("registrationCode").stringValue());
    }

    // --- Turma abierta o cerrada ---

    @Test
    void a_closed_cohort_rejects_its_code_keeps_its_students_and_reopens() throws Exception {
        Session admin = admin();
        JsonNode cohort = createCohort(admin);
        long id = cohort.get("id").asLong();
        String code = cohort.get("registrationCode").stringValue();
        Session ana = register("\"cohortCode\":\"" + code + "\"");

        MvcResult closed = send(admin, patch("/api/cohorts/" + id + "/registration"), "{\"open\":false}");
        assertThat(closed.getResponse().getStatus()).isEqualTo(200);
        assertThat(read(closed).get("registrationOpen").asBoolean()).isFalse();

        MvcResult rejected = registerRaw(email(), "\"cohortCode\":\"" + code + "\"");
        assertThat(rejected.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(rejected))).isEqualTo("/errors/cohort-registration-closed");
        assertThat(read(rejected).get("detail").stringValue()).isEqualTo("La turma ya no acepta inscripciones.");
        assertThat(cohortOf(ana.id())).isEqualTo(id);
        Session manual = register(null);
        assertThat(send(admin, patch("/api/users/" + manual.id() + "/cohort"), "{\"cohortId\":" + id + "}")
            .getResponse().getStatus()).isEqualTo(200);

        send(admin, patch("/api/cohorts/" + id + "/registration"), "{\"open\":true}");
        assertThat(cohortOf(register("\"cohortCode\":\"" + code + "\"").id())).isEqualTo(id);
    }

    // --- Inscripción al registrarse ---

    @Test
    void registering_with_a_messy_code_joins_the_cohort() throws Exception {
        Session admin = admin();
        JsonNode cohort = createCohort(admin);
        String code = cohort.get("registrationCode").stringValue();
        String messy = " " + code.substring(0, 4).toLowerCase() + " - " + code.substring(4).toLowerCase() + " ";

        Session ana = register("\"cohortCode\":\"" + messy + "\"");

        assertThat(cohortOf(ana.id())).isEqualTo(cohort.get("id").asLong());
    }

    @Test
    void an_unknown_code_creates_nothing() throws Exception {
        String email = email();

        MvcResult result = registerRaw(email, "\"cohortCode\":\"ZZZZ-ZZZZ\"");

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        assertThat(type(read(result))).isEqualTo("/errors/invalid-cohort-code");
        assertThat(read(result).get("detail").stringValue()).isEqualTo("El código de turma no es válido.");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users WHERE email = ?", Long.class, email)).isZero();
    }

    @Test
    void without_code_or_data_the_account_is_an_individual_student() throws Exception {
        Session ana = register("\"cohortCode\":\"  \",\"phone\":\"\",\"documentType\":null,\"documentNumber\":\" \",\"copNumber\":\"\"");

        assertThat(cohortOf(ana.id())).isNull();
        JsonNode profile = read(send(ana, get("/api/me/profile"), null));
        assertThat(absent(profile.get("phone"))).isTrue();
        assertThat(absent(profile.get("documentNumber"))).isTrue();
        assertThat(absent(profile.get("copNumber"))).isTrue();
    }

    @Test
    void registering_with_data_keeps_it_for_my_data() throws Exception {
        Session ana = register("\"phone\":\"987654321\",\"documentType\":\"DNI\",\"documentNumber\":\"74125896\",\"copNumber\":\"12345\"");

        JsonNode profile = read(send(ana, get("/api/me/profile"), null));

        assertThat(profile.get("phone").stringValue()).isEqualTo("987654321");
        assertThat(profile.get("documentType").stringValue()).isEqualTo("DNI");
        assertThat(profile.get("documentNumber").stringValue()).isEqualTo("74125896");
        assertThat(profile.get("copNumber").stringValue()).isEqualTo("12345");
        assertThat(profile.get("role").stringValue()).isEqualTo("USER");
    }

    @Test
    void invalid_data_on_register_is_400_per_field_and_creates_nothing() throws Exception {
        String email = email();

        MvcResult result = registerRaw(email, "\"phone\":\"98765432\",\"documentType\":\"DNI\",\"documentNumber\":\"7412589\"");

        assertThat(result.getResponse().getStatus()).isEqualTo(400);
        JsonNode problem = read(result);
        assertThat(fieldError(problem, "phone")).isEqualTo("El celular debe tener 9 dígitos y empezar con 9.");
        assertThat(fieldError(problem, "documentNumber")).isEqualTo("El DNI debe tener 8 dígitos.");
        assertThat(jdbc.queryForObject("SELECT count(*) FROM users WHERE email = ?", Long.class, email)).isZero();
    }

    // --- Mis datos ---

    @Test
    void my_data_saves_and_removes_values() throws Exception {
        Session ana = register("\"phone\":\"987654321\"");

        MvcResult saved = send(ana, put("/api/me/profile"),
            "{\"phone\":\"987654321\",\"documentType\":\"FOREIGNER_CARD\",\"documentNumber\":\"001234567\",\"copNumber\":\"12345\"}");
        assertThat(saved.getResponse().getStatus()).isEqualTo(200);
        assertThat(read(saved).get("documentNumber").stringValue()).isEqualTo("001234567");

        MvcResult removed = send(ana, put("/api/me/profile"),
            "{\"phone\":\"\",\"documentType\":\"FOREIGNER_CARD\",\"documentNumber\":\"001234567\",\"copNumber\":null}");
        assertThat(removed.getResponse().getStatus()).isEqualTo(200);
        assertThat(jdbc.queryForObject("SELECT phone FROM users WHERE id = ?", String.class, ana.id())).isNull();
        assertThat(jdbc.queryForObject("SELECT cop_number FROM users WHERE id = ?", String.class, ana.id())).isNull();
        assertThat(jdbc.queryForObject("SELECT document_number FROM users WHERE id = ?", String.class, ana.id()))
            .isEqualTo("001234567");
    }

    @Test
    void my_data_rejects_invalid_values_per_field() throws Exception {
        Session ana = register(null);

        MvcResult phone = send(ana, put("/api/me/profile"), "{\"phone\":\"887654321\"}");
        MvcResult type = send(ana, put("/api/me/profile"), "{\"documentType\":\"DNI\"}");
        MvcResult number = send(ana, put("/api/me/profile"), "{\"documentNumber\":\"74125896\"}");

        assertThat(phone.getResponse().getStatus()).isEqualTo(400);
        assertThat(fieldError(read(phone), "phone")).isNotNull();
        assertThat(fieldError(read(type), "documentNumber")).isEqualTo("Indica el número del documento.");
        assertThat(fieldError(read(number), "documentType")).isEqualTo("Indica el tipo de documento.");
        assertThat(jdbc.queryForObject("SELECT phone FROM users WHERE id = ?", String.class, ana.id())).isNull();
    }

    @Test
    void my_data_without_session_is_401() throws Exception {
        assertThat(mockMvc.perform(get("/api/me/profile")).andReturn().getResponse().getStatus()).isEqualTo(401);
        assertThat(mockMvc.perform(put("/api/me/profile").contentType(MediaType.APPLICATION_JSON).content("{}"))
            .andReturn().getResponse().getStatus()).isEqualTo(401);
    }

    @Test
    void coordination_also_has_my_data() throws Exception {
        Session admin = admin();
        long cohort = createCohort(admin).get("id").asLong();
        Session coord = register(null);
        send(admin, patch("/api/users/" + coord.id() + "/role"), "{\"role\":\"COORDINATOR\",\"cohortIds\":[" + cohort + "]}");
        coord = relogin(coord);

        assertThat(send(coord, put("/api/me/profile"), "{\"copNumber\":\"321\"}").getResponse().getStatus()).isEqualTo(200);
        assertThat(read(send(coord, get("/api/me/profile"), null)).get("role").stringValue()).isEqualTo("COORDINATOR");
    }

    // --- Datos de la cuenta en Usuarios ---

    @Test
    void the_admin_listing_includes_the_contact_data() throws Exception {
        Session admin = admin();
        Session ana = register("\"phone\":\"987654321\",\"documentType\":\"PASSPORT\",\"documentNumber\":\"1234567\"");

        JsonNode row = null;
        JsonNode page = read(send(admin, get("/api/users").param("size", "100"), null));
        for (int p = 0; p < page.get("totalPages").asInt() && row == null; p++) {
            JsonNode current = read(send(admin, get("/api/users").param("size", "100").param("page", String.valueOf(p)), null));
            for (JsonNode r : current.get("content")) {
                if (r.get("id").asLong() == ana.id()) {
                    row = r;
                }
            }
        }

        assertThat(row).isNotNull();
        assertThat(row.get("phone").stringValue()).isEqualTo("987654321");
        assertThat(row.get("documentType").stringValue()).isEqualTo("PASSPORT");
        assertThat(row.get("documentNumber").stringValue()).isEqualTo("1234567");
        assertThat(absent(row.get("copNumber"))).isTrue();
        assertThat(List.of(403)).contains(send(ana, get("/api/users"), null).getResponse().getStatus());
    }
}
