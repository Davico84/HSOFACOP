package com.odontorisas.contract;

import com.odontorisas.AbstractIntegrationTest;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.core.annotation.AnnotatedElementUtils;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;
import org.springframework.web.method.HandlerMethod;
import org.springframework.web.servlet.mvc.method.annotation.RequestMappingHandlerMapping;
import tools.jackson.databind.JsonNode;

import java.nio.charset.StandardCharsets;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Scenarios de "Respuestas documentadas fielmente en el contrato" (api-type-contracts) sobre
 * el documento que publica {@code /v3/api-docs}. Complementa a {@link ContractDriftIT}: aquel
 * vigila que el snapshot coincida con lo publicado; este, que lo publicado diga la verdad.
 */
@SpringBootTest
@TestPropertySource(properties = "SWAGGER_ENABLED=true")
@AutoConfigureMockMvc
class OpenApiContractIT extends AbstractIntegrationTest {

    private static final String PROBLEM_JSON = "application/problem+json";
    private static final String SCHEMAS = "#/components/schemas/";

    @Autowired
    MockMvc mockMvc;

    @Autowired
    @Qualifier("requestMappingHandlerMapping")
    RequestMappingHandlerMapping handlerMapping;

    private JsonNode doc;

    @BeforeEach
    void loadDocument() throws Exception {
        String body = mockMvc.perform(get("/v3/api-docs"))
            .andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        doc = ContractJson.parse(body);
    }

    // --- helpers sobre el documento ---

    private JsonNode operation(String path, String method) {
        JsonNode item = doc.get("paths").get(path);
        assertThat(item).as("path %s", path).isNotNull();
        JsonNode op = item.get(method);
        assertThat(op).as("%s %s", method, path).isNotNull();
        return op;
    }

    private JsonNode responses(String path, String method) {
        return operation(path, method).get("responses");
    }

    /** Las operaciones de /auth/* son POST. */
    private JsonNode responses(String path) {
        return responses(path, "post");
    }

    private JsonNode schemaByName(String name) {
        JsonNode schema = doc.get("components").get("schemas").get(name);
        assertThat(schema).as("schema %s", name).isNotNull();
        return schema;
    }

    /** Nombre del schema al que apunta la respuesta {@code code} con ese media type. */
    private String schemaName(String path, String code, String mediaType) {
        return schemaName(path, "post", code, mediaType);
    }

    private String schemaName(String path, String method, String code, String mediaType) {
        JsonNode response = responses(path, method).get(code);
        assertThat(response).as("%s declara %s", path, code).isNotNull();
        JsonNode media = response.get("content").get(mediaType);
        assertThat(media).as("%s %s con %s", path, code, mediaType).isNotNull();
        String ref = media.get("schema").get("$ref").stringValue();
        assertThat(ref).startsWith(SCHEMAS);
        return ref.substring(SCHEMAS.length());
    }

    private static Set<String> names(JsonNode node) {
        return node == null ? Set.of() : new HashSet<>(node.propertyNames());
    }

    private static Set<String> strings(JsonNode array) {
        Set<String> out = new HashSet<>();
        if (array != null) {
            array.values().forEach(v -> out.add(v.stringValue()));
        }
        return out;
    }

    private List<JsonNode> allOperations() {
        List<JsonNode> ops = new ArrayList<>();
        doc.get("paths").values().forEach(item -> item.values().forEach(ops::add));
        return ops;
    }

    // --- Status de éxito real ---

    @Test
    void success_statuses_are_the_real_ones() {
        assertThat(schemaName("/auth/register", "201", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("AuthResponse");
        assertThat(schemaName("/auth/login", "200", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("AuthResponse");
        assertThat(schemaName("/auth/refresh", "200", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("AuthResponse");

        JsonNode logout = responses("/auth/logout");
        assertThat(logout.get("204")).isNotNull();
        assertThat(logout.get("204").get("content")).as("204 sin cuerpo").isNull();

        assertThat(names(responses("/auth/register"))).doesNotContain("200");
        assertThat(names(logout)).doesNotContain("200");
    }

    @Test
    void every_operation_declares_its_success_response() {
        for (JsonNode op : allOperations()) {
            assertThat(names(op.get("responses")))
                .as("operación %s", op.get("operationId"))
                .anyMatch(code -> code.startsWith("2"));
        }
    }

    @Test
    void every_handler_declares_an_explicit_success_api_response() {
        handlerMapping.getHandlerMethods().forEach((info, handler) -> {
            if (!handler.getBeanType().getPackageName().startsWith("com.odontorisas")) {
                return;
            }
            Set<ApiResponse> declared = AnnotatedElementUtils.findMergedRepeatableAnnotations(
                handler.getMethod(), ApiResponse.class);
            assertThat(declared)
                .as("%s.%s debe declarar su @ApiResponse de éxito (si no, springdoc publica un 200 inferido)",
                    handler.getBeanType().getSimpleName(), handler.getMethod().getName())
                .anyMatch(r -> r.responseCode().startsWith("2"));
        });
    }

    // --- Errores semánticos documentados con el schema de error ---

    @Test
    void semantic_errors_are_documented_as_problem_json() {
        assertThat(schemaName("/auth/register", "400", PROBLEM_JSON)).isEqualTo("ValidationProblem");
        assertThat(schemaName("/auth/register", "409", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(schemaName("/auth/login", "400", PROBLEM_JSON)).isEqualTo("ValidationProblem");
        assertThat(schemaName("/auth/login", "401", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(schemaName("/auth/refresh", "401", PROBLEM_JSON)).isEqualTo("ApiProblem");
    }

    @Test
    void error_schemas_have_the_runtime_shape_and_stay_in_sync() {
        JsonNode apiProblem = schemaByName("ApiProblem");
        JsonNode validation = schemaByName("ValidationProblem");
        Set<String> baseFields = Set.of("type", "title", "status", "detail", "timestamp", "instance", "traceId");

        assertThat(names(apiProblem.get("properties"))).isEqualTo(baseFields);
        assertThat(strings(apiProblem.get("required")))
            .isEqualTo(Set.of("type", "title", "status", "detail", "timestamp"));

        Set<String> validationFields = new LinkedHashSet<>(baseFields);
        validationFields.add("errors");
        assertThat(names(validation.get("properties"))).isEqualTo(validationFields);
        assertThat(strings(validation.get("required"))).isEqualTo(strings(apiProblem.get("required")));
        for (String field : baseFields) {
            JsonNode a = apiProblem.get("properties").get(field);
            JsonNode b = validation.get("properties").get(field);
            // Mismo tipo y formato; los ejemplos y descripciones pueden diferir a propósito.
            assertThat(b.get("type")).as("%s.type", field).isEqualTo(a.get("type"));
            assertThat(b.get("format")).as("%s.format", field).isEqualTo(a.get("format"));
        }
    }

    // --- Errores transversales heredados sin declararlos ---

    @Test
    void every_operation_inherits_500_and_public_routes_keep_only_their_own_401() {
        for (JsonNode op : allOperations()) {
            assertThat(names(op.get("responses"))).as("%s", op.get("operationId")).contains("500");
        }
        assertThat(names(responses("/auth/register"))).doesNotContain("401");
        assertThat(names(responses("/auth/logout"))).doesNotContain("401");
        // El 401 semántico declarado se conserva (no lo pisa el transversal).
        assertThat(responses("/auth/login").get("401").get("description").stringValue())
            .isEqualTo("Credenciales inválidas o cuenta bloqueada temporalmente");
        assertThat(responses("/auth/refresh").get("401").get("description").stringValue())
            .isEqualTo("Refresco ausente, inválido o expirado");
    }

    // --- Swagger UI disponible al habilitarla (update-api-docs-exposure) ---

    @Test
    void swagger_ui_is_served_when_enabled() throws Exception {
        MvcResult entry = mockMvc.perform(get("/swagger-ui.html")).andReturn();
        int code = entry.getResponse().getStatus();
        assertThat(code).as("/swagger-ui.html sirve o redirige a la UI").isIn(200, 302);

        String uiPath = code == 302 ? entry.getResponse().getRedirectedUrl() : "/swagger-ui.html";
        assertThat(uiPath).isNotBlank();
        String html = mockMvc.perform(get(uiPath)).andExpect(status().isOk())
            .andReturn().getResponse().getContentAsString(StandardCharsets.UTF_8);
        assertThat(html).containsIgnoringCase("swagger-ui");
    }

    @Test
    void operation_ids_are_explicit_and_stable() {
        List<String> ids = allOperations().stream().map(op -> op.get("operationId").stringValue()).toList();
        assertThat(ids).doesNotHaveDuplicates()
            .containsExactlyInAnyOrder("register", "login", "refresh", "logout", "listUsers", "changeUserStatus",
                "listRecords", "createRecord", "getRecord", "updateRecord");
    }

    // --- Gestión de usuarios (add-user-account-status) ---

    @Test
    void users_api_is_documented_with_real_statuses_and_error_schemas() {
        assertThat(schemaName("/api/users", "get", "200", MediaType.APPLICATION_JSON_VALUE))
            .isEqualTo("PageResponseUserSummaryResponse");
        JsonNode page = schemaByName("PageResponseUserSummaryResponse");
        assertThat(page.get("properties").get("content").get("type").stringValue()).isEqualTo("array");
        assertThat(page.get("properties").get("content").get("items").get("$ref").stringValue())
            .isEqualTo(SCHEMAS + "UserSummaryResponse");
        assertThat(strings(page.get("required")))
            .containsExactlyInAnyOrder("content", "page", "size", "totalElements", "totalPages", "last");
        assertThat(names(schemaByName("UserSummaryResponse").get("properties")))
            .isEqualTo(Set.of("id", "email", "fullName", "role", "status"));

        String status = "/api/users/{id}/status";
        assertThat(schemaName(status, "patch", "200", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("UserSummaryResponse");
        assertThat(schemaName(status, "patch", "400", PROBLEM_JSON)).isEqualTo("ValidationProblem");
        assertThat(schemaName(status, "patch", "404", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(schemaName(status, "patch", "409", PROBLEM_JSON)).isEqualTo("ApiProblem");
        // Transversales: ruta privada (401) y @PreAuthorize (403).
        assertThat(names(responses("/api/users", "get"))).contains("401", "403", "500");
        assertThat(names(responses(status, "patch"))).contains("401", "403", "500");
        // Login y refresh documentan el 403 de cuenta deshabilitada.
        assertThat(schemaName("/auth/login", "403", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(schemaName("/auth/refresh", "403", PROBLEM_JSON)).isEqualTo("ApiProblem");
    }

    // --- Historias clínicas (add-orthodontic-records) ---

    @Test
    void records_api_is_documented_with_real_statuses_and_error_schemas() {
        String base = "/api/orthodontic-records";
        String item = base + "/{id}";
        assertThat(schemaName(base, "get", "200", MediaType.APPLICATION_JSON_VALUE))
            .isEqualTo("PageResponseRecordSummaryResponse");
        assertThat(schemaName(base, "post", "201", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("RecordResponse");
        assertThat(schemaName(base, "post", "400", PROBLEM_JSON)).isEqualTo("ValidationProblem");
        assertThat(names(responses(base, "post"))).doesNotContain("200");
        assertThat(schemaName(item, "get", "200", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("RecordResponse");
        assertThat(schemaName(item, "get", "404", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(schemaName(item, "put", "200", MediaType.APPLICATION_JSON_VALUE)).isEqualTo("RecordResponse");
        assertThat(schemaName(item, "put", "400", PROBLEM_JSON)).isEqualTo("ValidationProblem");
        assertThat(schemaName(item, "put", "404", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(schemaName(item, "put", "409", PROBLEM_JSON)).isEqualTo("ApiProblem");
        assertThat(names(responses(base, "get"))).contains("401", "500");

        // El contenido clínico viaja tipado: una sección por paso del formulario.
        assertThat(names(schemaByName("RecordContent").get("properties"))).containsExactlyInAnyOrder(
            "schemaVersion", "anamnesis", "facial", "functional", "occlusal", "radiographic", "diagnosis", "signatures");
        assertThat(strings(schemaByName("UpdateRecordRequest").get("required"))).contains("version", "patientName");
        assertThat(names(schemaByName("UpdateRecordRequest").get("properties"))).doesNotContain("recordNumber", "authorId");
        assertThat(names(schemaByName("RecordSummaryResponse").get("properties"))).doesNotContain("content");
    }

    // --- Lo documentado coincide con lo real ---

    private void assertDocumented(String path, MvcResult real, String mediaType) throws Exception {
        String code = String.valueOf(real.getResponse().getStatus());
        String schema = schemaName(path, code, mediaType);
        assertThat(real.getResponse().getContentType()).startsWith(mediaType);
        JsonNode body = ContractJson.parse(real.getResponse().getContentAsString(StandardCharsets.UTF_8));
        JsonNode definition = schemaByName(schema);
        assertThat(names(body)).as("claves reales de %s %s", path, code)
            .isSubsetOf(names(definition.get("properties")))
            .containsAll(strings(definition.get("required")));
    }

    private static String registerBody(String email, String password) {
        return "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"fullName\":\"Ana Pérez\"}";
    }

    @Test
    void documented_responses_match_real_responses() throws Exception {
        String email = "contrato-" + UUID.randomUUID() + "@clinica.test";

        MvcResult registered = mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON).content(registerBody(email, "password123"))).andReturn();
        assertThat(registered.getResponse().getStatus()).isEqualTo(201);
        assertDocumented("/auth/register", registered, MediaType.APPLICATION_JSON_VALUE);

        MvcResult login = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON).content(registerBody(email, "password123"))).andReturn();
        assertThat(login.getResponse().getStatus()).isEqualTo(200);
        assertDocumented("/auth/login", login, MediaType.APPLICATION_JSON_VALUE);

        MvcResult logout = mockMvc.perform(post("/auth/logout")).andReturn();
        assertThat(logout.getResponse().getStatus()).isEqualTo(204);
        assertThat(responses("/auth/logout").get("204")).isNotNull();

        MvcResult conflict = mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON).content(registerBody(email, "password123"))).andReturn();
        assertThat(conflict.getResponse().getStatus()).isEqualTo(409);
        assertDocumented("/auth/register", conflict, PROBLEM_JSON);

        MvcResult invalid = mockMvc.perform(post("/auth/register")
            .contentType(MediaType.APPLICATION_JSON).content(registerBody("otro-" + email, "1234"))).andReturn();
        assertThat(invalid.getResponse().getStatus()).isEqualTo(400);
        assertDocumented("/auth/register", invalid, PROBLEM_JSON);
        assertThat(names(ContractJson.parse(invalid.getResponse().getContentAsString(StandardCharsets.UTF_8))))
            .contains("errors");

        MvcResult badCredentials = mockMvc.perform(post("/auth/login")
            .contentType(MediaType.APPLICATION_JSON).content(registerBody(email, "incorrecta"))).andReturn();
        assertThat(badCredentials.getResponse().getStatus()).isEqualTo(401);
        assertDocumented("/auth/login", badCredentials, PROBLEM_JSON);
    }

    @Test
    void handler_mapping_sees_the_auth_controller() {
        Map<?, HandlerMethod> methods = handlerMapping.getHandlerMethods();
        assertThat(methods.values()).anyMatch(h -> h.getBeanType().getSimpleName().equals("AuthController"));
    }
}
