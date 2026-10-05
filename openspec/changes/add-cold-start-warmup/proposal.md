## Why

El backend irá al plan gratuito de Render, que **duerme el servicio tras 15 minutos sin tráfico**. Despertarlo (arranque en frío de Spring Boot) puede tardar cerca de un minuto. Hoy, en ese caso, el odontólogo ve "Cargando…" sin explicación durante ese minuto y puede pensar que la app falló.

Se atacan los dos lados, gratis:
1. **Mantenerlo despierto**: un servicio externo de ping (UptimeRobot o cron-job.org) llama cada pocos minutos a un endpoint público y barato.
2. **Explicar la espera** cuando igual ocurra un arranque en frío (el ping falló, se pausó o es el primer despliegue).

## What Changes

- **Endpoint de ping**: se usa el *liveness probe* de Actuator, `GET /actuator/health/liveness` → `200 {"status":"UP"}`. Ya es público (`PublicPaths` incluye `/actuator/health/**`) y **no consulta la base de datos**. Basta con activar los probes (`management.endpoint.health.probes.enabled`). No se crea un controlador propio (ver design).
- **Detalle de salud configurable**: `show-details` pasa a `${HEALTH_SHOW_DETAILS:always}`. Local queda igual; en Render se pone `never`, así la ruta pública no publica el estado de la BD ni del disco.
- **Aviso de arranque en frío en el frontend**: la app ya espera al backend al cargar (el splash del `RootLayout` mientras restaura la sesión con `/auth/refresh`, siempre la primera petición). Si esa espera pasa de **4 segundos**, el splash cambia a "Estamos preparando tu consultorio digital para iniciar el día, esto puede tomar un minuto…". Al responder el servidor, la app sigue como siempre.
- **Pool de conexiones que deja dormir a la base**: la BD irá en Neon (capa gratuita sin caducidad; la PostgreSQL gratuita de Render se borra a los 30 días). Neon suspende el cómputo tras ~5 min sin uso y despierta en menos de un segundo, y su cupo mensual de horas de cómputo no alcanza para tenerla despierta 24/7. Hoy HikariCP mantiene 10 conexiones abiertas siempre: pasa a `minimum-idle: 0`, cierre de ociosas al minuto, sin keepalive y máximo 5, todo por variables (`DB_POOL_*`).
- **Guía de despliegue**: ping (ruta, intervalo de 10 minutos, presupuesto de horas de Render) y conexión a Neon (cadena directa con `sslmode=require`, no la `-pooler`, por los *advisory locks* de Flyway; misma región que Render).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `project-foundation`: nuevos requisitos "Endpoint de ping para mantener el backend despierto", "Pool de conexiones que permite suspender la base" y "Aviso de arranque en frío al cargar la app".

## Impact

- Backend: solo `application.yml` (probes, `show-details` y pool de Hikari por variables) y un test de integración. Sin endpoints nuevos en el contrato OpenAPI (Actuator no está en él).
- Frontend: `RootLayout` (splash) y un hook en `modules/core/hooks/`. Sin dependencias nuevas.
- Docs: `docs/backend.md` §11.1 (probes y `HEALTH_SHOW_DETAILS`) y nueva guía `docs/deployment.md` con el ping.
- Sin migraciones ni cambios de dominio.
