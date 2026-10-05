> Commits separados por scope (docs/commits.md): backend · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `application.yml`: `management.endpoint.health.probes.enabled: true` y `show-details: ${HEALTH_SHOW_DETAILS:always}`
- [ ] 1.2 `PublicPaths` sin `/actuator/info`; actualizar `PublicPathsTest`
- [ ] 1.3 `application.yml`: `spring.datasource.hikari` con:
  - `minimum-idle: ${DB_POOL_MIN_IDLE:0}`;
  - `idle-timeout: ${DB_POOL_IDLE_TIMEOUT_MS:60000}`;
  - `keepalive-time: 0`;
  - `maximum-pool-size: ${DB_POOL_MAX_SIZE:5}`.

  Sumar las tres variables a `secrets.properties.example`.
- [ ] 1.4 `HealthPingIT`: liveness sin sesión → `200`, `status` `UP`, sin `db`; `/actuator/info` sin sesión → `401`
- [ ] 1.5 `HealthDetailsIT` (`@SpringBootTest(properties = "management.endpoint.health.show-details=never")`): `/actuator/health` sin `components`
- [ ] 1.6 `DataSourcePoolIT`:
  - propiedades efectivas del `HikariDataSource` (0 / 0 / 60 000 / 5);
  - con `idle-timeout` mínimo (10 s) en el test, tras abrir y devolver conexiones, esperar hasta que `getTotalConnections()` sea 0 (Awaitility, límite holgado por la tolerancia del housekeeper);
  - por separado, tras `softEvictConnections()` una consulta responde.
- [ ] 1.7 `mvn dependency:tree`: registrar en el design la versión efectiva de HikariCP. `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `modules/core/hooks/useSlowWait.ts` (genérico: `true` tras `ms` con `active`; `false` al pasar a inactivo; limpia el timer al desmontar) con su test
- [ ] 2.2 `RootLayout`: splash con el mensaje de arranque en frío (`role="status"`, `aria-live="polite"`, spinner) cuando `useSlowWait(status idle/loading, 4000)`
- [ ] 2.3 Tests de `RootLayout` (uno por scenario, `vi.useFakeTimers()` + `advanceTimersByTimeAsync`, refresh retenido con MSW):
  - rápido sin mensaje;
  - a los 4 s con mensaje;
  - éxito tras la espera, el mensaje desaparece;
  - error tras la espera, login sin aviso;
  - StrictMode, una sola petición de refresh, un aviso y `vi.getTimerCount()` 0 al final.

  `pnpm validate` verde.

## 3. Docs

- [ ] 3.1 `docs/backend.md` §11.1:
  - probes y liveness sin BD;
  - `HEALTH_SHOW_DETAILS`;
  - `/actuator/info` autenticado;
  - pool de Hikari, por qué no retiene conexiones ni hace keepalive.
- [ ] 3.2 `docs/deployment.md` (nuevo), con un enlace en `CLAUDE.md`:
  - **Render**: el monitor externo a `/actuator/health/liveness` cada 10 min (UptimeRobot o cron-job.org) es obligatorio. El health check de Render, a la misma ruta, no lo sustituye. Presupuesto de 750 h/mes. `HEALTH_SHOW_DETAILS=never`. Medir RSS y arranque en el primer despliegue y ajustar `JAVA_TOOL_OPTIONS` solo tras medir.
  - **Neon**: cadena directa con `sslmode=require`, no `-pooler`. Misma región. La base duerme y el pool lo permite. Copias de seguridad pendientes en `add-database-backups`.
  - **Condición previa a desplegar**: la cookie de refresh `SameSite=Lax` exige el mismo *site* entre frontend y API. Opciones: proxy/rewrite al mismo origen (recomendada), dominio propio con subdominios o `SameSite=None` (descartada). La decisión va en el change de despliegue.
- [ ] 3.3 Al archivar: `docs/vision.md` ✅
