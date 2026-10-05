> Commits separados por scope (docs/commits.md): backend · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `application.yml`: `management.endpoint.health.probes.enabled: true` y `show-details: ${HEALTH_SHOW_DETAILS:always}`
- [ ] 1.2 `application.yml`: `spring.datasource.hikari` con `minimum-idle: ${DB_POOL_MIN_IDLE:0}`, `idle-timeout: ${DB_POOL_IDLE_TIMEOUT_MS:60000}`, `keepalive-time: 0`, `maximum-pool-size: ${DB_POOL_MAX_SIZE:5}`; sumar las variables a `secrets.properties.example`
- [ ] 1.3 `HealthPingIT`: liveness sin sesión → `200` `UP`; liveness sin `db`; con `HEALTH_SHOW_DETAILS=never`, `/actuator/health` sin `components`. `DataSourcePoolIT`: `HikariDataSource` con los valores por defecto; tras `softEvictConnections` (pool vacío) una consulta responde. `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `modules/core/hooks/useSlowWait.ts` (genérico: `true` tras `ms` con `active`; vuelve a `false` al pasar a inactivo) con su test
- [ ] 2.2 `RootLayout`: splash con el mensaje de arranque en frío (`role="status"`, `aria-live="polite"`, spinner) cuando `useSlowWait(status idle/loading, 4000)`
- [ ] 2.3 Tests (uno por scenario, timers simulados): rápido sin mensaje, a los 4 s con mensaje, desaparece al responder. `pnpm validate` verde

## 3. Docs

- [ ] 3.1 `docs/backend.md` §11.1: probes, liveness sin BD y `HEALTH_SHOW_DETAILS`; pool de Hikari y por qué no retiene conexiones
- [ ] 3.2 `docs/deployment.md` (nuevo): Render (ping externo a `/actuator/health/liveness` cada 10 min con UptimeRobot o cron-job.org, health check de Render a la misma ruta, 750 h/mes, `HEALTH_SHOW_DETAILS=never`) y Neon (cadena directa con `sslmode=require`, no `-pooler`, misma región, la base duerme y el pool lo permite, copias pendientes en `add-database-backups`); enlazar en `CLAUDE.md`
- [ ] 3.3 Al archivar: `docs/vision.md` ✅
