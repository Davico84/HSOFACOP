## Context

**Decisión del usuario (2026-09-28): solo lo superficial.** Se configura la identidad **visible** (nombre, tagline, descripción, logos, favicon, colores, títulos de OpenAPI y de la pestaña, textos de docs) y los datos de BD/JWT. **No** se tocan identificadores técnicos: paquete `com.odontorisas`, `OdontorisasApplication`, `pom.xml` `groupId`/`artifactId`/`name`, `package.json` `name`, `spring.application.name`, clave de `orval.config.ts`, slug `odontorisas-frontend` en comandos. Incorporadas dos rondas de revisión de Codex.

Contrato: se exporta a mano (`curl -o contracts/openapi.json`, `docs/backend.md §10.2`); `codegen-drift` (CI del frontend) regenera el cliente y falla si difiere. `ContractDriftIT` **no existe** en este repo (follow-up).

### Matriz de apariciones de "OdontoRisas" (nombre visible, sensible a mayúsculas)

| Archivo | Hoy | Cómo se resuelve | Test |
|---|---|---|---|
| `index.html` | `<title>` | D6: `%PROJECT_NAME%` + plugin | "Título de la pestaña…" |
| `AuthLayout.tsx` | tagline, descripción, footer | D6: lee `project` | "La UI muestra la identidad…" |
| `LoginView.tsx` / `RegisterView.tsx` | subtítulos con el nombre | D6: `LoginFeature`/`RegisterFeature` construyen el subtítulo con `project.name` | "La UI muestra la identidad…" (ambas pantallas) |
| `logo.tsx` | `alt` ×3 + comentario | D6: `alt={project.name}`; comentario sin nombre | ídem |
| `OpenApiConfig.java` | título y descripción | D6: `ProjectProperties` | "Identidad visible, contrato…" |
| `OdontorisasApplication.java` | Javadoc | D6: Javadoc sin nombre (la clase **no** se renombra) | "Identificadores técnicos intactos" |
| `application.yml` | comentario | D6: comentario sin nombre; `app.name`/`app.description` por D4 | "Identidad visible…" |
| `vite.config.ts` | comentario | D6: comentario sin nombre | escáner |
| `assets/brand/README.md` | título | D6: se mueve a `public/brand/README.md` sin nombre | escáner |
| `contracts/openapi.json` | `info.title`/`description` | D4 por clave | "Identidad visible…" + ensayo CI |
| Cliente generado (7 archivos) | cabecera | D4 por línea de cabecera (= contrato) | ensayo CI (`generate:api` → diff solo cabeceras) |
| `pom.xml` | `<description>` | D4 por clave (`<description>` no es identificador) | "Identidad visible…" |
| `package.json` raíz | `description` | D4 por clave | "Identidad visible…" |
| `V1__init.sql` | comentario | **Excluido** del escáner: migración aplicada = inmutable | "Sin restos…" (verifica la exclusión) |
| README, `CLAUDE.md`, `SETUP-OPENSPEC.md`, `docs/**`, `openspec/config.yaml`, `openspec/specs/**`, changes activos, `.github/**/*.md`, skills `commit`/`frontend-guard` | texto | D4 regla de texto | "Identidad visible…" |

## Goals / Non-Goals

**Goals:** una sola fuente de la identidad visible y datos de BD; asistente amigable; aplicación segura, repetible y verificable; cero cambios en identificadores técnicos; plantilla final neutra.

**Non-Goals:** renombrados técnicos, derivar paletas, formulario web, implementar `ContractDriftIT` (follow-up).

## Decisions

### D1. `project.config.json` (sin secretos) + JSON Schema
```json
{
  "$schema": "./scripts/project/project.config.schema.json",
  "name": "OdontoRisas",
  "tagline": "Sonrisas sanas, gestión simple.",
  "description": "Sistema de gestión de la clínica dental OdontoRisas.",
  "database": { "name": "odontorisas", "user": "odontorisas", "port": 5432, "container": "odontorisas-db" },
  "jwtIssuer": "odontorisas",
  "brand": {
    "logo": { "light": "/brand/logo-light.png", "dark": "/brand/logo-dark.png", "white": "/brand/logo-white.png" },
    "favicon": "/favicon.svg",
    "colors": {
      "light": { "primary": "hsl(292 72% 36%)", "ring": "hsl(292 72% 45%)", "brand-start": "hsl(174 70% 40%)", "brand-end": "hsl(292 72% 42%)" },
      "dark":  { "primary": "hsl(292 65% 66%)", "ring": "hsl(292 65% 66%)", "brand-start": "hsl(174 70% 40%)", "brand-end": "hsl(292 72% 42%)" }
    }
  }
}
```
- **`description`**: frase de producto **única**, usada tal cual en el panel del login, en `info.description` de OpenAPI y en la cabecera del cliente generado. El refactor sustituye las redacciones actuales ("La plataforma del Centro Odontológico…", "API de la clínica dental…") por esta. Los **subtítulos contextuales** del login y el registro no son `description`: se construyen con el nombre ("Accede a tu panel de {name}", "Regístrate para empezar a usar {name}").
- **Sin secretos**: clave de BD y `JWT_SECRET` solo en `secrets.properties` (ignorado).
- **Validación** propia (sin `ajv`), error **por campo**: `name` 1–60 caracteres; `tagline`/`description` 1–200; BD `^[A-Za-z_][A-Za-z0-9_]*$`; contenedor `^[a-zA-Z0-9][a-zA-Z0-9_.-]*$`; puerto entero 1–65535; claves de color ∈ tokens del bloque de marca de `globals.css`; colores según la gramática de D3; campos obligatorios presentes.

### D2. Última aplicación: `.template/applied.json`
Copia de la config aplicada por última vez (versionada). `apply` compara `from = applied` con `to = config`: iguales → "sin cambios", cero escrituras; si no, `from.name`/`from.description` son lo que se reemplaza en texto. Si falta, aborta pidiendo crearla.

### D3. Asistente `pnpm project:setup` (`scripts/project/setup.mjs`, `node:readline`, sin deps)
1. Comprueba el árbol (D5) **antes** de preguntar.
2. Pregunta: nombre, tagline, descripción, BD (nombre, usuario, **clave**, puerto, contenedor), JWT issuer, logos (claro/oscuro/blanco: ruta o Enter), favicon, colores (primario, ring, inicio/fin del gradiente, claro y oscuro; Enter = mantener; ring por defecto = primario).
3. Cada respuesta se valida con las **mismas funciones** que D1; si falla, muestra el motivo y repregunta.
4. **Gramática de colores** (cerrada): `#rgb` o `#rrggbb` (hex, sin alpha) → se guarda **tal cual en minúsculas** (sin conversión, sin pérdida); `hsl(H S% L%)` o `hsl(H, S%, L%)` con H 0–360 y S/L 0–100 (enteros o 1 decimal), sin alpha → se guarda normalizado `hsl(H S% L%)`. Cualquier otra forma es inválida.
5. **Logos**: ruta existente con extensión png/svg/webp. Se **planifica** (no se copia aún) el destino `public/brand/logo-<variante>.<ext>`. Una misma fuente puede usarse para varias variantes. Si el destino existe con el mismo contenido → no se copia; con distinto contenido → se reemplazará (se indica en el resumen). Si cambia la extensión de una variante, el archivo anterior de esa variante se borra solo si ninguna otra ruta de la config lo referencia.
6. **Resumen** "antes → después" (incluidas copias y reemplazos de logos) y confirmación (`s/N`). Cancelar → **nada** se escribe ni se copia. Confirmar → copia logos (a archivo temporal + renombrado, para no dejar copias parciales), escribe `project.config.json`, ejecuta `apply` (D4) y guarda la clave de BD **solo** en `secrets.properties`.
- **Explicación por pregunta** (qué es, ejemplo, qué pasa al cambiarlo) y **avisos del entorno** (hallados probando con el usuario, 2026-09-28): puerto ya en uso (se prueba `connect` a `127.0.0.1` y `listen` en `0.0.0.0`, porque en Windows un puerto publicado por Docker no impide `listen`) → confirmar o repreguntar; credenciales de BD cambiadas con un contenedor ya existente → aviso de que Postgres solo inicializa usuario/clave con el volumen vacío (`down -v` o elegir otro nombre). Comprobaciones inyectables para los tests.
- **Volumen por proyecto**: `compose.yaml` declara `name: ${DB_CONTAINER_NAME:-…}`; sin eso el proyecto de Compose se llamaba `backend` (nombre de la carpeta) y **todas las copias compartían `backend_pgdata`**, heredando credenciales de otro proyecto. Por eso el contenedor se valida en minúsculas (`^[a-z0-9][a-z0-9_-]*$`, regla de nombres de proyecto de Compose). `-p <nombre>` en la línea de comandos sigue teniendo prioridad.
- **UTF-8**: `stdin.setEncoding("utf8")`, `readline` sobre streams inyectables, todas las lecturas/escrituras de archivo con `encoding: "utf8"`; si la consola de Windows no está en UTF-8 el script lo avisa y sugiere `chcp 65001` o editar el JSON + `project:apply`.

### D4. `pnpm project:apply` (`scripts/project/apply.mjs`)
Orden: validar config → árbol (D5) → planificar → (`--dry-run`: imprimir y salir) → escribir → `applied.json` → escáner → resumen.
Reglas (todas **por clave o bloque**, salvo la de texto; todo en UTF-8):
- `application.yml`: `app.name`, `app.description`.
- `contracts/openapi.json`: `info.title` = `"<name> API"`, `info.description` = `description` (parse/stringify con 2 espacios y salto final, como el export actual).
- Cliente generado: líneas de cabecera `* <título>` y `* <descripción>` de `core/services/generated/**` (mismo texto que el contrato).
- `pom.xml`: solo `<description>` (= `"<name> - backend"`). `package.json` raíz: solo `description` (= `"<name> - raíz del monorepo (hooks y calidad de commits)"`). Nunca `groupId`/`artifactId`/`name`.
- `secrets.properties.example`: `DB_URL`, `DB_NAME`, `DB_USERNAME`, `DB_PORT`, `DB_CONTAINER_NAME`, `JWT_ISSUER`.
- `compose.yaml`: defaults de `container_name` y `DB_PORT`.
- **`secrets.properties` local**: si existe, actualización **por clave**: reescribe solo las líneas `CLAVE=` gestionadas (DB_*, `JWT_ISSUER`, y `DB_PASSWORD` solo si el asistente la recibió); conserva orden, comentarios, líneas vacías, claves desconocidas, `DB_PASSWORD` existente y `JWT_SECRET`; si una clave gestionada no existe, se añade al final. Si no existe, se crea desde el `.example` con `JWT_SECRET` = 48 bytes aleatorios (`crypto.randomBytes`). `.env` del frontend: se crea desde su `.example` si falta.
- `globals.css`: reescribe solo los tokens dentro de `/* @template:brand */ … /* @end-template:brand */` en `:root` y `.dark`.
- **Texto** (solo si cambió `name`): `from.name` → `to.name`, **exacto y sensible a mayúsculas**, en los archivos de texto de la matriz. El slug técnico en minúsculas (`odontorisas-frontend`) no coincide y queda intacto.
- **Escáner**: tras aplicar, busca `from.name` (exacto, sensible a mayúsculas) en **todos** los archivos de texto del repo, excluyendo `.git`, `node_modules`, `target`, `dist`, `coverage`, `openspec/changes/archive/`, `pnpm-lock.yaml`, `.template/`, binarios y `V1__init.sql`; cualquier resto → error con `archivo:línea`.

### D5. Árbol limpio con allowlist
`git status --porcelain`: se permiten **solo** cambios en `project.config.json` y `modules/frontend/public/brand/**`. Cualquier otro → error (salvo `--allow-dirty`). Git es el "deshacer" de todo lo que el script escribe.
**Copia sin git** (ZIP de GitHub, sin `.git`): no hay árbol que comprobar ni `git ls-files`; el script recorre el disco con las mismas exclusiones que el `.gitignore` (`.git`, `node_modules`, `target`, `dist`, `coverage`, `secrets.properties`, `.env*` salvo `.example`) y **avisa** en lugar de fallar, recomendando `git init` + commit antes (hallado al probar con el ZIP de `main`).

### D6. Refactor previo (identidad visible fuera del código)
- **Frontend**:
  - `tsconfig.app.json`: `resolveJsonModule: true` + `paths["@project-config"] = ["../../project.config.json"]`. `vitest.config.ts` y `vite.config.ts`: alias `@project-config` → `path.resolve(__dirname, "../../project.config.json")`; Vite con `server.fs.allow` explícito (raíz del repo).
  - **`vite.config.ts` y `vitest.config.ts` no importan la config con `import`**: el plugin de `index.html` la lee con `fs.readFileSync(…, "utf8")`. Por eso `tsconfig.node.json` no necesita el alias (se verifica con `tsc -b`, tarea propia).
  - `src/config/project.ts` exporta `project` tipado. `LoginFeature`/`RegisterFeature` en `modules/auth/components/`; `LoginView`/`RegisterView` de una línea. `AuthLayout` (tagline, descripción, `© {name}`) y `Logo` (rutas + `alt`) leen de `project`. Logos a `public/brand/`. `index.html` con `%PROJECT_NAME%`/`%PROJECT_FAVICON%` y plugin `transformIndexHtml`.
- **Backend**: `infra.config.ProjectProperties` = `@ConfigurationProperties(prefix = "app") record(name, description)` + `@EnableConfigurationProperties`; `OpenApiConfig` lo inyecta (título `name + " API"`). Bean `odontorisasOpenAPI` → `openAPI` (nombre de método interno, no expuesto ni referenciado).
- **Contrato** (orden): cambiar backend → levantar → `curl -o contracts/openapi.json` → `pnpm generate:api` → comprobar con `git diff` que en el cliente **solo** cambian las 2 líneas de cabecera de cada archivo → `pnpm validate`.
- **Comentarios**: quitar el nombre de `application.yml`, `vite.config.ts`, `logo.tsx`, Javadoc de `OdontorisasApplication` y el README de marca. `V1__init.sql` intacto (exclusión del escáner).

### D7. Tests (un test por Scenario, con su nombre literal)
Cada test se llama **exactamente como su Scenario** (`test("Colores en hex o hsl", …)`), aunque varios vivan en el mismo archivo. Runner nativo `node --test` en `scripts/project/*.test.mjs`:
- **Unit**: gramática de colores (casos válidos e inválidos, incluidos alpha, comas, fuera de rango); "Configuración inválida" parametrizado por campo con cero escrituras.
- **Asistente** (streams simulados, entradas con `Mi Proyecto`, `gestión`, `clínica`, `ñ`): "Mantener valores con Enter", "Respuesta inválida", "Colores en hex o hsl", "Logo desde un archivo" (válido, ruta inexistente, extensión no admitida, misma fuente para dos variantes, cambio de extensión), "Clave de base de datos solo en local", "Cancelar en el resumen" (sin archivos en `public/brand/` ni temporales).
- **Apply sobre copia** (temp + `git init`/commit): "Identidad visible, contrato y documentación", "Identificadores técnicos intactos" (hash de: carpeta `src/**/java`, `pom.xml` `groupId`/`artifactId`/`name`, `package.json` `name` ×2, `spring.application.name`, clave de `orval.config.ts`, y apariciones de `odontorisas-frontend` en docs), "Base de datos y seguridad" (incluido un `secrets.properties` con comentarios, clave desconocida, `DB_PASSWORD` y `JWT_SECRET`: todo se conserva salvo las claves gestionadas), "Secretos locales inexistentes", "Colores de marca", "Sin restos del nombre anterior" (incluida la exclusión de `V1__init.sql`), "Árbol de trabajo con cambios sin commitear", "Ensayo sin escritura", "Re-aplicar sin cambios" (hash de todos los archivos idéntico).
- **Vitest**: "La UI muestra la identidad configurada" (pantalla de login **y** de registro completas en router).
- **Node**: "Título de la pestaña desde la configuración" (ejecuta el plugin sobre `index.html`).
- **CI** `.github/workflows/template.yml` (si cambian `scripts/project/**`, `project.config.json` o `.template/**`): `node --test` + ensayo: copia → config "Acme CRM" → `project:apply` → `pnpm install` → `pnpm generate:api` + `git diff --exit-code` del cliente (coherencia contrato↔cliente) → `pnpm validate` + `pnpm build` (`<title>`) → `./mvnw -B verify -DskipITs`.

### D8. Identidad final neutra (decisión del usuario)
Orden para no dejar estado intermedio: (1) logos SVG genéricos, (2) `vision.md`/`domain.md` → esqueleto genérico, (3) README y tooling-setup, (4) **después** `project:apply` con "Mi Proyecto" (tagline/descripción genéricas, BD `app`/`app`/5432/`app-db`, `jwtIssuer` `mi-proyecto`, paleta actual), (5) **verificación final**: `project:apply --dry-run` → "sin cambios", escáner limpio, `applied.json` == `project.config.json`, `generate:api` sin diferencias, `pnpm validate`, `./mvnw -B verify`. Los identificadores técnicos siguen siendo `odontorisas` (el README los documenta como nombres internos).

## Risks / Trade-offs

- [Identificadores técnicos con "odontorisas" en proyectos derivados] → aceptado a cambio de estabilidad; documentado.
- [Nombre visible corto o genérico que coincida con texto no relacionado en docs] → reemplazo exacto y sensible a mayúsculas; el escáner y el `git diff` final lo delatan.
- [El nombre sigue en `V1__init.sql`] → exclusión puntual, documentada y probada.
- [Contrato ↔ cliente desalineados] → mismo texto en ambos; ensayo de CI regenera y exige diff vacío; `codegen-drift` en el CI del frontend.
- [Consola de Windows sin UTF-8] → aviso + alternativa JSON; tests con acentos y ñ.
- [Copias parciales de logos] → copia a temporal + renombrado tras confirmar; test de cancelación.

## Migration Plan

Sin datos ni despliegue. Proyecto derivado: copiar la plantilla → `pnpm install` → `pnpm project:setup` (o editar JSON + `pnpm project:apply`) → revisar `git diff` → reescribir `vision.md`/`domain.md` → commit. Rollback: `git checkout . && git clean -fd modules/frontend/public/brand`.

## Open Questions

_(ninguna)_
