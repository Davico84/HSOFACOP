package com.odontorisas.health;

import com.odontorisas.AbstractIntegrationTest;
import com.zaxxer.hikari.HikariDataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;

import javax.sql.DataSource;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Requirement "Pool de conexiones que permite suspender la base": sin mínimo de conexiones ni
 * keepalive (la base puede dormir), y el pool se recupera al volver a usarse.
 * El retiro por idle-timeout está en {@link DataSourceIdleRetirementIT}.
 */
@SpringBootTest
class DataSourcePoolIT extends AbstractIntegrationTest {

    @Autowired
    DataSource dataSource;

    @Autowired
    JdbcTemplate jdbc;

    @Test
    void pool_defaults_let_the_database_sleep() {
        HikariDataSource hikari = (HikariDataSource) dataSource;
        assertThat(hikari.getMinimumIdle()).isZero();
        assertThat(hikari.getKeepaliveTime()).isZero();
        assertThat(hikari.getIdleTimeout()).isEqualTo(60_000);
        assertThat(hikari.getMaximumPoolSize()).isEqualTo(5);
    }

    @Test
    void a_query_opens_a_new_connection_after_the_pool_is_emptied() {
        HikariDataSource hikari = (HikariDataSource) dataSource;
        hikari.getHikariPoolMXBean().softEvictConnections();

        assertThat(jdbc.queryForObject("SELECT 1", Integer.class)).isEqualTo(1);
    }
}
