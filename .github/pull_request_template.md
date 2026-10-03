<!--
Plantilla de PR de HS FACOP.
Base recomendada para ramas de feature: `dev`.
Título de la PR en Conventional Commits, p. ej.: feat(auth): agrega login
-->

## Descripción

<!-- Qué hace esta PR y por qué. Enlaza el change de OpenSpec si aplica. -->

## Tipo de cambio

<!-- Marca el que corresponda (coincide con el tipo del título en Conventional Commits). -->

- [ ] `feat` — nueva funcionalidad
- [ ] `fix` — corrección de bug
- [ ] `docs` — documentación
- [ ] `refactor` / `test` / `chore` / `build` / `ci` / `perf`

## Change de OpenSpec relacionado

<!-- p. ej. add-authentication · o "N/A" si es andamiaje/documentación -->
Change: `...`

## ¿Cómo se probó?

<!-- Comandos/escenarios ejecutados y su resultado -->

## Checklist

<!-- Marca cada punto cumplido; los que no apliquen a esta PR déjalos sin marcar. -->

- [ ] `openspec validate <change> --strict` en verde (si toca specs/changes)
- [ ] Backend: `./mvnw -B verify` en verde (si toca `backend/`)
- [ ] Frontend: `pnpm validate` en verde (si toca `frontend/`)
- [ ] Tests derivados de los `#### Scenario:` del spec (ver `docs/testing.md`)
- [ ] Commits en Conventional Commits en español (ver `docs/commits.md`)
- [ ] Docs actualizadas si cambió comportamiento/arquitectura (`docs/`, `domain.md`)
- [ ] Sin secretos ni artefactos (`secrets.properties`, `target/`, `node_modules/`)

## Notas para revisión

<!-- Puntos que requieren atención especial, decisiones abiertas, follow-ups -->
