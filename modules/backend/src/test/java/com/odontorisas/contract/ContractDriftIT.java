package com.odontorisas.contract;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import tools.jackson.databind.JsonNode;
import tools.jackson.databind.node.ObjectNode;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.fail;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Guardián backend → contrato (capacidad api-type-contracts): el documento que publica
 * {@code /v3/api-docs} debe coincidir con {@code contracts/openapi.json}.
 * Con {@code -Dcontract.update=true} regenera el archivo en lugar de comparar.
 */
@SpringBootTest
@TestPropertySource(properties = "SWAGGER_ENABLED=true")
@AutoConfigureMockMvc
class ContractDriftIT extends AbstractIntegrationTest {

    /** Relativo al directorio de trabajo de failsafe ({@code modules/backend}). */
    private static final Path CONTRACT = Path.of("../../contracts/openapi.json").toAbsolutePath().normalize();

    static final String CHECK_COMMAND =
            "./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false";
    static final String UPDATE_COMMAND = CHECK_COMMAND + " -Dcontract.update=true";

    @Autowired
    MockMvc mockMvc;

    private JsonNode published() throws Exception {
        String body = mockMvc.perform(get("/v3/api-docs"))
                .andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        return ContractJson.parse(body);
    }

    private static String readContract() throws IOException {
        assertThat(CONTRACT).as("no se encuentra el contrato versionado").exists();
        return Files.readString(CONTRACT, StandardCharsets.UTF_8);
    }

    @Test
    void api_docs_exposes_authentication_operations() throws Exception {
        JsonNode paths = published().get("paths");

        assertThat(paths).isNotNull();
        assertThat(paths.get("/auth/register").get("post")).isNotNull();
        assertThat(paths.get("/auth/login").get("post")).isNotNull();
        assertThat(paths.get("/auth/refresh").get("post")).isNotNull();
    }

    @Test
    void register_request_schema_reflects_validation_constraints() throws Exception {
        JsonNode schema = published().get("components").get("schemas").get("RegisterRequest");

        assertThat(schema).isNotNull();
        JsonNode props = schema.get("properties");
        assertThat(props.get("email").get("format").stringValue()).isEqualTo("email");
        assertThat(props.get("password").get("minLength")).isNotNull();
        assertThat(props.get("password").get("maxLength")).isNotNull();
        assertThat(schema.get("required").values())
                .extracting(JsonNode::stringValue)
                .contains("email", "password");
    }

    @Test
    void versioned_contract_matches_published_document() throws Exception {
        JsonNode published = published();
        String current = readContract();
        JsonNode versioned = ContractJson.parse(current);

        if (Boolean.getBoolean("contract.update")) {
            if (published instanceof ObjectNode doc && versioned.has("servers")) {
                doc.set("servers", versioned.get("servers"));
            }
            Files.writeString(CONTRACT, ContractJson.stringify(published), StandardCharsets.UTF_8);
            return;
        }

        List<String> diffs = ContractJson.diff(ContractJson.normalize(versioned), ContractJson.normalize(published));
        if (!diffs.isEmpty()) {
            fail("""
                    contracts/openapi.json no coincide con lo que publica el backend (/v3/api-docs).
                    Rutas que difieren (primeras %d):
                      - %s
                    Regenera el contrato y el cliente:
                      cd modules/backend && %s
                      cd modules/frontend && pnpm generate:api
                    """.formatted(ContractJson.MAX_DIFFS, String.join("\n  - ", diffs), UPDATE_COMMAND));
        }
    }
}
