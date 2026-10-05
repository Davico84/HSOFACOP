## Context

- Render free: el servicio se duerme a los 15 min sin peticiones; la siguiente petición lo despierta y espera el arranque de Spring Boot (hasta ~1 min). Cada cuenta gratuita tiene 750 horas de instancia al mes: un solo servicio despierto 24/7 (~730 h) cabe.
- Actuator ya está expuesto (`health,info`) y `/actuator/health/**` es público en `PublicPaths`. Hoy `show-details: always` (decisión consciente para local, documentada en `docs/backend.md` §11.1).
- Frontend: `RootLayout` llama a `useSessionBootstrap` (single-flight `/auth/refresh`) y muestra "Cargando…" mientras el `status` es `idle`/`loading`. **Toda carga de la app** pasa por ahí, con o sin sesión: es la primera petición al backend.

## Goals / Non-Goals

**Goals:** endpoint barato y público para el ping externo; que una espera larga al cargar la app se explique con un mensaje amable.

**Non-Goals:** acelerar el arranque de Spring Boot (CDS, lazy init, imagen nativa), avisar de lentitud a mitad de sesión, configurar el despliegue en Render (otro change), elegir el proveedor de la base de datos.

## Decisions

### Ping: liveness de Actuator, no un controlador propio
- Se pidió `/api/v1/health-check` con `{"status":"UP"}`. Actuator ya da exactamente eso en `/actuator/health/liveness`: ya es público, Render y los servicios de ping lo entienden, y no hay código que mantener ni proteger. Un controlador propio duplicaría Actuator y sumaría otra ruta a `PublicPaths`.
- **Liveness, no `/actuator/health`**: el health general consulta la BD en cada llamada. Un ping cada 10 minutos mantendría despierta también una BD que se duerma sola (p. ej. Neon) y gastaría sus horas de cómputo gratuitas. Liveness solo dice "la JVM responde".
- Se activa con `management.endpoint.health.probes.enabled: true` (fuera de Kubernetes no se activa solo).
- Alternativa descartada: `/api/v1/health-check`. El proyecto no versiona rutas (`/api/...`, `/auth/...`); un `v1` solo aquí rompe la convención.

### `show-details` por variable
- `show-details: ${HEALTH_SHOW_DETAILS:always}`. En Render, `HEALTH_SHOW_DETAILS=never`: `/actuator/health` responde solo `status` sin detallar la BD ni el disco a cualquiera de internet. Local sigue igual.

### Aviso en el splash, no un ping aparte desde el navegador
- La primera petición de cada carga ya es el refresh de sesión y el splash ya la espera. Medir esa espera es exacto: si tarda más de 4 s, el usuario está esperando de verdad. Un ping aparte sería una segunda petición midiendo lo mismo.
- `useSlowWait(active, ms)` (hook genérico en `modules/core/hooks/`): `true` cuando `active` lleva más de `ms`. `RootLayout` cambia el texto del splash por el mensaje del arranque en frío (`role="status"`, `aria-live="polite"`) con un spinner.
- **En cada carga, no solo la primera del día**: el servidor puede dormirse varias veces al día (si el ping falla o se pausa). Como el mensaje solo aparece cuando la espera supera 4 s, en las cargas normales no se ve. Recordar "ya se mostró hoy" en `localStorage` ocultaría el aviso justo cuando hace falta.
- Si el refresh falla tras la espera (servidor caído), sigue el comportamiento actual: sesión limpia y pantalla de login.

## Risks / Trade-offs

- El ping externo es un servicio de terceros: si falla, el arranque en frío vuelve, pero ahora con el aviso.
- 750 h/mes cubren **un** servicio despierto 24/7; un segundo servicio gratuito despierto todo el mes no cabría.
- axios no tiene timeout configurado, así que el refresh espera el arranque completo; si en el futuro se pone un timeout, debe superar ~90 s.
