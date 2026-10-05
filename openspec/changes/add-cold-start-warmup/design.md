## Context

- **Render free**:
  - el servicio se suspende tras 15 min sin tráfico entrante; la siguiente petición lo despierta y espera el arranque de Spring Boot (~1 min);
  - 750 h de instancia por workspace al mes: un solo servicio despierto 24/7 (~730 h) cabe;
  - 512 MB de RAM y 0,1 CPU.
- **Neon free**:
  - el cómputo se suspende tras ~5 min sin actividad; las conexiones persistentes, los keepalives o las reconexiones frecuentes lo impiden;
  - cupo de 100 CU-hora al mes y 1 GB de almacenamiento por proyecto (pricing vigente al proponer).
- **Actuator**: expone `health,info`; `/actuator/health/**` y `/actuator/info` son públicos en `PublicPaths`. Hoy `show-details: always` (decisión consciente para local, `docs/backend.md` §11.1).
- **Pool**: HikariCP 7.0.2 gestionado por Spring Boot 4.0.6 (confirmado con `mvn dependency:tree`; Awaitility 4.3.0 vía `spring-boot-starter-test`). Sin configuración: `minimumIdle` = `maximumPoolSize` = 10 y `keepaliveTime` = 120 000 ms.
- **Frontend**: `RootLayout` llama a `useSessionBootstrap` (single-flight `/auth/refresh`) y muestra "Cargando…" mientras el `status` es `idle`/`loading`. **Toda carga de la app** pasa por ahí, con o sin sesión: es la primera petición al backend.
- **Sesión**: refresh token en cookie `HttpOnly; Secure; SameSite=Lax; Path=/auth`. CSRF está deshabilitado porque la cookie se protege con `SameSite=Lax` + `POST` (`SecurityConfig`).

## Goals / Non-Goals

**Goals:** endpoint barato y público para el monitor externo, sin tocar la base; base que puede suspenderse; superficie pública de Actuator mínima; que una espera larga al cargar la app se explique.

**Non-Goals:**
- acelerar el arranque de Spring Boot (CDS, lazy init, imagen nativa);
- avisar de lentitud a mitad de sesión;
- configurar el despliegue (servicio de Render, hosting del frontend, proxy, cookie): va en otro change. Este change solo **documenta** sus prerrequisitos en `docs/deployment.md` (se crea en el apply, tarea 3.2);
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

### Medir la espera del splash, no un ping aparte desde el navegador
- La primera petición de cada carga ya es el refresh de sesión y el splash ya la espera. Medir esa espera es exacto: si tarda más de 4 s, el usuario está esperando de verdad. Un ping aparte sería una segunda petición midiendo lo mismo.
- **En cada carga, no solo la primera del día**: el servidor puede dormirse varias veces al día si el monitor falla. Como la pantalla solo aparece cuando la espera supera 4 s, en las cargas normales no se ve. Recordar "ya se mostró hoy" en `localStorage` la ocultaría justo cuando hace falta.
- **Fin de la espera**: al terminar el intento de restauración, con éxito o con error, la pantalla desaparece sin animación de cierre. Error = comportamiento actual: sesión limpia y login, sin aviso residual.

### Pantalla de arranque en frío
Mockup revisado con el usuario antes de codear (local, no publicado: lleva la marca de FACOP).

- **Estados** (por segundos de espera; umbrales en constantes con nombre):

  | Espera | Estado | Contenido |
  |---|---|---|
  | 0–4 s | `loading` | Logo + spinner + "Cargando…" (como hoy) |
  | 4–90 s | `warming` | Icono, título "Preparando tu consultorio digital", el mensaje, barra estimada, ayuda "Esto suele tardar menos de un minuto. No cierres esta pestaña: continuará sola." (desde 45 s: "Ya casi está…") |
  | > 90 s | `stuck` | Icono de reloj (tono `warning`), "Está tardando más de lo normal", "El servidor todavía no responde. Puedes seguir esperando o volver a intentarlo.", botón **Reintentar**, "Si el problema continúa, avisa al administrador." |
  | sin red | `offline` | "Sin conexión a internet", "Revisa tu wifi o tus datos móviles. Volveremos a intentarlo solos cuando regrese la conexión.", botón secundario "Reintentar ahora" |

  `offline` tiene prioridad sobre los demás desde el segundo 0 (`navigator.onLine` falso), así no se confunde una red caída con el servidor dormido. Al volver la red (`online`), recarga.
- **Barra estimada, honesta**: `92 × (1 − e^(−s/22))` %. Avanza rápido al inicio, ronda el 85 % al minuto y nunca llega al 100 % por sí sola. No muestra pasos inventados ("conectando a la base…") que no se pueden medir. `role="progressbar"` con `aria-valuenow`. Se anima con `transform: scaleX`, no con `width`.
- **Reintentar** = `window.location.reload()`: reinicia el bootstrap. La petición en curso no se cancela antes; si responde mientras tanto, la app entra.
- **Marco**: en escritorio, el mismo split que el login (`AuthLayout`: panel `brand-start` con el logo blanco y el tagline). La mayoría de arranques en frío terminan en el login, así la transición no salta. En móvil, una columna con el logo a color. Solo tokens (`primary`, `secondary`, `muted`, `warning`), con modo oscuro.
- **Accesibilidad**:
  - región `role="status"` / `aria-live="polite"` que se anuncia **una vez por cambio de estado**, no en cada tic de la barra;
  - el foco va a "Reintentar" cuando aparece `stuck`;
  - `prefers-reduced-motion` desactiva el spinner, el pulso del icono y la transición de la barra.
- **Ubicación** (frontend-guard):
  - `useElapsedWhile(active)` en `modules/core/hooks/`: genérico, segundos transcurridos mientras `active`; se reinicia al pasar a inactivo y limpia su intervalo al desmontar (StrictMode);
  - `useOnlineStatus()` en `modules/core/hooks/`;
  - `ServerWarmupScreen` en `modules/core/components/`: no conoce el dominio; recibe los segundos y si hay red; los textos del proyecto salen de `project`;
  - `RootLayout` la renderiza mientras `status` es `idle`/`loading`. Se extrae el panel de marca de `AuthLayout` a un componente compartido (`BrandPanel`) para no duplicarlo.

### Cookie de sesión entre dominios (condición de despliegue, otro change)
- Con `SameSite=Lax`, el navegador no envía la cookie de refresh si el frontend y el backend son *sites* distintos. `*.vercel.app` y `*.onrender.com` lo son, porque ambos sufijos están en la Public Suffix List. `withCredentials` y CORS no lo compensan.
- Opciones, a decidir en el change de despliegue:
  1. **Preferida: mismo origen con proxy/rewrite del hosting del frontend** (`/api/*` y `/auth/*` hacia Render). La cookie es de primera parte, `SameSite=Lax` y la protección CSRF actual se mantienen, y no hace falta CORS. **Depende del hosting**, porque el proxy debe esperar el arranque en frío (~60 s):
     - **Vercel Hobby**: los rewrites externos esperan hasta 120 s, así que es compatible;
     - **Netlify**: corta los proxy rewrites a los 26 s, así que **no es compatible**;
     - **Render Static Sites**: soporta rewrites externos, pero no documenta su timeout; habría que validarlo con una prueba real de 60–90 s antes de elegirlo.
  2. Dominio propio con subdominios (`app.` y `api.` del mismo dominio): mismo *site*, `Lax` funciona; requiere comprar un dominio.
  3. `SameSite=None; Secure` + CORS exacto: debilita la protección CSRF actual (requeriría validar `Origin` en `/auth/refresh` y `/auth/logout`), y Safari bloquea las cookies de terceros por defecto. Descartada salvo necesidad.
- Este change solo lo documenta en `docs/deployment.md` como condición previa a desplegar. **Se puede aplicar sin resolver la cookie** (el ping, el pool y el aviso sirven igual), pero el sistema **no es desplegable de extremo a extremo** hasta que el change de despliegue configure el mismo origen (u otra alternativa equivalente) y lo pruebe contra el dominio real.

## Risks / Trade-offs

- El monitor externo es un servicio de terceros: si falla, el arranque en frío vuelve, pero ahora con el aviso.
- 750 h/mes cubren **un** servicio despierto 24/7.
- Render Free (512 MB) con Java 25 + Hibernate + Flyway puede acercarse al límite. Se mide la memoria residente (RSS) y el arranque en el primer despliegue, y se ajusta la JVM (`JAVA_TOOL_OPTIONS`) solo tras medir.
- "No caduca" no es copia de seguridad: un borrado por error o un cambio del plan gratuito siguen siendo riesgo (`add-database-backups`).
- Si Neon tarda en despertar, la primera petición espera dentro del `connection-timeout` de Hikari (30 s por defecto), suficiente.
- axios no tiene timeout configurado, así que el refresh espera el arranque completo. Si en el futuro se pone uno, o si el proxy del hosting lo impone, debe superar ~90 s.
