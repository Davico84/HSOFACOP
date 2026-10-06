> Commits separados por scope (docs/commits.md): backend/infra · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`. Las tareas marcadas **(usuario)** son pasos en paneles externos: las hace el usuario con la guía; yo verifico el resultado.

## 1. Backend en contenedor

- [ ] 1.1 `application.yml`: `server.port: ${PORT:8080}`
- [ ] 1.2 `modules/backend/Dockerfile` multi-etapa (JDK 25 → JRE 25, usuario sin privilegios, `JAVA_TOOL_OPTIONS` iniciales) y `.dockerignore` (`secrets.properties`, `target/`, `.env*`)
- [ ] 1.3 Verificación local, que registra arranque, RSS y resultado en `docs/deployment.md`:
  - `docker build`;
  - la imagen no contiene `secrets.properties` ni `.env`;
  - `docker run -m 512m --cpus 0.1 -e PORT=10000` contra el Postgres de compose.

  Ajustar la JVM si hace falta.
- [ ] 1.4 `render.yaml` en la raíz (servicio Docker free, `rootDir`, health check a liveness, `envVars` fijas y `sync: false`)

## 2. Frontend

- [ ] 2.1 `core/config/apiBaseUrl.ts` (`resolveApiBaseUrl`) + test (dev/prod con y sin `VITE_API_URL`); `httpClient.ts` lo usa
- [ ] 2.2 Quitar `BACKEND_URL` (`vite.config.ts`, `vitest.config.ts`, `vite-env.d.ts`, comentario de `handlers.ts`); `.env.example` con `VITE_API_URL`; tipar `VITE_API_URL` en `vite-env.d.ts`
- [ ] 2.3 `modules/frontend/vercel.json`:
  - `/auth/:path*` con `Accept: text/html` → `index.html`;
  - `/api/:path*` y `/auth/:path*` → Render;
  - fallback de la SPA.

  Test que lee el JSON y fija orden y condiciones (sin `/actuator`).
- [ ] 2.4 `pnpm validate` verde

## 3. Puesta en marcha (usuario, guiada)

- [ ] 3.1 **(usuario)** Neon: proyecto en `us-east-2`, cadena directa con `sslmode=require`
- [ ] 3.2 **(usuario)** Render: "New Blueprint" desde el repo; cargar `DB_*`, `JWT_SECRET` (aleatorio de 48 bytes) y `CORS_ALLOWED_ORIGINS` (provisional hasta tener la URL de Vercel). Primer deploy: Flyway migra y liveness `200`
- [ ] 3.3 Completar la URL de Render en `vercel.json` (commit)
- [ ] 3.4 **(usuario)** Vercel: importar el repo, Root Directory `modules/frontend`, sin `VITE_API_URL`; ajustar `CORS_ALLOWED_ORIGINS` en Render al dominio de Vercel
- [ ] 3.5 **(usuario)** Monitor externo a liveness cada 10 min
- [ ] 3.6 **(usuario)** Registrar la cuenta y promoverla a ADMIN en el SQL Editor de Neon

## 4. Verificación del despliegue

- [ ] 4.1 Smoke E2E contra la URL pública (`E2E_BASE_URL=https://<app>.vercel.app pnpm exec playwright test e2e/auth.smoke.spec.ts`)
- [ ] 4.2 Checklist de `docs/deployment.md`:
  - login y recarga con sesión, también en Safari/iOS;
  - recargar `/auth/login` y `/historias` muestra la app;
  - liveness `200`, health sin detalle, info `401`;
  - contacto de soporte;
  - arranque en frío real (sin monitor 20 min).

  Registrar resultados.
- [ ] 4.3 Si `has` por `Accept` falla en Vercel: plan c) (rutas de la SPA `/ingresar`, `/registro`) y actualizar design/spec

## 5. Docs

- [ ] 5.1 `docs/deployment.md`: pasos concretos (Neon → Render blueprint → Vercel → monitor → ADMIN), mediciones y checklist con resultado; `docs/architecture.md`/`docs/tooling-setup.md` si mencionan `BACKEND_URL`
- [ ] 5.2 Al archivar: `docs/vision.md` ✅
