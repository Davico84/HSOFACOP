## Why

El backend irá al plan gratuito de Render, que **duerme el servicio tras 15 minutos sin tráfico entrante**. Despertarlo (arranque en frío de Spring Boot) tarda cerca de un minuto. Hoy, en ese caso, el odontólogo ve "Cargando…" sin explicación durante ese minuto y puede pensar que la app falló.

La base irá en Neon (capa gratuita sin caducidad; la PostgreSQL gratuita de Render se borra a los 30 días). Neon suspende el cómputo tras ~5 min sin actividad y despierta en menos de un segundo; su cupo mensual de horas de cómputo no alcanza para tenerla despierta 24/7, así que **debe poder dormir**.

Se atacan los dos lados, gratis:
1. **Mantener despierto el backend**: un monitor externo (UptimeRobot o cron-job.org) llama cada 10 minutos a un endpoint público y barato que no toca la base.
2. **Dejar dormir la base**: que el backend no retenga conexiones ni le envíe keepalive.
3. **Explicar la espera** cuando igual ocurra un arranque en frío (el monitor falló, se pausó o es el primer despliegue).

## What Changes

- **Endpoint de ping**: el *liveness probe* de Actuator, `GET /actuator/health/liveness`. Responde `200` con `status: UP`; puede incluir los componentes del grupo (`livenessState`), y el grupo liveness no incluye `db` salvo configuración explícita. Ya es público (`/actuator/health/**` en `PublicPaths`). Se activa con `management.endpoint.health.probes.enabled`. No se crea un controlador propio (ver design).
- **Superficie pública de Actuator**:
  - `show-details` pasa a `${HEALTH_SHOW_DETAILS:always}`. Local queda igual; en Render se pone `never`, así no se publica el estado de la BD ni del disco.
  - `/actuator/info` deja de ser público: sale de `PublicPaths` y queda autenticado. Nada lo usa.
- **Pool de conexiones que deja dormir a la base**:
  - hoy HikariCP retiene 10 conexiones y su versión actual hace keepalive cada 2 min por defecto;
  - pasa a `minimum-idle: 0`, `idle-timeout` de 60 s, `keepalive-time: 0` (desactivado) y máximo 5;
  - los límites se configuran por variables `DB_POOL_*`.

  Hikari puede retirar todas las conexiones ociosas, pero no al segundo exacto: su revisión periódica tiene tolerancia.
- **Aviso de arranque en frío en el frontend**: la app ya espera al backend al cargar. El splash del `RootLayout` se muestra mientras restaura la sesión con `/auth/refresh`, que es siempre la primera petición.
  - Si esa espera pasa de **4 segundos**, el splash cambia a "Estamos preparando tu consultorio digital para iniciar el día, esto puede tomar un minuto…".
  - Al terminar el intento de restauración, con éxito o con error, la app sigue como siempre.
- **Guía de despliegue** (`docs/deployment.md`):
  - el monitor externo, que es el único mecanismo que mantiene despierto el servicio; el health check de Render no lo sustituye;
  - la conexión a Neon: cadena directa con `sslmode=require` para Flyway, misma región que Render;
  - medir la memoria y el arranque en Render Free;
  - la condición de la cookie de sesión entre dominios (ver abajo).

**Fuera de este change, pero condición para desplegar**: la cookie de refresh es `SameSite=Lax`, y esa es la protección CSRF del backend. Si el frontend y el backend quedan en *sites* distintos (p. ej. `*.vercel.app` y `*.onrender.com`), el navegador no la envía y la sesión no se restaura. La guía lo documenta. La solución va en el change de despliegue: preferentemente servir la API bajo el mismo origen del frontend mediante un proxy/rewrite del hosting, porque `SameSite=None` debilitaría la protección CSRF y Safari bloquea igual las cookies de terceros.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `project-foundation`: nuevos requisitos "Endpoint de ping para mantener el backend despierto", "Superficie pública de Actuator mínima", "Pool de conexiones que permite suspender la base" y "Aviso de arranque en frío al cargar la app".

## Impact

- Backend:
  - `application.yml`: probes, `show-details` y pool de Hikari por variables;
  - `PublicPaths` sin `/actuator/info`;
  - tests de health, de la configuración del pool y del pool en integración.

  Sin endpoints nuevos en el contrato OpenAPI (Actuator no está en él).
- Frontend: `RootLayout` (splash) y un hook genérico en `modules/core/hooks/`. Sin dependencias nuevas.
- Docs:
  - `docs/backend.md` §11.1;
  - nueva guía `docs/deployment.md`;
  - `secrets.properties.example`.
- Sin migraciones ni cambios de dominio.
