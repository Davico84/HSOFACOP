## Why

El sistema ya está preparado para planes gratuitos: ping de liveness, pool que deja dormir a la base, pantalla de arranque en frío y contacto de soporte. Pero todavía no se puede publicar:
- el backend no tiene imagen de contenedor, y Render no tiene runtime de Java propio, así que necesita Docker;
- no escucha en el puerto que asigna Render (`PORT`);
- el frontend apunta por defecto a `http://localhost:8080` también en producción;
- falta servir la API bajo el mismo origen que el frontend, condición de la cookie de sesión `SameSite=Lax` (`docs/deployment.md` §3).

## What Changes

- **Producción = rama `main`.** Render (autodeploy, preferentemente solo con los checks del CI en verde) y Vercel (producción) despliegan `main`. `dev` no se despliega: se integra por PR a `main` con el CI en verde, igual que hoy.
- **Backend en contenedor**:
  - `Dockerfile` multi-etapa: build con Maven sobre JDK 25 y ejecución sobre JRE 25;
  - la imagen final contiene solo el jar, corre como usuario sin privilegios y no lleva fuentes, `mvnw` ni configuración local;
  - `.dockerignore`;
  - JVM acotada para 512 MB;
  - `server.port: ${PORT:8080}`.

  Se verifica localmente con `docker run -m 512m --cpus 0.1`: arranque, memoria (RSS) y liveness.
- **Blueprint de Render** (`render.yaml`): servicio web Docker en plan gratuito, rama `main`, health check a `/actuator/health/liveness` y variables declaradas. Las fijas van en el archivo; los secretos se marcan para cargarlos en el panel, nunca en el repo.
- **Frontend en Vercel con la API en el mismo origen**:
  - `vercel.json` en la **raíz** del repo (instalación y build del monorepo con pnpm; salida en `modules/frontend/dist`), para que el build lea `project.config.json` sin depender de opciones del panel;
  - rewrites `/api/*` y `/auth/*` hacia Render y fallback de la SPA;
  - en producción el cliente usa rutas relativas, así la cookie de refresh es de primera parte.
- **Páginas de acceso en `/ingresar` y `/registro`** (antes `/auth/login` y `/auth/register`). Así `/auth/*` queda solo para la API, sin heurísticas en el proxy. Como nunca se publicó, no hay enlaces viejos que redirigir.
- **Una sola variable para la URL de la API** (`VITE_API_URL`): en desarrollo, por defecto `http://localhost:8080`; en producción, por defecto el mismo origen. Se quita el `BACKEND_URL` que nadie lee.
- **CORS en despliegue**: `CORS_ALLOWED_ORIGINS` = origen exacto del frontend de producción (sin `/` final ni comodines), porque Vercel reenvía el `Origin` del navegador. Las *preview deployments* no tienen sesión (limitación deliberada).
- **Puesta en marcha guiada** (pasos manuales del usuario, documentados):
  - crear Neon, Render (blueprint), Vercel y el monitor externo;
  - promover el primer ADMIN por SQL, comprobando 1 fila;
  - recorrer una **matriz de verificación**: rutas y rewrites, cookie y sesión, CORS, arranque en frío real (con login y refresh, no solo liveness) y Safari/iOS.

## Capabilities

### New Capabilities
- `cloud-deployment`: cómo se empaqueta y publica el sistema en planes gratuitos (imagen del backend, blueprint de Render, frontend con la API en el mismo origen y verificación del despliegue).

### Modified Capabilities
<!-- ninguna: las specs vigentes no fijan las rutas de las páginas de acceso (solo los endpoints de la API, que no cambian) -->

## Impact

- Backend:
  - `modules/backend/Dockerfile` y `.dockerignore`;
  - `application.yml` (`server.port`).

  Sin cambios de API, contrato ni dominio.
- Raíz: `render.yaml`, `vercel.json`.
- Frontend:
  - `routes/paths.ts` (`/ingresar`, `/registro`) y los tests y specs E2E que usan esas rutas;
  - `core/config/apiBaseUrl.ts` + `httpClient.ts`;
  - `vite.config.ts`, `vitest.config.ts`, `vite-env.d.ts` y `.env.example`.
- Docs: `docs/deployment.md` (pasos concretos, matriz y resultados).
- Cuentas externas (las crea el usuario): Neon, Render, Vercel, UptimeRobot. Sin costo.
