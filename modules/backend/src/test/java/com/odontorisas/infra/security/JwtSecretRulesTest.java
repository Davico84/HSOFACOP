package com.odontorisas.infra.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullSource;
import org.junit.jupiter.params.provider.ValueSource;

import java.io.IOException;
import java.io.StringReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.Properties;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

/**
 * Reglas de "Secreto de firma de tokens obligatorio y robusto" (authentication), sin Spring.
 * Ningún mensaje puede contener el valor probado.
 */
class JwtSecretRulesTest {

    private static void assertRejected(String secret, String expectedFragment) {
        assertThatThrownBy(() -> JwtSecretRules.validate(secret))
            .isInstanceOf(IllegalStateException.class)
            .hasMessageContaining("app.security.jwt.secret")
            .hasMessageContaining(expectedFragment)
            .satisfies(e -> {
                if (secret != null && !secret.isBlank()) {
                    assertThat(e.getMessage()).doesNotContain(secret);
                }
            });
    }

    @ParameterizedTest
    @NullSource
    @ValueSource(strings = {"", "   ", "\t"})
    void absent_or_blank_is_rejected(String secret) {
        assertRejected(secret, "obligatorio");
    }

    @Test
    void unresolved_placeholder_is_rejected() {
        assertRejected("${JWT_SECRET}", "no está resuelto");
    }

    @Test
    void example_value_is_rejected_as_example() {
        assertRejected(JwtSecretRules.EXAMPLE_SECRET, "valor de ejemplo");
    }

    @Test
    void secret_of_31_bytes_is_rejected() {
        String secret = "x".repeat(31) ;
        assertRejected(secret, "al menos 32 bytes (tiene 31)");
    }

    @Test
    void multibyte_secret_with_less_than_32_chars_but_32_bytes_is_accepted() {
        String secret = "ñ".repeat(16); // 16 caracteres, 32 bytes en UTF-8
        assertThat(secret).hasSize(16);
        assertThat(secret.getBytes(StandardCharsets.UTF_8)).hasSize(32);

        assertThatCode(() -> JwtSecretRules.validate(secret)).doesNotThrowAnyException();
    }

    @Test
    void random_secret_like_project_apply_is_accepted() {
        byte[] bytes = new byte[48];
        new SecureRandom().nextBytes(bytes);

        assertThatCode(() -> JwtSecretRules.validate(Base64.getEncoder().encodeToString(bytes)))
            .doesNotThrowAnyException();
    }

    /** El valor del .example debe ser rechazado por SU regla (no por corto): si cambia, esta constante también. */
    @Test
    void example_file_value_stays_in_sync_with_the_rule() throws IOException {
        Path example = Path.of("secrets.properties.example");
        assertThat(example).as("se ejecuta desde modules/backend").exists();
        Properties props = new Properties();
        props.load(new StringReader(Files.readString(example, StandardCharsets.UTF_8)));
        String exampleSecret = props.getProperty("JWT_SECRET");

        assertThat(exampleSecret).isEqualTo(JwtSecretRules.EXAMPLE_SECRET);
        assertThat(exampleSecret.getBytes(StandardCharsets.UTF_8).length)
            .as("si fuera corto, la regla de longitud taparía la de ejemplo")
            .isGreaterThanOrEqualTo(JwtSecretRules.MIN_SECRET_BYTES);
        assertRejected(exampleSecret, "valor de ejemplo");
    }
}
