# ADR-0001: Stack tecnológico y estructura del repositorio

- **Estado:** Aceptado
- **Fecha:** 2026-07-02
- **Decisores:** David Velarde Alvarado

## Contexto

HS FACOP arranca greenfield con desarrollo dirigido por especificaciones (OpenSpec ya inicializado).
Se necesita fijar la estructura del repo y el stack de backend y frontend antes de escribir código, para que las capacidades (empezando por `authentication`) se especifiquen e implementen con un objetivo técnico estable.

Referencias consultadas:
- Demo `lidr-specboot-main` — referencia de organización (`docs/` + specs en la raíz). Su stack (Node/Express) NO se adopta.
- Template FixRiver (`modules/frontend`) — referencia del layout **modular** (`modules/`).
- Template FixRiver `modules/frontend/proyecto-base` — como **base del frontend** (versiones reales de su `package.json`).
- Especificación de backend provista por el equipo (Java 25 / Spring Boot).

## Decisión

### Estructura — monorepo modular
```
HS FACOP/  →  openspec/ · docs/ · modules/backend/ · modules/frontend/ · .github/workflows/
```

### Backend
Java 25 · Maven · Spring Boot 4.0.6 · Spring Web MVC + springdoc-openapi · Spring WebSocket (STOMP) ·
Spring Data JPA (Hibernate) + PostgreSQL · Flyway (`ddl-auto=none`) · Spring Security + JWT (`com.auth0:java-jwt`) ·
Bean Validation · Spring Cache + Caffeine · AWS S3 · Spring AI (chat memory JDBC) · Lombok.
Configuración única sin perfiles; todos los valores externalizados como secretos (actualizado 2026-07-02, ver `add-project-scaffolding`). Test slices + Testcontainers.
Arquitectura por capas: `presentation (controller·dto) → infra (config·security·service·utils/mappers) → persistence (entity·repository·specification)`.

### Frontend
React 19 · TypeScript · Vite · Tailwind CSS 4 + shadcn/Radix + `@base-ui/react` · `@tanstack/react-query` + `axios` ·
Zustand · `react-hook-form` + `zod` · `react-router-dom` v7 + RouteGuard · `@stomp/stompjs` + `sockjs-client` ·
Vitest + RTL + MSW · Playwright (e2e) · ESLint · pnpm.
> **Actualización 2026-09-28:** Tailwind 3 → **4** (config CSS-first, `@tailwindcss/vite`), para alinear con el registro actual de shadcn. Ver change `update-tailwind-v4`.

Arquitectura orientada a pantallas: `src/{layouts,screens,modules(core/auth/…),store,routes,styles}`.

### Convenciones
- Commits: Conventional Commits en español (`docs/commits.md`).
- Gates: `openspec validate --strict` + `mvn verify` (back) + `pnpm validate` (front).

Detalle completo y tablas: `docs/architecture.md`.

## Consecuencias

**Positivas**
- Front y back en un solo repo → specs, PRs y CI coordinados; contrato back↔front (JWT, roles, STOMP) explícito.
- Reutilización directa del tooling y patrones del template FixRiver.
- Estructura por capas/pantallas conocida y testeable por slices.

**Negativas / trade-offs**
- Un solo repo mezcla dos toolchains (Maven + pnpm); CI debe manejar ambos (resuelto con jobs separados y skip por existencia de módulo).
- Acoplamiento de versionado entre back y front (una historia de git compartida).

**Seguimiento**
- Andamiar `modules/backend/` y `modules/frontend/`; portar docs del template; añadir commitlint + hook `commit-msg`.
