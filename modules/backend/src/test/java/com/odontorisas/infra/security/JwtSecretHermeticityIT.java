package com.odontorisas.infra.security;

import com.odontorisas.AbstractIntegrationTest;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.core.env.Environment;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenario "Tests con secreto propio": en un contexto completo el secreto efectivo es el de
 * test, haya o no secrets.properties local, JWT_SECRET en el entorno o propiedades de sistema
 * (-DJWT_SECRET / -Dapp.security.jwt.secret). Se compara por hash: nunca se imprime un secreto.
 */
@SpringBootTest
class JwtSecretHermeticityIT extends AbstractIntegrationTest {

    @Autowired
    SecurityProperties props;

    @Autowired
    Environment environment;

    private static String sha256(String value) throws Exception {
        return HexFormat.of().formatHex(
            MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8)));
    }

    @Test
    void effective_secret_is_the_test_secret() throws Exception {
        String effective = props.jwt().secret();

        assertThat(sha256(effective)).as("hash del secreto efectivo").isEqualTo(sha256(TEST_JWT_SECRET));
        assertThat(sha256(environment.getProperty("app.security.jwt.secret"))).isEqualTo(sha256(TEST_JWT_SECRET));
    }
}
