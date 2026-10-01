> Solo superficial: NO se renombran paquete Java, clases, `pom.xml` (`groupId`/`artifactId`/`name`) ni `package.json` (`name`). Commits separados por scope. Orden: config → backend → contrato → frontend → apply → asistente → tests → neutralización → verificación final. Cada test se nombra literalmente como su Scenario.

## 1. Configuración (D1, D2)

- [x] 1.1 `project.config.json` en la raíz con la identidad actual (descripción de producto única) y `scripts/project/project.config.schema.json`
- [x] 1.2 `.template/applied.json` con la misma config

## 2. Backend (D6)

- [x] 2.1 `infra.config.ProjectProperties` (`@ConfigurationProperties(prefix = "app")`) + `@EnableConfigurationProperties`; `application.yml` con `app.name`/`app.description`
- [x] 2.2 `OpenApiConfig` usa `ProjectProperties` (título `name + " API"`); bean → `openAPI`; Javadoc y comentarios sin nombre; `./mvnw -B verify` verde

## 3. Contrato OpenAPI (D6)

- [x] 3.1 Levantar backend, `curl -o contracts/openapi.json`, `pnpm generate:api`; `git diff` del cliente limitado a las 2 líneas de cabecera por archivo; `pnpm validate`

## 4. Frontend (D6)

- [x] 4.1 `resolveJsonModule` + `paths["@project-config"]` en `tsconfig.app.json`; alias en `vite.config.ts`/`vitest.config.ts`; `server.fs.allow`; `src/config/project.ts` tipado
- [x] 4.2 Plugin `transformIndexHtml` que lee la config con `fs` (sin `import`); `index.html` con `%PROJECT_NAME%`/`%PROJECT_FAVICON%`
- [x] 4.3 Verificar por separado `tsc -b` (app y node), `vite build` y Vitest
- [x] 4.4 Logos a `public/brand/` (README de marca incluido, sin nombre); `Logo` con rutas de `project.brand.logo` y `alt = project.name`
- [x] 4.5 `LoginFeature`/`RegisterFeature` (subtítulos con `project.name`); `LoginView`/`RegisterView` de una línea; `AuthLayout` lee tagline, descripción y `© {name}`
- [x] 4.6 `globals.css`: marcadores `@template:brand` en `:root` y `.dark`
- [x] 4.7 Quitar el nombre de los comentarios restantes (`application.yml`, `vite.config.ts`, `logo.tsx`); `V1__init.sql` intacto

## 5. `project:apply` (D4, D5)

- [x] 5.1 `lib/config.mjs` (carga + validación por campo) y `lib/color.mjs` (gramática cerrada: hex tal cual en minúsculas, `hsl` normalizado)
- [x] 5.2 `lib/git.mjs` (allowlist `project.config.json` + `public/brand/**`, `--allow-dirty`) y `lib/files.mjs` (exclusiones, binarios, UTF-8)
- [x] 5.3 Reglas por clave: `application.yml`, `contracts/openapi.json`, cabeceras del cliente, `pom.xml` `<description>`, `package.json` raíz `description`, `secrets.properties.example`, `compose.yaml`, `globals.css`
- [x] 5.4 `lib/properties.mjs`: actualización por clave de `secrets.properties` (conserva orden, comentarios, claves desconocidas, `DB_PASSWORD`, `JWT_SECRET`); creación de `secrets.properties`/`.env` si faltan (`JWT_SECRET` aleatorio)
- [x] 5.5 Regla de texto (nombre exacto, sensible a mayúsculas) sobre los archivos de la matriz del design
- [x] 5.6 Orquestación: validar → árbol → plan → `--dry-run` | escribir → `applied.json` → escáner (excluye `V1__init.sql`) → resumen con próximos pasos

## 6. `project:setup` — asistente (D3)

- [x] 6.1 Preguntas con valor actual por defecto, validación y repregunta; streams inyectables; UTF-8 explícito y aviso de consola no UTF-8
- [x] 6.2 Plan de logos (misma fuente en varias variantes, colisiones, cambio de extensión) sin escribir hasta confirmar
- [x] 6.3 Resumen antes → después + confirmación; al confirmar: copia logos (temporal + renombrado), escribe config, ejecuta `apply`, clave de BD solo en `secrets.properties`
- [x] 6.4 Scripts raíz `project:setup`, `project:apply`, `test:template` en `package.json`

## 7. Tests (un test por Scenario de `template-bootstrap`, D7)

- [x] 7.1 Unit: gramática de colores (válidos/inválidos: alpha, comas, rango); "Configuración inválida" parametrizado por campo con cero escrituras
- [x] 7.2 Asistente con entradas UTF-8 (`gestión`, `clínica`, `ñ`): "Mantener valores con Enter", "Respuesta inválida", "Colores en hex o hsl", "Logo desde un archivo", "Clave de base de datos solo en local", "Cancelar en el resumen"
- [x] 7.3 Apply sobre copia: "Identidad visible, contrato y documentación", "Identificadores técnicos intactos", "Base de datos y seguridad" (secrets con comentarios/claves extra), "Secretos locales inexistentes", "Colores de marca", "Sin restos del nombre anterior"
- [x] 7.4 Apply sobre copia: "Árbol de trabajo con cambios sin commitear", "Ensayo sin escritura", "Re-aplicar sin cambios"
- [x] 7.5 Vitest: "La UI muestra la identidad configurada" (login y registro); Node: "Título de la pestaña desde la configuración"
- [x] 7.6 CI `.github/workflows/template.yml`: `node --test` + ensayo "Acme CRM" (apply → `pnpm install` → `generate:api` + `git diff --exit-code` → `pnpm validate` + `pnpm build` → `mvnw verify -DskipITs`)

## 8. Identidad neutra de la plantilla (D8, en este orden)

- [x] 8.1 Logos SVG genéricos en `public/brand/`; retirar los PNG de OdontoRisas
- [x] 8.2 `vision.md` (§1 y roadmap de negocio) y `domain.md` → esqueleto genérico
- [x] 8.3 `readme.md` ("Crear un proyecto desde la plantilla": setup, apply, qué cambia y qué no) y `docs/tooling-setup.md`
- [x] 8.4 `project:apply` con la identidad neutra ("Mi Proyecto", BD `app`)

## 9. Verificación final (sobre el estado neutro)

- [x] 9.1 `pnpm project:apply --dry-run` → "sin cambios"; escáner limpio; `.template/applied.json` == `project.config.json`
- [x] 9.2 `pnpm generate:api` sin diferencias; `pnpm validate`, `./mvnw -B verify`, `pnpm test:template` en verde
- [x] 9.3 `openspec validate add-template-bootstrap --strict`
- [x] 9.4 Soporte de copias sin git (ZIP): recorrido del disco con exclusiones + aviso; test "Copia sin git"
- [x] 9.7 Docker consciente del proyecto: puerto ocupado por otro programa → rechazo (acepta el publicado por el propio contenedor; se pregunta el contenedor antes que el puerto); aviso de datos existentes por volumen `<contenedor>_pgdata`; cambio de contraseña sincronizado con `ALTER USER` si el contenedor está en marcha; 5 tests nuevos
- [x] 9.6 `secrets.properties` local como fuente de los valores de BD: el asistente los propone por defecto y muestra su diff en el resumen; `project:apply` conserva (e informa) los valores personalizados; tests "Valores locales como predeterminados" y "Base de datos y seguridad"
- [x] 9.5 Asistente más claro: explicación por pregunta; avisos de puerto ocupado y de contenedor existente; `name:` en `compose.yaml` (volumen propio por proyecto) y contenedor en minúsculas; tests "Aviso de puerto ocupado" y "Aviso de contenedor existente"
