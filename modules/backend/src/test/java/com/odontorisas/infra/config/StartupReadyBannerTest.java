package com.odontorisas.infra.config;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.springframework.boot.test.system.CapturedOutput;
import org.springframework.boot.test.system.OutputCaptureExtension;
import org.springframework.mock.env.MockEnvironment;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

/** Scenarios de "Aviso de backend listo al arrancar" (project-foundation). */
@ExtendWith(OutputCaptureExtension.class)
class StartupReadyBannerTest {

    private static final String RULE = "=".repeat(60);

    // --- Formato (render puro) ---

    @Test
    void banner_is_a_delimited_block_with_name_and_real_port() {
        List<String> lines = StartupReadyBanner.render("Acme CRM", 9091, "", true);

        assertThat(lines).hasSize(4);
        assertThat(lines.getFirst()).isEqualTo(RULE);
        assertThat(lines.getLast()).isEqualTo(RULE);
        assertThat(lines.get(1)).isEqualTo("  >> Acme CRM API lista en http://localhost:9091");
    }

    @Test
    void banner_is_plain_ascii_so_any_console_shows_it() {
        for (String line : StartupReadyBanner.render("App", 8080, "", false)) {
            assertThat(line.chars()).as(line).allMatch(c -> c < 128);
        }
    }

    @Test
    void listener_writes_the_block_in_a_single_log_entry(CapturedOutput output) {
        MockEnvironment env = new MockEnvironment()
            .withProperty("app.name", "Mi Proyecto")
            .withProperty("local.server.port", "8080");

        new StartupReadyBanner(env).onReady();

        // Una sola entrada: la línea del aviso no lleva el prefijo del logger delante.
        String out = output.getOut() + output.getErr();
        assertThat(out).containsPattern("(?m)^  >> Mi Proyecto API lista en http://localhost:8080$");
        assertThat(out).containsPattern("(?m)^={60}$");
    }

    @Test
    void swagger_enabled_shows_its_url() {
        assertThat(StartupReadyBanner.render("App", 8080, "", true).get(2))
            .isEqualTo("    Swagger UI: http://localhost:8080/swagger-ui.html");
    }

    @Test
    void swagger_disabled_says_how_to_enable_it() {
        assertThat(StartupReadyBanner.render("App", 8080, "", false).get(2))
            .isEqualTo("    Swagger UI: desactivado (activa con SWAGGER_ENABLED=true)");
    }

    @Test
    void context_path_is_part_of_both_urls() {
        List<String> lines = StartupReadyBanner.render("App", 8080, "/api/", true);

        assertThat(lines.get(1)).endsWith("http://localhost:8080/api");
        assertThat(lines.get(2)).endsWith("http://localhost:8080/api/swagger-ui.html");
        assertThat(StartupReadyBanner.render("App", 8080, "api", false).get(1)).endsWith("http://localhost:8080/api");
        assertThat(StartupReadyBanner.render("App", 8080, "/", false).get(1)).endsWith("http://localhost:8080");
        assertThat(StartupReadyBanner.render("App", 8080, null, false).get(1)).endsWith("http://localhost:8080");
    }

    // --- Listener sobre el Environment ---

    @Test
    void listener_writes_the_banner_when_the_server_listens(CapturedOutput output) {
        MockEnvironment env = new MockEnvironment()
            .withProperty("app.name", "Mi Proyecto")
            .withProperty("local.server.port", "8080")
            .withProperty("springdoc.swagger-ui.enabled", "true");

        new StartupReadyBanner(env).onReady();

        assertThat(output.getOut() + output.getErr())
            .contains("Mi Proyecto API lista en http://localhost:8080")
            .contains("Swagger UI: http://localhost:8080/swagger-ui.html");
    }

    @Test
    void listener_writes_nothing_without_a_web_server(CapturedOutput output) {
        new StartupReadyBanner(new MockEnvironment().withProperty("app.name", "Mi Proyecto")).onReady();

        assertThat(output.getAll()).doesNotContain("API lista en");
    }

    @Test
    void banner_never_contains_secrets(CapturedOutput output) {
        String jwt = "jwt-secreto-que-no-debe-salir-0123456789-abcdef";
        String dbPassword = "clave-bd-que-no-debe-salir-QZX";
        MockEnvironment env = new MockEnvironment()
            .withProperty("app.name", "Mi Proyecto")
            .withProperty("local.server.port", "8080")
            .withProperty("app.security.jwt.secret", jwt)
            .withProperty("spring.datasource.password", dbPassword);

        new StartupReadyBanner(env).onReady();

        assertThat(output.getAll()).contains("API lista en").doesNotContain(jwt).doesNotContain(dbPassword);
    }
}
