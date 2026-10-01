## Why

El repo está en greenfield: el stack y la estructura ya están decididos (`docs/architecture.md`, ADR-0001) pero no existe código. Antes de especificar capacidades de negocio (empezando por `authentication`) necesitamos un esqueleto que compile, valide y levante en ambos módulos, para que cada capacidad futura tenga una base estable donde nacer.

## What Changes

- Crear el proyecto **modules/backend/** base: Java 25 · Maven · Spring Boot 4.0.6, con la estructura de capas `presentation/infra/persistence`, perfiles `dev/qa/pro`, Flyway y configuración base (sin dominios de negocio).
- Crear el proyecto **modules/frontend/** base: React 19 · Vite · TypeScript, con la arquitectura orientada a pantallas (`layouts/screens/modules/store/routes/styles`) y el tooling portado del template FixRiver (Vitest + MSW + ESLint + lint-staged).
- Añadir **validación de commits**: commitlint (Conventional Commits) + hook `commit-msg`.
- Activar los jobs de CI de `backend` y `frontend` (ya presentes en `.github/workflows/ci.yml`, hoy en skip) al existir los módulos.

## Capabilities

### New Capabilities
- `project-foundation`: el esqueleto ejecutable y validable del monorepo — backend que levanta y aplica migraciones, frontend que compila/sirve y pasa `validate`, estructura arquitectónica establecida y validación de mensajes de commit.

### Modified Capabilities
<!-- Ninguna: no hay capacidades previas en specs/. -->

## Impact

- **Nuevo código**: `modules/backend/` (Maven, Spring Boot, Flyway) y `modules/frontend/` (Vite, React, tooling).
- **Nuevas dependencias**: toolchain Java 25 + Maven; Node/pnpm + paquetes del template.
- **Config**: perfiles Spring `dev/qa/pro`, `.env.example`, hooks git (`commit-msg`, pre-commit lint-staged).
- **CI**: se activan los jobs `backend` (`mvn verify`) y `frontend` (`pnpm validate`).

## Non-goals

- No implementar capacidades de negocio (auth, usuarios, etc.): eso llega en changes posteriores.
- No definir entidades/dominios ni endpoints funcionales más allá de un health/estructura mínima.
- No configurar despliegue/infra (S3, correo, Spring AI) más allá de dejar el punto de extensión; su configuración real se aborda cuando una capacidad lo requiera.
- No portar el contenido completo de las docs del template (se hace en tarea aparte de documentación).
