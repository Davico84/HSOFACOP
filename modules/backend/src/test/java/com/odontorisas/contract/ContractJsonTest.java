package com.odontorisas.contract;

import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;

import org.junit.jupiter.api.Test;
import tools.jackson.databind.JsonNode;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * El guardián también se prueba (design D5): serializador contra la salida de Node
 * y comparación semántica normalizada. Unitario, sin Docker.
 */
class ContractJsonTest {

    private static final String BASE = """
            {
              "openapi": "3.1.0",
              "servers": [{"url": "http://localhost:8080"}],
              "tags": [{"name": "auth"}, {"name": "health"}],
              "paths": {
                "/auth/login": {
                  "post": {
                    "parameters": [{"name": "a", "in": "query"}, {"name": "b", "in": "query"}],
                    "responses": {"200": {"description": "OK"}}
                  }
                }
              },
              "components": {
                "schemas": {
                  "RegisterRequest": {
                    "type": "object",
                    "required": ["email", "password"],
                    "properties": {
                      "email": {"type": "string", "format": "email"},
                      "password": {"type": "string", "minLength": 8}
                    }
                  }
                }
              }
            }
            """;

    private static String resource(String name) throws IOException {
        try (InputStream in = ContractJsonTest.class.getResourceAsStream("/contract/" + name)) {
            assertThat(in).as("recurso %s", name).isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8);
        }
    }

    private static java.util.List<String> diff(String expected, String actual) {
        return ContractJson.diff(
                ContractJson.normalize(ContractJson.parse(expected)),
                ContractJson.normalize(ContractJson.parse(actual)));
    }

    @Test
    void stringify_matches_node_json_stringify_byte_for_byte() throws IOException {
        String fixture = resource("stringify-fixture.json");
        String expected = resource("stringify-expected.json");

        String actual = ContractJson.stringify(ContractJson.parse(fixture));

        assertThat(actual.getBytes(StandardCharsets.UTF_8))
                .isEqualTo(expected.getBytes(StandardCharsets.UTF_8));
    }

    @Test
    void identical_documents_have_no_diff() {
        assertThat(diff(BASE, BASE)).isEmpty();
    }

    @Test
    void added_path_is_reported_with_its_route() {
        String actual = BASE.replace("\"paths\": {", "\"paths\": {\"/auth/refresh\": {\"post\": {}},");

        assertThat(diff(BASE, actual)).containsExactly("paths./auth/refresh");
    }

    @Test
    void removed_path_is_reported_with_its_route() {
        String actual = BASE.replace(
                "\"/auth/login\": {", "\"/auth/logout\": {");

        assertThat(diff(BASE, actual)).containsExactlyInAnyOrder("paths./auth/login", "paths./auth/logout");
    }

    @Test
    void changed_schema_property_is_reported_with_its_route() {
        String actual = BASE.replace("\"minLength\": 8", "\"minLength\": 10");

        assertThat(diff(BASE, actual))
                .containsExactly("components.schemas.RegisterRequest.properties.password.minLength");
    }

    @Test
    void only_servers_differ_is_equal() {
        String actual = BASE.replace("http://localhost:8080", "http://localhost");

        assertThat(diff(BASE, actual)).isEmpty();
    }

    @Test
    void integer_and_decimal_notation_are_equal() {
        String actual = BASE.replace("\"minLength\": 8", "\"minLength\": 8.0");

        assertThat(diff(BASE, actual)).isEmpty();
    }

    @Test
    void negative_zero_equals_zero() {
        String expected = BASE.replace("\"minLength\": 8", "\"minLength\": 0");
        String actual = BASE.replace("\"minLength\": 8", "\"minLength\": -0");

        assertThat(diff(expected, actual)).isEmpty();
    }

    @Test
    void reordered_required_and_tags_are_equal() {
        String actual = BASE
                .replace("[\"email\", \"password\"]", "[\"password\", \"email\"]")
                .replace("[{\"name\": \"auth\"}, {\"name\": \"health\"}]", "[{\"name\": \"health\"}, {\"name\": \"auth\"}]");

        assertThat(actual).isNotEqualTo(BASE);
        assertThat(diff(BASE, actual)).isEmpty();
    }

    @Test
    void different_key_order_is_equal() {
        String actual = BASE.replace(
                "\"type\": \"string\", \"format\": \"email\"", "\"format\": \"email\", \"type\": \"string\"");

        assertThat(actual).isNotEqualTo(BASE);
        assertThat(diff(BASE, actual)).isEmpty();
    }

    @Test
    void reordered_parameters_is_a_difference() {
        String actual = BASE.replace(
                "[{\"name\": \"a\", \"in\": \"query\"}, {\"name\": \"b\", \"in\": \"query\"}]",
                "[{\"name\": \"b\", \"in\": \"query\"}, {\"name\": \"a\", \"in\": \"query\"}]");

        assertThat(actual).isNotEqualTo(BASE);
        assertThat(diff(BASE, actual)).containsExactly(
                "paths./auth/login.post.parameters[0].name",
                "paths./auth/login.post.parameters[1].name");
    }
}
