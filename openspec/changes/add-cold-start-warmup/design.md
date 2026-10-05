## Context

- **Render free**:
  - el servicio se suspende tras 15 min sin tráfico entrante; la siguiente petición lo despierta y espera el arranque de Spring Boot (~1 min);
  - 750 h de instancia por workspace al mes: un solo servicio despierto 24/7 (~730 h) cabe;
  - 512 MB de RAM y 0,1 CPU.
- **Neon free**:
  - el cómputo se suspende tras ~5 min sin actividad; las conexiones persistentes, los keepalives o las reconexiones frecuentes lo impiden;
  - cupo de 100 CU-hora al mes y 1 GB de almacenamiento por proyecto (pricing vigente al proponer).
- **Actuator**: expone `health,info`; `/actuator/health/**` y `/actuator/info` son públicos en `PublicPaths`. Hoy `show-details: always` (decisión consciente para local, `docs/backend.md` §11.1).
- **Pool**: HikariCP gestionado por Spring Boot 4.0.6; `~/.m2` tiene 7.0.2 (a confirmar con `mvn dependency:tree`). Sin configuración: `minimumIdle` = `maximumPoolSize` = 10 y `keepaliveTime` = 120 000 ms.
- **Frontend**: `RootLayout` llama a `useSessionBootstrap` (single-flight `/auth/refresh`) y muestra "Cargando…" mientras el `status` es `idle`/`loading`. **Toda carga de la app** pasa por ahí, con o sin sesión: es la primera petición al backend.
- **Sesión**: refresh token en cookie `HttpOnly; Secure; SameSite=Lax; Path=/auth`. CSRF está deshabilitado porque la cookie se protege con `SameSite=Lax` + `POST` (`SecurityConfig`).

## Goals / Non-Goals

**Goals:** endpoint barato y público para el monitor externo, sin tocar la base; base que puede suspenderse; superficie pública de Actuator mínima; que una espera larga al cargar la app se explique.

**Non-Goals:**
- acelerar el arranque de Spring Boot (CDS, lazy init, imagen nativa);
- avisar de lentitud a mitad de sesión;
- configurar el despliegue (servicio de Render, hosting del frontend, proxy, cookie): va en otro change;
- copias de seguridad (`add-database-backups`).

## Decisions

### Ping: liveness de Actuator, no un controlador propio
- Se pidió `/api/v1/health-check` con `{"status":"UP"}`. Actuator ya da `status: UP` en `/actuator/health/liveness`: ya es público, los monitores lo entienden y no hay código que mantener ni proteger. Un controlador propio duplicaría Actuator y sumaría otra ruta a `PublicPaths`.
- **No se fija el cuerpo completo**: con `show-details: always` incluye `components.livenessState`; con `never`, solo `status`. El contrato es: `200`, `status: UP`, sin `db`.
- **Liveness, no `/actuator/health`**: el health general consulta la BD en cada llamada y un ping cada 10 min mantendría Neon despierta. Los grupos de probes no incluyen otros indicadores salvo `management.endpoint.health.group.liveness.include` (que no se configura).
- Se activa con `management.endpoint.health.probes.enabled: true`, porque fuera de Kubernetes no se activa solo.
- Alternativa descartada: `/api/v1/health-check`. El proyecto no versiona rutas (`/api/...`, `/auth/...`).
- **El health check de Render no sustituye al monitor externo**. Render lo usa para verificar instancias activas y despliegues, no documenta que cuente como tráfico que evite la suspensión. Se configura igual a la ruta de liveness (sin BD), pero el monitor externo es obligatorio.

### Superficie pública de Actuator
- `show-details: ${HEALTH_SHOW_DETAILS:always}`. En Render, `never`: `/actuator/health` responde solo `status`.
- `/actuator/info` se queda expuesto pero **autenticado**: sale de `PublicPaths`, así `anyRequest().authenticated()` lo cubre. Nada lo consume, y no queda una ruta pública cuyo contenido pueda crecer sin revisión (build-info, git). Se actualizan `PublicPathsTest` y `docs/backend.md` §11.1.

### Base en Neon que duerme: pool sin mínimo ni keepalive
- Lo que mantendría despierta la base es el propio backend: Hikari retiene `minimumIdle` conexiones y, con su keepalive por defecto, las usa cada 2 min.
- `spring.datasource.hikari`:
  - `minimum-idle: ${DB_POOL_MIN_IDLE:0}`;
  - `idle-timeout: ${DB_POOL_IDLE_TIMEOUT_MS:60000}` (mínimo de Hikari: 10 000);
  - `keepalive-time: 0` (desactivado; fijo, sin variable);
  - `maximum-pool-size: ${DB_POOL_MAX_SIZE:5}`.
- `idleTimeout` aplica porque `minimumIdle` < `maximumPoolSize`. Hikari **puede** retirar todas las conexiones ociosas tras `idleTimeout`, con la tolerancia de su revisión periódica (hasta ~30 s más). No se promete un pool vacío exactamente a los 60 s.
- La siguiente petición abre una conexión nueva y Neon despierta en ese momento. Mismos valores en local: el costo de reconectar es mínimo.
- **Conexión**: cadena **directa** de Neon con `sslmode=require` en `DB_URL`. El endpoint `-pooler` es PgBouncer en modo transacción y no conserva estado de sesión; Flyway necesita semántica de sesión para sus locks. La directa es la opción soportada y segura, y no se depende del pooler sin una prueba específica. Región de Neon igual o cercana a la de Render.

### Aviso en el splash, no un ping aparte desde el navegador
- La primera petición de cada carga ya es el refresh de sesión y el splash ya la espera. Medir esa espera es exacto: si tarda más de 4 s, el usuario está esperando de verdad. Un ping aparte sería una segunda petición midiendo lo mismo.
- `useSlowWait(active, ms)` (hook genérico en `modules/core/hooks/`):
  - devuelve `true` cuando `active` lleva más de `ms`;
  - vuelve a `false` al pasar a inactivo;
  - limpia su timer al desmontar (el doble montaje de StrictMode no deja timers activos ni duplica el aviso).
- `RootLayout` cambia el texto del splash por el mensaje del arranque en frío (`role="status"`, `aria-live="polite"`) con un spinner.
- **En cada carga, no solo la primera del día**: el servidor puede dormirse varias veces al día si el monitor falla. Como el mensaje solo aparece cuando la espera supera 4 s, en las cargas normales no se ve. Recordar "ya se mostró hoy" en `localStorage` ocultaría el aviso justo cuando hace falta.
- **Fin de la espera**: al terminar el intento de restauración, con éxito o con error, el splash desaparece. Error = comportamiento actual: sesión limpia y login, sin aviso residual.

### Cookie de sesión entre dominios (condición de despliegue, otro change)
- Con `SameSite=Lax`, el navegador no envía la cookie de refresh si el frontend y el backend son *sites* distintos. `*.vercel.app` y `*.onrender.com` lo son, porque ambos sufijos están en la Public Suffix List. `withCredentials` y CORS no lo compensan.
- Opciones, a decidir en el change de despliegue:
  1. **Recomendada: mismo origen con proxy/rewrite del hosting del frontend** (`/api/*` y `/auth/*` hacia Render). La cookie es de primera parte, `SameSite=Lax` y la protección CSRF actual se mantienen, y no hace falta CORS. Hay que verificar el timeout del proxy frente al arranque en frío.
  2. Dominio propio con subdominios (`app.` y `api.` del mismo dominio): mismo *site*, `Lax` funciona; requiere comprar un dominio.
  3. `SameSite=None; Secure` + CORS exacto: debilita la protección CSRF actual (requeriría validar `Origin` en `/auth/refresh` y `/auth/logout`), y Safari bloquea las cookies de terceros por defecto. Descartada salvo necesidad.
- Este change solo lo documenta en `docs/deployment.md` como condición previa a desplegar.

## Risks / Trade-offs

- El monitor externo es un servicio de terceros: si falla, el arranque en frío vuelve, pero ahora con el aviso.
- 750 h/mes cubren **un** servicio despierto 24/7.
- Render Free (512 MB) con Java 25 + Hibernate + Flyway puede acercarse al límite. Se mide la memoria residente (RSS) y el arranque en el primer despliegue, y se ajusta la JVM (`JAVA_TOOL_OPTIONS`) solo tras medir.
- "No caduca" no es copia de seguridad: un borrado por error o un cambio del plan gratuito siguen siendo riesgo (`add-database-backups`).
- Si Neon tarda en despertar, la primera petición espera dentro del `connection-timeout` de Hikari (30 s por defecto), suficiente.
- axios no tiene timeout configurado, así que el refresh espera el arranque completo. Si en el futuro se pone uno, o si el proxy del hosting lo impone, debe superar ~90 s.
