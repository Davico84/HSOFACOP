package com.odontorisas.infra.security;

import com.odontorisas.common.Role;
import com.odontorisas.persistence.entity.User;
import org.junit.jupiter.api.Test;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.Import;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Arranque con el binding real de {@code app.security.*} + {@link TokenService}: un secreto
 * inseguro impide arrancar, con el mensaje de su regla y sin el valor en ninguna causa.
 */
class JwtSecretStartupTest {

    private static final String VALID = "valid-secret-for-startup-test-0123456789-abcdef";

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(SecurityProperties.class)
    @Import(TokenService.class)
    static class Config {
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class))
        .withUserConfiguration(Config.class);

    private static final String[] OTHER_JWT_PROPS = {
        "app.security.jwt.issuer=test", "app.security.jwt.access-ttl=PT15M", "app.security.jwt.refresh-ttl=P7D"};

    private static String failureChain(Throwable failure) {
        StringBuilder sb = new StringBuilder();
        for (Throwable t = failure; t != null; t = t.getCause()) {
            sb.append(t).append('\n');
        }
        return sb.toString();
    }

    private void assertFailsWith(String expected, String forbiddenValue, String... properties) {
        runner.withPropertyValues(properties).run(context -> {
            assertThat(context).hasFailed();
            String chain = failureChain(context.getStartupFailure());
            assertThat(chain).contains("app.security.jwt.secret").contains(expected);
            if (forbiddenValue != null) {
                assertThat(chain).doesNotContain(forbiddenValue);
            }
        });
    }

    @Test
    void no_jwt_properties_at_all_fails_with_message_not_npe() {
        runner.run(context -> {
            assertThat(context).hasFailed();
            String chain = failureChain(context.getStartupFailure());
            assertThat(chain).contains("app.security.jwt.secret es obligatorio").doesNotContain("NullPointerException");
        });
    }

    @Test
    void undefined_secret_with_other_jwt_properties_fails() {
        assertFailsWith("es obligatorio", null, OTHER_JWT_PROPS);
    }

    @Test
    void unresolved_placeholder_fails() {
        String[] props = {"app.security.jwt.secret=${JWT_SECRET}", OTHER_JWT_PROPS[0], OTHER_JWT_PROPS[1], OTHER_JWT_PROPS[2]};
        assertFailsWith("no está resuelto", null, props);
    }

    @Test
    void short_secret_fails_without_revealing_it() {
        String shortSecret = "corto-marcador-QZX-9f8e7d6c5b4a"; // 31 bytes
        assertThat(shortSecret).hasSize(31);
        String[] props = {"app.security.jwt.secret=" + shortSecret, OTHER_JWT_PROPS[0], OTHER_JWT_PROPS[1], OTHER_JWT_PROPS[2]};
        assertFailsWith("al menos 32 bytes", shortSecret, props);
    }

    @Test
    void valid_secret_starts_and_signs_verifiable_tokens() {
        String[] props = {"app.security.jwt.secret=" + VALID, OTHER_JWT_PROPS[0], OTHER_JWT_PROPS[1], OTHER_JWT_PROPS[2]};
        runner.withPropertyValues(props).run(context -> {
            assertThat(context).hasNotFailed();
            TokenService tokens = context.getBean(TokenService.class);
            User user = User.builder().id(7L).email("ana@clinica.test").role(Role.ADMIN).build();

            String token = tokens.issueAccessToken(user);

            assertThat(tokens.verifyAccessToken(token).userId()).isEqualTo(7L);
        });
    }
}
