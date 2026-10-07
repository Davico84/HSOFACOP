# HS FACOP — Guía para agentes

Proyecto **greenfield** con desarrollo dirigido por especificaciones (spec-driven) usando **OpenSpec**.
Monorepo modular: `modules/backend/` (Java/Spring) + `modules/frontend/` (React/Vite), con `openspec/` y `docs/` en la raíz.

## Fuentes de verdad
- **Flujo OpenSpec** (setup, comandos, ciclo): `SETUP-OPENSPEC.md`.
- **Qué hace el sistema** (capacidades + cambios): `openspec/` (y `openspec/config.yaml` = contexto para la IA).
- **Cómo construimos** (estándares perennes): `docs/`
  - **Negocio (sustituible):** `docs/vision.md` — objetivos de producto + roadmap + gobernanza del ciclo + granularidad de capacidades · `docs/domain.md` — modelo de dominio (vivo): actores, glosario y ER. Fuente de verdad local-first; Jira solo backlog (futuro).
  - **Tecnología (reutilizable):** `docs/architecture.md` — stack cerrado + arquitectura back/front · `docs/backend.md` — estándares Java/Spring · `docs/frontend.md` — estándares frontend (arquitectura, React Query, Zustand, patrones UI) · `docs/coding-style.md` — estilo general de código (TypeScript, nombres) · `docs/testing.md` — estrategia de pruebas + puente Scenario→test.
  - `docs/tooling-setup.md` — tooling reproducible (scripts, Vitest/MSW, husky/commitlint, CI).
  - `docs/deployment.md` — despliegue en planes gratuitos (Render + Neon): monitor a liveness, pool que deja dormir a la base, cookie de sesión entre frontend y API.
  - `docs/commits.md` — estándar de commits (Conventional Commits en español) + convención `Refs:` para enlazar tareas.

## Reglas OpenSpec (no negociables)
- `specs/` = lo **YA construido**, no un backlog. Cada capacidad nace como *change* y llega a `specs/` al archivar.
- Capacidad = un solo `spec.md`. Formato: `## Requirements` → `### Requirement:` (SHALL) → `#### Scenario:` (WHEN/THEN). Cada requirement ≥ 1 scenario.
- Spec delta del change: `changes/<id>/specs/<cap>/spec.md` con `## ADDED | MODIFIED | REMOVED Requirements`.
- `change-id` en kebab-case liderado por verbo: `add-...`, `update-...`, `remove-...`.
- Tests **derivados de los Scenario** del spec (uno por WHEN/THEN).

## Flujo de trabajo
`/opsx:explore` (pensar) → `/opsx:propose` (change + artefactos) → revisión humana → `/opsx:apply` (implementar) → tests → `/opsx:sync`/`/opsx:archive`.
Ruta rápida por defecto: **propose → apply → archive**. Cada change en su rama `change/<id>` desde `main` y PR a `main` (sin rama `dev`; ver `docs/commits.md` §5b).

### Gobernanza del ciclo (mantiene el contexto de la IA preciso)
`docs/vision.md` es el **puente**: planeada (roadmap) → en progreso (change activo) → construida (`specs/`).
- **Al `/opsx:propose`**: enlaza el change en progreso (`changes/<id>/proposal.md` y `design.md`) en la sección "Estado de capacidades" de `docs/vision.md`.
- **Al `/opsx:archive`** (en el mismo commit/PR): 1) si la capacidad tocó el dominio, actualiza `docs/domain.md` (de ahí extrae el modelo la IA); 2) marca la capacidad como construida y enlaza su `spec.md` en `docs/vision.md`.

## Gates antes de codear / al subir
- `openspec validate <change> --strict` + revisión humana del proposal/delta.
- Backend: `mvn verify`. Frontend: `pnpm validate` (typecheck + lint + test).
- Commits: Conventional Commits en **español** (ver `docs/commits.md`). PRs con `gh`.

## Convenciones rápidas
- No commitear secrets/`.env`, `target/`, `dist/`, `node_modules/`.
- Nada destructivo en git sin permiso explícito.
- Al tocar back y front de una capacidad, separar tareas/commits por scope cuando sea posible.
