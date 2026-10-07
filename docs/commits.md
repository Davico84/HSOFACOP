# Estándar de commits — HS FACOP

Formato: **Conventional Commits**, mensajes **en español**.
Combina el formato convencional (tipos + scope) con las buenas prácticas del skill `commit` del demo `lidr-specboot-main` (focalizado, subject + body, PRs con `gh`).

---

## 1. Formato

```
<tipo>(<scope>): <resumen en imperativo, minúscula, sin punto final>

<body opcional: qué cambió y por qué, en bullets>

<footer opcional: BREAKING CHANGE / refs a tickets>
```

- **Subject** ≤ ~72 chars, imperativo ("agrega", "corrige", "actualiza"), sin punto final.
- **Body** cuando el cambio no es trivial: bullets con el qué y el porqué.
- Un commit = un cambio coherente y **focalizado** (no mezclar features).

## 2. Tipos permitidos

| Tipo | Uso |
|---|---|
| `feat` | nueva funcionalidad de cara al usuario |
| `fix` | corrección de bug |
| `docs` | documentación (docs/, openspec/, README, specs) |
| `refactor` | cambio interno sin alterar comportamiento |
| `test` | añadir o ajustar pruebas |
| `chore` | tooling, config, dependencias, andamiaje |
| `build` | build/empaquetado (Maven, Vite) |
| `ci` | pipelines / GitHub Actions |
| `perf` | mejora de rendimiento |
| `style` | formato/whitespace sin cambio de lógica |
| `revert` | revierte un commit previo |

## 3. Scopes sugeridos (monorepo)

`backend`, `frontend`, `openspec`, `docs`, `ci`, `auth`, `<capacidad>` (p. ej. `feat(auth): ...`).

Para cambios que tocan back y front de una misma capacidad, prefiere **commits separados** por scope; si es inseparable, usa el scope de la capacidad (`feat(auth): ...`).

## 4. Ejemplos

```
feat(auth): agrega registro de usuario

- valida correo y contraseña (>= 8 chars)
- crea cuenta e inicia sesión, redirige según rol
- error si el correo ya existe (no duplica ni inicia sesión)
```
```
fix(backend): corrige 401 al refrescar token expirado
```
```
docs(openspec): cierra stack modules/backend/frontend y arquitectura
```
```
chore(frontend): configura vitest + msw y lint-staged
```

### BREAKING CHANGE
```
feat(api): unifica formato de respuesta de errores

BREAKING CHANGE: el body de error pasa de { message } a { error: { message, code } }
```

## 4b. Trazabilidad: enlazar el commit con la tarea (`Refs:`)

Las **tareas codificadas** viven en el `tasks.md` de cada *change* de OpenSpec (IDs `1.1`, `3.2`…) — esa es la fuente única. Para saber desde un commit qué tarea cerró, añade un footer **`Refs:`** con el `change-id` y los IDs de tarea:

```
feat(auth): implementa registro de usuario

- valida correo/contraseña y crea la cuenta

Refs: add-authentication #2.1 #2.3
```

Reglas:
- Formato del footer: `Refs: <change-id> #<task-id> [#<task-id> ...]`.
- Un commit puede cerrar una o varias tareas del **mismo** change. Si toca varios changes, usa una línea `Refs:` por change.
- A nivel capacidad, el `change-id` ya mapea al roadmap (`docs/vision.md`).
- Al cerrar la tarea, marca su checkbox (`- [x]`) en el `tasks.md` del change.
- `Refs:` es informativo (no lo valida commitlint); mantenlo consistente.

## 5. Reglas de trabajo (del skill `commit` del demo)

- **Focalizado**: si se indican features/tickets, se commitean **solo** esos cambios; el resto queda sin stagear.
- **No commitear** secrets, `.env`, artefactos generados ni `target/`, `dist/`, `node_modules/`.
- **PRs con `gh`** (GitHub CLI). Título alineado con el commit; descripción con resumen, testing y follow-ups.
- **Nada destructivo** sin permiso explícito (`git push --force`, `reset --hard`). Ante push rechazado: reportar y sugerir pull/rebase.
- Branches de feature pequeñas y descriptivas: `feat/...`, `fix/...`.

## 5b. Flujo de ramas: una rama por change, PR a `main`

No hay rama de integración (`dev` se retiró): `main` es producción (Render y Vercel despliegan cada merge) y cada trabajo vive en su rama hasta su PR.

| Trabajo | Rama | Ejemplo |
|---|---|---|
| Change de OpenSpec | `change/<change-id>` | `change/add-database-backups` |
| Ajuste sin change (CI, docs, dependencias) | `chore/<tema>` | `chore/ci-flujo-ramas` |
| Arreglo urgente en producción | `fix/<tema>` | `fix/sigill-aot-cache` |

```
git switch -c change/<id> origin/main   # siempre desde main actualizado
/opsx:propose → revisión → /opsx:apply → /opsx:archive   # commits por scope (§5)
git push -u origin change/<id>          # → PR a main (gh pr create --base main)
# CI en el PR → merge → despliegue automático → borrar la rama
```

- **Un PR = un change** (o un ajuste): se revisa, se prueba y se revierte por separado. No mezclar dos changes en una rama.
- **CI**: corre en cada push del PR y una vez en `main` tras el merge (no en el push a una rama sin PR: para eso están los hooks locales).
- **Vista previa**: Vercel publica una *preview* por rama (sin sesión: su origen no está en CORS). Sirve para revisar la interfaz antes de mergear.
- **Sincronizar**: si `main` avanzó, `git fetch && git rebase origin/main` en la rama (o merge, si ya hay revisión en curso); nada destructivo sobre `main`.
- **Tras el merge**: `git switch main && git pull` y borrar la rama local y remota (`git branch -d change/<id>`, `git push origin --delete change/<id>`); GitHub puede borrarla sola al mergear.

## 6. Automatización (pendiente de andamiaje)

- **commitlint** + config Conventional Commits para validar en `commit-msg` (hook) y en CI.
- Front: `lint-staged` en pre-commit (ya previsto en el tooling del template).
- CI: rechazar PRs con mensajes que no cumplan el formato.
