package com.odontorisas.health;

import com.odontorisas.AbstractIntegrationTest;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;

import javax.sql.DataSource;
import java.sql.Connection;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;
import static org.awaitility.Awaitility.await;

/**
 * Scenario "Retiro de conexiones ociosas": con idle-timeout de 10 s (el mínimo de Hikari, solo
 * aquí) el pool queda sin conexiones. El housekeeper corre cada 30 s, de ahí el límite de 90 s.
 */
@SpringBootTest(properties = "DB_POOL_IDLE_TIMEOUT_MS=10000")
class DataSourceIdleRetirementIT extends AbstractIntegrationTest {

    @Autowired
    DataSource dataSource;

    @Test
    void idle_connections_are_retired_after_the_idle_timeout() throws Exception {
        HikariDataSource hikari = (HikariDataSource) dataSource;
        List<Connection> open = new ArrayList<>();
        for (int i = 0; i < 3; i++) {
            open.add(hikari.getConnection());
        }
        for (Connection connection : open) {
            connection.close();
        }
        assertThat(hikari.getHikariPoolMXBean().getTotalConnections()).isPositive();

        await().pollInterval(Duration.ofMillis(100)).atMost(Duration.ofSeconds(90))
            .untilAsserted(() -> assertThat(hikari.getHikariPoolMXBean().getTotalConnections()).isZero());
    }
}
