> Commits separados por scope (docs/commits.md): backend · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `application.yml`: `management.endpoint.health.probes.enabled: true` y `show-details: ${HEALTH_SHOW_DETAILS:always}`
- [ ] 1.2 `PublicPaths` sin `/actuator/info`; en `PublicPathsTest`, aserción explícita `PublicPaths.matches("/actuator/info")` falsa
- [ ] 1.3 `application.yml`: `spring.datasource.hikari` con:
  - `minimum-idle: ${DB_POOL_MIN_IDLE:0}`;
  - `idle-timeout: ${DB_POOL_IDLE_TIMEOUT_MS:60000}`;
  - `keepalive-time: 0`;
  - `maximum-pool-size: ${DB_POOL_MAX_SIZE:5}`.

  Sumar las tres variables a `secrets.properties.example`.
- [ ] 1.4 `HealthPingIT`: liveness sin sesión → `200`, `status` `UP`, sin `db`; con un `HealthIndicator` de prueba en `DOWN` (`@TestConfiguration`), `/actuator/health` responde `503` y liveness sigue `200 UP`; `/actuator/info` sin sesión → `401`
- [ ] 1.5 `HealthDetailsIT` (`@SpringBootTest(properties = "management.endpoint.health.show-details=never")`): `/actuator/health` sin `components`
- [ ] 1.6 `DataSourcePoolIT`:
  - propiedades efectivas del `HikariDataSource` (0 / 0 / 60 000 / 5);
  - con `idle-timeout` de 10 s solo en el test (mínimo de Hikari), tras abrir y devolver conexiones, esperar con Awaitility (incluido en `spring-boot-starter-test`; `pollInterval` 100 ms, `atMost` 90 s, por el housekeeper de 30 s) hasta que `getHikariPoolMXBean().getTotalConnections()` sea 0. No se toca la propiedad interna `com.zaxxer.hikari.housekeeping.periodMs`;
  - por separado, tras `softEvictConnections()` una consulta responde.
- [ ] 1.7 `mvn dependency:tree`: confirmar HikariCP 7.0.2 (y Awaitility 4.3.0) y registrarlo en el design. `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `modules/core/hooks/useSlowWait.ts` (genérico: `true` tras `ms` con `active`; `false` al pasar a inactivo; limpia el timer al desmontar) con su test
- [ ] 2.2 `RootLayout`: splash con el mensaje de arranque en frío (`role="status"`, `aria-live="polite"`, spinner) cuando `useSlowWait(status idle/loading, 4000)`
- [ ] 2.3 Tests de `RootLayout` (uno por scenario, `vi.useFakeTimers()` + `advanceTimersByTimeAsync`, refresh retenido con MSW):
  - rápido sin mensaje;
  - a los 4 s con mensaje;
  - éxito tras la espera, el mensaje desaparece;
  - error tras la espera, login sin aviso;
  - StrictMode envuelto explícitamente en el test (`<StrictMode>` alrededor del árbol; `main.tsx` no aplica en los tests): una sola petición de refresh, un aviso, y `vi.getTimerCount()` 0 tras resolver el refresh y desmontar.

  `pnpm validate` verde.

## 3. Docs

- [ ] 3.1 `docs/backend.md` §11.1:
  - probes y liveness sin BD;
  - `HEALTH_SHOW_DETAILS`;
  - `/actuator/info` autenticado;
  - pool de Hikari, por qué no retiene conexiones ni hace keepalive.
- [ ] 3.2 Crear `docs/deployment.md`, con un enlace en `CLAUDE.md`:
  - **Render**: el monitor externo a `/actuator/health/liveness` cada 10 min (UptimeRobot o cron-job.org) es obligatorio. El health check de Render, a la misma ruta, no lo sustituye. Presupuesto de 750 h/mes. `HEALTH_SHOW_DETAILS=never`. Medir RSS y arranque en el primer despliegue y ajustar `JAVA_TOOL_OPTIONS` solo tras medir.
  - **Neon**: cadena directa con `sslmode=require`, no `-pooler`. Misma región. La base duerme y el pool lo permite. Copias de seguridad pendientes en `add-database-backups`.
  - **Condición previa a desplegar**: la cookie de refresh `SameSite=Lax` exige el mismo *site* entre frontend y API. Opciones: proxy/rewrite al mismo origen (preferida), dominio propio con subdominios o `SameSite=None` (descartada). El proxy debe esperar el arranque en frío: Vercel Hobby compatible (120 s), Netlify no compatible (26 s), Render Static Sites a validar con una prueba real. La decisión y la prueba van en el change de despliegue.
- [ ] 3.3 Al archivar: `docs/vision.md` ✅
