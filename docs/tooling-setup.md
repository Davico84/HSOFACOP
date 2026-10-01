# Tooling y Setup — Mi Proyecto

Guía **reproducible** del tooling de calidad. Adaptada del template FixRiver a la estructura real de este repo (monorepo con `modules/frontend`, hooks de git en la **raíz**). Complementa `docs/testing.md` (pruebas) y `docs/coding-style.md`.

> Comandos de frontend desde `modules/frontend/`. Los hooks de commit son de repo (raíz).

---

## 1. Scripts de frontend (`modules/frontend/package.json`)

```jsonc
{
  "scripts": {
    "dev": "vite",
    "build": "tsc -b && vite build",
    "preview": "vite preview",
    "lint": "eslint .",
    "typecheck": "tsc -b",
    "test": "vitest run",
    "test:watch": "vitest",
    "test:coverage": "vitest run --coverage",
    "validate": "pnpm typecheck && pnpm lint && pnpm test"
  }
}
```

> **`pnpm validate`** = chequeo completo (typecheck + lint + test). Úsalo antes de subir. El gestor es **pnpm** (`packageManager` fijado en `package.json` para que CI use la misma versión).

---

## 1b. Identidad del proyecto — `project:setup` / `project:apply` (raíz del repo)

Fuente única: `project.config.json` (nombre, tagline, descripción, BD, JWT issuer, logos, favicon, colores de marca; **sin secretos**). Capacidad `template-bootstrap`.

| Comando | Qué hace |
|---|---|
| `pnpm project:setup` | Asistente en consola: pregunta cada dato (Enter = mantener), valida, copia logos a `modules/frontend/public/brand/`, muestra un resumen y aplica al confirmar. La clave de BD solo va a `secrets.properties`. |
| `pnpm project:apply` | Aplica `project.config.json` sin preguntas. |
| `pnpm project:apply --dry-run` | Lista lo que cambiaría, sin escribir. |
| `pnpm project:apply --no-local` | No toca `secrets.properties` ni `.env` locales (útil en la propia plantilla o en CI). |
| `pnpm project:apply --allow-dirty` | Permite cambios sin commitear fuera de la config y `public/brand/` (evítalo: git es el "deshacer"). |
| `pnpm test:template` | Tests del script (`node --test` sobre `scripts/project/*.test.mjs`), uno por Scenario. |

- **Seguridad**: valida por campo antes de nada; exige árbol limpio (salvo la config y los logos); escanea restos del nombre anterior **antes de escribir** (si quedan, no escribe nada); es idempotente (`.template/applied.json` guarda lo aplicado).
- **No toca identificadores técnicos** (paquete Java, `pom.xml` `groupId`/`artifactId`/`name`, `package.json` `name`, `spring.application.name`, clave de orval).
- **Windows**: si el asistente muestra mal los acentos, ejecuta `chcp 65001` antes.
- **Se ejecutan desde la raíz del repo** (están en el `package.json` raíz, no en el del frontend).
- **`JWT_SECRET`**: al crear `secrets.properties`, `project:apply` genera 48 bytes aleatorios. Si **ya tenías** un `secrets.properties` con un secreto corto (< 32 bytes) o con el valor de ejemplo, el backend **no arranca** (el mensaje nombra `app.security.jwt.secret`, nunca el valor) y `project:setup`/`apply` **no lo sustituyen** (conservan valores personalizados): cámbialo a mano, `JWT_SECRET=` + la salida de `openssl rand -base64 48` (o `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`). Los tests no lo necesitan: usan su propio secreto (`AbstractIntegrationTest`).
- **¿Ya arrancó el backend?** Cuando está listo para recibir peticiones escribe un bloque destacado en el log (`StartupReadyBanner`), fácil de ver en terminales integradas:
  ```
  ============================================================
    >> Mi Proyecto API lista en http://localhost:8080
      Swagger UI: http://localhost:8080/swagger-ui.html
  ============================================================
  ```
  Si no aparece, el arranque falló: busca el primer `Caused by:` del log (p. ej. un `JWT_SECRET` inválido). Si Swagger está apagado, la segunda línea lo dice.
- **Swagger en local** (`http://localhost:8080/swagger-ui.html`): la documentación está **apagada por defecto**; se enciende con `SWAGGER_ENABLED=true` en `modules/backend/secrets.properties` (el `.example` ya la trae, y `project:apply` la copia al crear el archivo). Si tu `secrets.properties` es **anterior** a este cambio no tiene la línea: `project:setup`/`apply` no la añaden solos, así que agrégala a mano o verás `404` en Swagger (la app funciona igual).
- **Copia sin git** (ZIP de GitHub): funciona igual, pero avisa de que no hay forma de deshacer; mejor `git init && git add -A && git commit -m inicial` antes.
- **CI**: workflow `template.yml` (tests + ensayo con una identidad de ejemplo: apply → regenerar cliente sin diferencias → `pnpm validate` + `build` → `mvnw test` + guardián `ContractDriftIT`).

---

## 2. Testing — Vitest + RTL + MSW

Instalado en devDependencies: `vitest`, `@vitest/coverage-v8`, `jsdom`, `@testing-library/{react,jest-dom,user-event}`, `msw`.

Archivos (ya presentes):
- `vitest.config.ts` — plugin react, alias `@`, `environment: "jsdom"`, `setupFiles: ["./src/test/setup.ts"]`, `globals: false`, `define` de globals de Vite (`BACKEND_URL`), y **`pool: "threads"`**.
- `src/test/setup.ts` — `@testing-library/jest-dom/vitest` + `afterEach(cleanup)` + ciclo de vida de MSW (`listen/resetHandlers/close`) + shims de jsdom.
- `src/test/mocks/{handlers,server}.ts` — handlers por defecto y `setupServer`.
- `src/test/utils.tsx` — `renderWithProviders` (React Query + Router; se ampliará con sesión/i18n al existir).

> [!NOTE]
> **Windows**: se usa `pool: "threads"` en Vitest. El pool por defecto (`forks`) provocaba `Timeout waiting for worker to respond` al arrancar el worker.

Convención de tests y matriz de decisiones: `docs/testing.md`.

---

## 3. Commits — husky + commitlint (raíz del repo)

A diferencia del template (monorepo con `core.hooksPath` manual), aquí el `.git` y el `package.json` raíz están juntos, así que se usa **husky estándar en la raíz** (aplica a todos los módulos).

Instalado en el `package.json` **raíz**: `husky`, `@commitlint/cli`, `@commitlint/config-conventional`.

- `package.json` (raíz) → `"prepare": "husky"` (inicializa hooks tras `pnpm install`).
- `commitlint.config.mjs` (raíz) → `extends: ['@commitlint/config-conventional']` + tipos de `docs/commits.md`.
- `.husky/commit-msg` → `pnpm exec commitlint --edit "$1"` (rechaza mensajes no-conventional).

Activación: tras clonar, ejecutar **`pnpm install` en la raíz** una vez.

---

## 4. Pre-commit — lint-staged (frontend)

Hook `pre-commit` en la raíz que ejecuta `lint-staged` **acotado a `modules/frontend/`** (los commits de solo-backend no se ven afectados).

- `modules/frontend/lint-staged.config.mjs`:
  ```js
  export default {
    "*.{ts,tsx}": ["eslint --fix"],
    "*.{ts,tsx,json}": () => "tsc -b",
  };
  ```
- `.husky/pre-commit` (raíz): si hay archivos staged bajo `modules/frontend/`, hace `cd modules/frontend && pnpm exec lint-staged`.
- `lint-staged` está en las devDependencies de `modules/frontend`.

---

## 5. CI

Un workflow **por área** en `.github/workflows/`, cada uno con **path filter** (corre solo si cambia su área) y `concurrency` (cancela runs superados). Disparan en push/PR a `main` y `dev`.

| Workflow | Filtro de rutas | Jobs |
|---|---|---|
| `openspec.yml` | `openspec/**` | `validate` → `openspec validate --all --strict` |
| `frontend.yml` | `modules/frontend/**` | `lint` (typecheck + eslint) · `test` (`vitest --coverage` + artifact) |
| `backend.yml` | `modules/backend/**`, `contracts/**` | `verify` (`./mvnw -B verify`) · *(futuro: lint Spotless/Checkstyle, coverage JaCoCo)* |
| `template.yml` | `scripts/project/**`, `project.config.json`, `.template/**`, `package.json` | `unit` (`node --test` sobre `scripts/project/*.test.mjs`) · `rehearsal` (apply "Acme CRM" → cliente regenerado sin diferencias → `pnpm validate` + `build` + `<title>` → `mvnw test` + guardián `ContractDriftIT`: el apply deja backend y contrato alineados) |

> [!NOTE]
> **Path filters + branch protection**: si más adelante marcas estos checks como *required*, un workflow que no dispara (porque su área no cambió) aparece como *pending/skipped* y puede bloquear el merge. Cuando llegue ese momento, usar "required workflows" a nivel de organización o un job agregador. Por ahora no hay branch protection.
