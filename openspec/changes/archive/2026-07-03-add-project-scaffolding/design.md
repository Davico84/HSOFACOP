## Context

Repo greenfield con stack cerrado (ADR-0001, `docs/architecture.md`) y sin código. Este change crea el esqueleto de ambos módulos del monorepo modular (`modules/backend/`, `modules/frontend/`) más la validación de commits, sin lógica de negocio. Es un cambio transversal (dos toolchains: Maven + pnpm) y toca CI y hooks de git, por lo que amerita design.

## Goals / Non-Goals

**Goals:**
- Backend Spring Boot que arranca en `dev`, expone health y aplica Flyway sobre PostgreSQL.
- Frontend Vite/React que compila, sirve y pasa `pnpm validate` (typecheck + lint + test con MSW).
- Estructura arquitectónica física creada (capas back / pantallas front) como punto de partida.
- Validación de Conventional Commits vía hook `commit-msg` (commitlint).

**Non-Goals:**
- Capacidades de negocio (auth, usuarios…). Llegan en changes posteriores.
- Configuración real de S3, correo y Spring AI (solo dejar el punto de extensión).
- Portado completo de las docs del template FixRiver.

## Decisions

- **Monorepo modular con dos toolchains** (Maven en `modules/backend/`, pnpm en `modules/frontend/`).
  - *Por qué*: alineado con ADR-0001 y el demo lidr-specboot. CI usa jobs separados con skip por existencia de módulo (ya en `ci.yml`).
  - *Alternativa descartada*: repos separados → pierde coordinación de specs/PRs.
- **Maven Wrapper (`mvnw`) versionado** en `modules/backend/`.
  - *Por qué*: CI y devs usan la misma versión de Maven sin instalación global. `ci.yml` ya invoca `./mvnw`.
- **Flyway como única fuente del esquema** (`ddl-auto=none`), migración inicial `V1__init.sql` mínima (p. ej. tabla de verificación o extensión), para probar el pipeline de migración desde el día 1.
  - *Alternativa descartada*: `ddl-auto=update` → deriva de esquema no versionada.
- **Health endpoint**: Spring Boot Actuator (`/actuator/health`) en lugar de un controller propio.
  - *Por qué*: estándar, sin escribir código de presentación de negocio.
- **Configuración única, todo externalizado como secretos** (decisión 2026-07-02): **sin** perfiles `dev/qa/pro`. Un solo `application.yml` con placeholders `${VAR}` para todos los valores configurables (datasource, credenciales, JWT, etc.). Los valores se inyectan por variables de entorno; en local se cargan de un `secrets.properties` (ignorado por git) vía `spring.config.import=optional:file:./secrets.properties`, con `secrets.properties.example` versionado. Ningún valor sensible en el repo.
- **Frontend portado del template FixRiver** (no copiado 1:1): se toman `package.json`, configs de Vite/Vitest/ESLint/Tailwind, `src/test/*` (setup, MSW, utils) y la estructura de carpetas; se deja una `home` mínima. `.git` propio del repo (no monorepo del template) ⇒ **husky estándar** en vez del `core.hooksPath` del template.
- **commitlint compartido en la raíz**: hook `commit-msg` a nivel repo (aplica a back y front). Config `@commitlint/config-conventional`. El pre-commit `lint-staged` del front se mantiene acotado a `modules/frontend/`.
  - *Decisión*: husky en la raíz gestiona `commit-msg` (global) y `pre-commit` (delegando a lint-staged del front).

## Risks / Trade-offs

- **Dos toolchains en un repo** → CI y DX más complejos. *Mitigación*: jobs separados con skip; wrappers versionados.
- **Node/pnpm en la raíz solo para hooks** (husky/commitlint) podría confundirse con el proyecto front. *Mitigación*: `package.json` raíz mínimo, solo devDeps de hooks; el front vive aislado en `modules/frontend/`.
- **Flyway requiere PostgreSQL** para el arranque real. *Mitigación*: los tests usan **Testcontainers** (PostgreSQL real efímero) desde el inicio, garantizando paridad con producción; el escenario "migración en base limpia" se ejerce contra el contenedor.
- **Versiones muy nuevas** (Java 25, Spring Boot 4.0.6, Vite 8, TS 6). *Mitigación*: fijar versiones exactas; CI las verifica.

## Migration Plan

No aplica migración de datos. Orden de implementación: backend base → frontend base → hooks/commitlint → activar y verificar CI. Rollback = revertir el change (aún nada en producción).

## Open Questions

_Resueltas (2026-07-02):_
- **PostgreSQL local**: se incluye un `compose.yaml` mínimo para dev en este change (trabajo solo local por ahora).
- **Persistencia en tests**: se usa **Testcontainers** (PostgreSQL) desde el inicio, no H2.
