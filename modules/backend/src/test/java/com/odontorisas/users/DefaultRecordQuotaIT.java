package com.odontorisas.users;

import com.odontorisas.AbstractIntegrationTest;
import com.odontorisas.TestRecordNumbers;
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
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Cupo inicial de las cuentas nuevas con el valor por defecto del despliegue (1). El resto de los
 * tests corre sin cupo inicial ({@code src/test/resources/config/application.properties}); esta clase lo fija en 1.
 */
@SpringBootTest(properties = "app.records.default-quota=1")
@AutoConfigureMockMvc
class DefaultRecordQuotaIT extends AbstractIntegrationTest {

    private static final String PASSWORD = "password123";

    @Autowired MockMvc mockMvc;
    @Autowired JdbcTemplate jdbc;

    private final JsonMapper json = JsonMapper.builder().build();

    record Session(long id, String token) {}

    private JsonNode read(MvcResult result) throws Exception {
        return json.readTree(result.getResponse().getContentAsString(StandardCharsets.UTF_8));
    }

    private Session register(String fullName) throws Exception {
        String email = "quota-" + UUID.randomUUID() + "@empresa.test";
        MvcResult result = mockMvc.perform(post("/auth/register").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"" + PASSWORD + "\",\"fullName\":\"" + fullName + "\"}"))
            .andExpect(status().isCreated()).andReturn();
        JsonNode node = read(result);
        return new Session(node.get("user").get("id").asLong(), node.get("accessToken").stringValue());
    }

    private MvcResult create(Session as) throws Exception {
        return mockMvc.perform(post("/api/orthodontic-records").header("Authorization", "Bearer " + as.token())
            .contentType(MediaType.APPLICATION_JSON)
            .content("{\"recordNumber\":\"" + TestRecordNumbers.next() + "\",\"patientName\":\"Paciente\"}")).andReturn();
    }

    @Test
    void new_account_starts_with_quota_1_then_first_record_ok_and_second_409() throws Exception {
        Session jaime = register("Dr. Jaime");
        assertThat(jdbc.queryForObject("SELECT record_quota FROM users WHERE id = ?", Integer.class, jaime.id()))
            .isEqualTo(1);

        JsonNode quota = read(mockMvc.perform(get("/api/orthodontic-records/quota")
            .header("Authorization", "Bearer " + jaime.token())).andReturn());
        assertThat(quota.get("limit").asInt()).isEqualTo(1);
        assertThat(quota.get("used").asLong()).isZero();

        MvcResult first = create(jaime);
        assertThat(first.getResponse().getStatus()).isEqualTo(201);

        MvcResult second = create(jaime);
        assertThat(second.getResponse().getStatus()).isEqualTo(409);
        assertThat(read(second).get("detail").stringValue())
            .isEqualTo("Alcanzaste el máximo de 1 historia clínica. Comunícate con el administrador para solicitar más.");
    }

    @Test
    void existing_accounts_keep_their_quota() throws Exception {
        // Cuenta anterior al cambio (sin límite): el registro de otras cuentas no la toca.
        Session old = register("Dra. Antigua");
        jdbc.update("UPDATE users SET record_quota = NULL WHERE id = ?", old.id());
        register("Dr. Nuevo");

        assertThat(jdbc.queryForObject("SELECT record_quota FROM users WHERE id = ?", Integer.class, old.id())).isNull();
        assertThat(create(old).getResponse().getStatus()).isEqualTo(201);
        assertThat(create(old).getResponse().getStatus()).isEqualTo(201);
    }
}
