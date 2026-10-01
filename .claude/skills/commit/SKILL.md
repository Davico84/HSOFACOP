---
name: commit
description: Crea commits y PRs focalizados siguiendo el estándar de Mi Proyecto (docs/commits.md). Úsalo al commitear o abrir un PR. Argumentos opcionales — features/tareas a incluir, o modo solo-mensaje ("dry run").
author: Mi Proyecto (adaptado de LIDR.co)
version: 2.0.0
---

# commit — compañero operativo del estándar

**La fuente de verdad es `docs/commits.md`. No la dupliques aquí.** Este skill solo ejecuta el
flujo respetando ese estándar. Antes de commitear, **lee `docs/commits.md`** (formato, tipos,
scopes, `Refs:`).

## Argumentos ($ARGUMENTS)

- **Vacío**: staged + commit de los cambios relevantes del árbol; luego push y PR.
- **Features/tareas** (p. ej. `add-staff 2.1 2.3`, una etiqueta): stagear y commitear **solo** eso;
  el resto queda **sin stagear**. Si un archivo mezcla, usa `git add -p` para stagear solo los hunks.
- **Modo solo-mensaje / dry-run** ("solo el mensaje", "no toques git", "dry run"): produce el **plan
  de staging + el mensaje** y **para**. No ejecutes `git add/commit/push` ni `gh`.

## Reglas NO negociables de este proyecto (además de docs/commits.md)

1. **Español** y **Conventional Commits**: `<tipo>(<scope>): <resumen imperativo, minúscula, sin punto>`.
2. 🚨 **Subject en minúscula** — commitlint (`subject-case`) **rechaza** mayúscula inicial / PascalCase /
   MAYÚSCULAS. `fix: ArchUnit…` **falla** → `fix: archunit…`. Reformula (baja la inicial o mueve el
   nombre propio). Igual con `Flyway`, `ADR`, nombres de clase al arranque.
3. **Commits SEPARADOS por scope** (docs/commits.md §3): back, front, contrato+cliente generado,
   docs → **cada uno su commit**. NO un commit gigante. El contrato regenerado va **aparte** del
   código escrito a mano.
4. **Footer `Refs:`** cuando el commit cierra tareas de OpenSpec (docs/commits.md §4b):
   `Refs: <change-id> #<task-id> …`. Y marca el checkbox (`- [x]`) en el `tasks.md` del change.
5. 🚫 **Sin `Co-Authored-By`** de Claude (preferencia del proyecto).
6. **No commitear** secrets, `.env`, `target/`, `dist/`, `node_modules/`, ni artefactos generados
   (salvo `contracts/openapi.json` y el cliente orval, que **sí** se versionan, en su commit aparte).
7. **Nada destructivo** (`push --force`, `reset --hard`) sin permiso explícito. Ante push rechazado:
   reporta y sugiere pull/rebase, no fuerces.

## Antes de push/PR — checklist rápido

- ¿El **lockfile** entra si cambiaste `package.json`? (la CI usa `--frozen-lockfile`; olvidarlo la rompe).
- ¿`pnpm validate` / `mvn verify` en verde para lo que tocaste?
- PR con **`gh`**: título alineado con el commit; cuerpo con resumen, qué mirar en CI y follow-ups.

## Flujo

1. `git status` + `git diff` → entender el estado y la rama.
2. Resolver el **scope** (todo, o solo las features de $ARGUMENTS; `git add -p` si el archivo mezcla).
3. Redactar el/los mensaje(s) **por scope** según docs/commits.md (+ `Refs:` si aplica).
4. Commit(s) → push (`-u` si la rama no está en el remoto).
5. PR con `gh` (o actualizar el existente).
6. Resumen al user: qué entró, qué quedó fuera, URL del PR.
