> Commits separados por scope (docs/commits.md): backend/infra · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`. Las tareas marcadas **(usuario)** son pasos en paneles externos: las hace el usuario con la guía; yo verifico el resultado.

## 1. Backend en contenedor

- [x] 1.1 `application.yml`: `server.port: ${PORT:8080}`
- [x] 1.2 `modules/backend/Dockerfile` multi-etapa y `.dockerignore`:
  - JDK 25 → JRE 25, solo el jar ejecutable;
  - usuario sin privilegios;
  - `JAVA_TOOL_OPTIONS` iniciales.
- [x] 1.3 Verificación local. Registra arranque, RSS y resultado en `docs/deployment.md`; ajusta la JVM si hace falta:
  - `docker build`;
  - inspección: sin `secrets.properties`, `.env`, `src/` ni `mvnw`; usuario no root;
  - `docker run -m 512m --cpus 0.1 -e PORT=10000` contra el Postgres de compose: migra y liveness `200`.
- [x] 1.4 `render.yaml` en la raíz: Docker free, `branch: main`, autodeploy con checks en verde (confirmar campo), `rootDir`, health check a liveness, `envVars` fijas y `sync: false`

## 2. Frontend

- [x] 2.1 `core/config/apiBaseUrl.ts` (`resolveApiBaseUrl`) + test (dev/prod con y sin `VITE_API_URL`); `httpClient.ts` lo usa
- [x] 2.2 Quitar `BACKEND_URL` (`vite.config.ts`, `vitest.config.ts`, `vite-env.d.ts`, comentario de `handlers.ts`); `.env.example` con `VITE_API_URL`; tipar `VITE_API_URL`
- [x] 2.3 `PATHS.LOGIN = "/ingresar"`, `PATHS.REGISTER = "/registro"`. Actualizar las rutas literales en los tests unitarios y E2E (smoke: la ruta privada lleva a `/ingresar`; navegación ida y vuelta a `/registro`). `isAuthPath` (rutas de la API) sin cambios
- [x] 2.4 `vercel.json` en la raíz:
  - install con `--frozen-lockfile`;
  - build `pnpm --filter odontorisas-frontend build`;
  - salida `modules/frontend/dist`;
  - rewrites `/api` y `/auth` → Render y fallback de la SPA.

  Test (en el frontend) que lee el JSON y fija orden, destinos, salida y que `/actuator` no se reenvía.
- [x] 2.5 Build local idéntico al de Vercel desde la raíz (`pnpm install --frozen-lockfile && pnpm --filter odontorisas-frontend build`) y `pnpm validate` verde

## 3. Puesta en marcha (usuario, guiada)

- [x] 3.1 **(usuario)** Neon: proyecto en `us-east-2`, cadena directa con `sslmode=require`
- [x] 3.2 **(usuario)** Render: "New Blueprint" desde el repo (rama `main`).
  - Carga `DB_*`, `JWT_SECRET` (aleatorio de 48 bytes) y `CORS_ALLOWED_ORIGINS=https://pendiente.invalid`.
  - Primer deploy: Flyway migra y liveness `200`.
- [x] 3.3 Completar la URL de Render en `vercel.json` (commit en `dev`, PR a `main`)
- [x] 3.4 **(usuario)** Vercel: importar el repo, Root Directory = raíz, rama de producción `main`, sin `VITE_API_URL`.
  - Poner `CORS_ALLOWED_ORIGINS` en Render = origen exacto de producción de Vercel (sin `/` final).
- [x] 3.5 **(usuario)** Monitor externo a liveness cada 10 min
- [x] 3.6 **(usuario)** Registrar la cuenta y, enseguida, `UPDATE users SET role = 'ADMIN' WHERE email = '<correo>' AND status = 'ACTIVE';` en Neon (1 fila)

## 4. Verificación del despliegue

- [x] 4.1 Matriz de verificación del design (rutas, rewrites, cookie, sesión en Chrome y Safari/iOS, CORS, actuator, arranque en frío con login y refresh y tiempo total, contacto); registrar resultados en `docs/deployment.md`
- [x] 4.2 Smoke E2E contra la URL pública (`E2E_BASE_URL=https://<app>.vercel.app pnpm exec playwright test e2e/auth.smoke.spec.ts`)

## 5. Docs

- [x] 5.1 `docs/deployment.md`:
  - pasos concretos (Neon → Render blueprint → Vercel → monitor → ADMIN);
  - rama de producción;
  - CORS y previews;
  - prueba local con `COOKIE_SECURE`;
  - mediciones, matriz con resultados y riesgo de las etiquetas de imagen.

  `docs/frontend.md` o `docs/architecture.md` si mencionan `/auth/login` como página o `BACKEND_URL`.
- [x] 5.2 Al archivar: `docs/vision.md` ✅
