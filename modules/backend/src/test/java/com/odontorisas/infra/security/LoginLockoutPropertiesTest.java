package com.odontorisas.infra.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.boot.autoconfigure.AutoConfigurations;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.boot.validation.autoconfigure.ValidationAutoConfiguration;
import org.springframework.context.annotation.Configuration;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Scenarios de "Configuración del bloqueo validada al arranque": binding real de
 * {@code app.auth.lockout.*} con validación, sin Docker.
 */
class LoginLockoutPropertiesTest {

    @Configuration(proxyBeanMethods = false)
    @EnableConfigurationProperties(LoginLockoutProperties.class)
    static class Config {
    }

    private final ApplicationContextRunner runner = new ApplicationContextRunner()
        .withConfiguration(AutoConfigurations.of(
            ConfigurationPropertiesAutoConfiguration.class,
            ValidationAutoConfiguration.class))
        .withUserConfiguration(Config.class);

    /** Mensajes de toda la cadena de causas: el nombre de la propiedad puede ir en cualquiera. */
    private static String failureChain(Throwable failure) {
        StringBuilder sb = new StringBuilder();
        for (Throwable t = failure; t != null; t = t.getCause()) {
            sb.append(t.getMessage()).append('\n');
        }
        return sb.toString();
    }

    @Test
    void defaults_are_five_attempts_and_fifteen_minutes() {
        runner.run(context -> {
            assertThat(context).hasNotFailed();
            LoginLockoutProperties props = context.getBean(LoginLockoutProperties.class);
            assertThat(props.maxAttempts()).isEqualTo(5);
            assertThat(props.window()).isEqualTo(Duration.ofMinutes(15));
        });
    }

    @Test
    void valid_custom_values_are_bound() {
        runner.withPropertyValues("app.auth.lockout.max-attempts=3", "app.auth.lockout.window=PT30M")
            .run(context -> {
                assertThat(context).hasNotFailed();
                LoginLockoutProperties props = context.getBean(LoginLockoutProperties.class);
                assertThat(props.maxAttempts()).isEqualTo(3);
                assertThat(props.window()).isEqualTo(Duration.ofMinutes(30));
            });
    }

    @ParameterizedTest
    @ValueSource(strings = {"0", "-1"})
    void max_attempts_below_one_prevents_startup(String value) {
        runner.withPropertyValues("app.auth.lockout.max-attempts=" + value)
            .run(context -> {
                assertThat(context).hasFailed();
                assertThat(failureChain(context.getStartupFailure()))
                    .contains("app.auth.lockout")
                    .containsAnyOf("maxAttempts", "max-attempts");
            });
    }

    @ParameterizedTest
    @ValueSource(strings = {"PT0S", "-PT1M", "not-a-duration"})
    void invalid_window_prevents_startup(String value) {
        runner.withPropertyValues("app.auth.lockout.window=" + value)
            .run(context -> {
                assertThat(context).hasFailed();
                assertThat(failureChain(context.getStartupFailure())).contains("app.auth.lockout.window");
            });
    }
}
