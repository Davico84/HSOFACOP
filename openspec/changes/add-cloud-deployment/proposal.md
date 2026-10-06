## Why

El sistema ya está preparado para planes gratuitos: ping de liveness, pool que deja dormir a la base, pantalla de arranque en frío y contacto de soporte. Pero todavía no se puede publicar:
- el backend no tiene imagen de contenedor, y Render no tiene runtime de Java propio, así que necesita Docker;
- no escucha en el puerto que asigna Render (`PORT`);
- el frontend apunta por defecto a `http://localhost:8080` también en producción;
- falta servir la API bajo el mismo origen que el frontend, condición de la cookie de sesión `SameSite=Lax` (`docs/deployment.md` §3).

## What Changes

- **Backend en contenedor**:
  - `Dockerfile` multi-etapa: build con Maven sobre JDK 25 y ejecución sobre JRE 25, como usuario sin privilegios, sin secretos en la imagen;
  - `.dockerignore`;
  - JVM acotada para 512 MB;
  - `server.port: ${PORT:8080}`.

  Se verifica localmente con `docker run -m 512m`: arranque, memoria (RSS) y liveness.
- **Blueprint de Render** (`render.yaml`): servicio web Docker en plan gratuito, health check a `/actuator/health/liveness` y variables declaradas. Las fijas van en el archivo (`HEALTH_SHOW_DETAILS=never`, `SWAGGER_ENABLED=false`, `COOKIE_SECURE=true`); los secretos (`DB_*`, `JWT_SECRET`) se marcan para cargarlos en el panel, nunca en el repo.
- **Frontend en Vercel con la API en el mismo origen** (`modules/frontend/vercel.json`):
  - rewrites `/api/*` y `/auth/*` hacia el backend en Render (Vercel Hobby espera hasta 120 s, suficiente para el arranque en frío);
  - fallback de la SPA a `index.html`;
  - en producción el cliente usa rutas **relativas** (mismo origen), así la cookie de refresh es de primera parte y `SameSite=Lax` (la protección CSRF actual) se mantiene.
- **Una sola variable para la URL de la API** (`VITE_API_URL`): en desarrollo, por defecto `http://localhost:8080`; en producción, por defecto el mismo origen. Se quitan el `BACKEND_URL` de `vite.config.ts` (nadie lo lee) y el de `.env.example`.
- **CORS en despliegue**: Vercel reenvía el `Origin` del navegador al backend, así que `CORS_ALLOWED_ORIGINS` debe ser el dominio del frontend. Si no, el refresh responde `403` aunque todo salga del mismo origen.
- **Puesta en marcha guiada** (pasos manuales del usuario, documentados):
  - crear Neon, Render (desde el blueprint), Vercel y el monitor externo;
  - promover el primer ADMIN por SQL;
  - recorrer el checklist: sesión que sobrevive a recargar (también en Safari/iOS), arranque en frío real y smoke E2E contra la URL pública.

## Capabilities

### New Capabilities
- `cloud-deployment`: cómo se empaqueta y publica el sistema en planes gratuitos (imagen del backend, blueprint de Render, frontend con la API en el mismo origen y verificación del despliegue).

### Modified Capabilities
<!-- ninguna: el comportamiento de la app no cambia; la URL de la API por entorno es parte del despliegue -->

## Impact

- Backend:
  - `modules/backend/Dockerfile` y `.dockerignore`;
  - `application.yml` (`server.port`).

  Sin cambios de API, contrato ni dominio.
- Raíz: `render.yaml`.
- Frontend:
  - `vercel.json`;
  - `core/config/httpClient.ts` (URL base por entorno, en una función probada);
  - `vite.config.ts`, `vite-env.d.ts` y `.env.example` (`VITE_API_URL`).
- Docs: `docs/deployment.md` (pasos concretos y checklist con resultados); `docs/architecture.md` si menciona `BACKEND_URL`.
- Cuentas externas (las crea el usuario): Neon, Render, Vercel, UptimeRobot. Sin costo.
