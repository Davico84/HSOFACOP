# OpenSpec en Mi Proyecto — Setup y flujo

Repo: `D:\proyectos\drivenSpec\Mi Proyecto\Odontorisas`
Paquete: **`@fission-ai/openspec`** · integra nativo con Claude Code.
CLI de referencia en esta guía: **v1.5.0** (verifica con `openspec --version`).

> **Convención de terminal.** El entorno de este repo es **Windows + PowerShell**.
> Los bloques marcados como `powershell` son los que debes usar en tu día a día.
> Los bloques `bash` son equivalentes (Git Bash / WSL / CI Linux) por si los necesitas.

---

## 0. Requisitos previos (verifícalos antes de empezar)

```powershell
node -v      # >= 18 (este repo se validó con v20.19.0)
pnpm -v      # >= 8  (validado con 10.33.4)
git --version
```

- Si no tienes `pnpm`: `npm install -g pnpm` y reinicia la terminal.
- Trabajaremos con **pnpm** como gestor por defecto en todo el repo.

---

## 1. Instalar el CLI

**Con pnpm (global):**
```powershell
pnpm add -g @fission-ai/openspec@latest
```
> Si `openspec` no se reconoce tras instalar: corre `pnpm setup` una vez, **reinicia la terminal** y reintenta.
> En PowerShell, comprueba que la carpeta global de pnpm está en el `PATH`: `pnpm bin -g`.

**Sin instalar nada global (equivalente a npx):**
```powershell
pnpm dlx @fission-ai/openspec@latest init
```

**Alternativa con npm:**
```powershell
npm install -g @fission-ai/openspec@latest
```

**Verificación:**
```powershell
openspec --version    # debe imprimir 1.5.0 (o superior)
openspec --help       # lista de comandos disponibles
```

---

## 2. Inicializar en el repo

```powershell
cd D:\proyectos\drivenSpec\Mi Proyecto\Odontorisas
openspec init
```

- Genera la carpeta `openspec/` con `config.yaml` (schema `spec-driven`) e integra la IA elegida.
- Cuando pregunte por el asistente de IA → elegir **Claude Code**.
- Modo no interactivo (útil en scripts/CI y en esta terminal): `openspec init --tools claude`.

**Verificación tras el init:**
```powershell
openspec list            # changes (vacío al inicio)
openspec list --specs    # specs (vacío al inicio — specs = lo construido)
openspec doctor          # salud de relaciones del árbol openspec/
```

**Estructura real generada por v1.5.0** (verificada en este repo):
```
openspec/
└─ config.yaml            # schema: spec-driven + context/rules del proyecto (opcional)

.claude/
├─ commands/opsx/         # slash commands: propose, apply, archive, explore, sync
│   ├─ propose.md  apply.md  archive.md  explore.md  sync.md
└─ skills/                # skills equivalentes: openspec-{propose,apply,archive,explore,sync-specs}
```

Notas sobre la estructura real:
- **No** se crea `project.md`: el contexto del proyecto vive en `openspec/config.yaml` (clave `context:`) y las reglas por artefacto en `rules:` (ambas comentadas como ejemplo al inicio).
- Las carpetas `specs/` y `changes/` (con `changes/archive/`) **no existen aún**; se crean con el **primer change** (`/opsx:propose`) y al archivar.
- Tras el init, **reinicia el IDE** para que aparezcan los slash commands `/opsx:*`.

---

## 3. Flujo de trabajo (desde Claude Code en ese repo)

Ruta rápida por defecto: **propose → apply → archive**.

1. `/opsx:propose <lo que quieres construir>` → crea el change y genera todos los artefactos en un paso (proposal.md + design.md + tasks.md + spec delta).
2. **Revisar** el proposal/delta (humano) → `/opsx:apply` (implementar).
3. Escribir pruebas **derivadas de los Scenario** del spec (cómo: `docs/testing.md`).
4. `/opsx:archive` → fusiona el delta en `specs/` y mueve el change a `changes/archive/`.

Los 5 slash commands que instala el init (Claude Code):

| Comando | Para qué |
|---|---|
| `/opsx:explore` | **Modo pensar**: investigar, aclarar requisitos, comparar opciones. No implementa código. |
| `/opsx:propose` | Crea el change y genera proposal + design + tasks (+ spec delta) en un paso. |
| `/opsx:apply` | Implementa el change siguiendo `tasks.md`. |
| `/opsx:sync` | Fusiona los delta specs del change en los main specs (merge inteligente, agent-driven). |
| `/opsx:archive` | Cierra el change: aplica el delta a `specs/` y mueve el change a `changes/archive/`. |

> `/opsx:*` son **slash commands de Claude Code** que instala `openspec init` cuando eliges Claude Code (también quedan como *skills* en `.claude/skills/`).
> Su equivalente por CLI (para inspección/CI, no para redactar) es `openspec change`, `openspec validate`, `openspec archive`, etc.

### Reglas clave
- `specs/` refleja lo **YA construido**, no un backlog. En greenfield, cada capacidad nace como change.
- Formato spec: `## Requirements` → `### Requirement:` (SHALL) → `#### Scenario:` (WHEN/THEN/AND). **Cada requirement ≥ 1 scenario.**
- El delta usa `## ADDED Requirements` (o `## MODIFIED` / `## REMOVED` Requirements).
- `change-id` en **kebab-case liderado por verbo**: `add-...`, `update-...`, `remove-...`.
- `design.md` es **opcional**: solo cuando hay una decisión técnica real que justificar.

### Comandos CLI útiles durante el ciclo
```powershell
openspec list                       # changes activos
openspec show <change-id>           # ver un change (proposal + delta + tasks)
openspec status <change-id>         # estado de completitud de artefactos
openspec validate <change-id> --strict   # valida un change concreto
openspec validate --strict          # valida TODO (specs + changes)
openspec view                       # dashboard interactivo
openspec archive <change-id>        # archivar (equivalente CLI de /opsx:archive)
```

---

## 3b. Recorrido completo de un change (ejemplo end-to-end)

Ejemplo con la capacidad `authentication` (ver prompt en §4):

```
1. En Claude Code:  /opsx:propose <prompt de §4>
      → crea  changes/add-authentication/
                 ├─ proposal.md
                 ├─ tasks.md
                 ├─ design.md        (opcional)
                 └─ specs/authentication/spec.md   ← el DELTA (## ADDED Requirements)

2. Revisión humana + validación:
      openspec validate add-authentication --strict
      → lee el proposal y el delta; ¿los scenarios cubren éxito + errores + bordes?

3. Implementación:  /opsx:apply add-authentication
      → escribe el código de la app siguiendo tasks.md

4. Pruebas derivadas de los Scenario (una prueba por WHEN/THEN):
      pnpm test

5. Archivar:  /opsx:archive add-authentication
      → fusiona el delta en  specs/authentication/spec.md
      → mueve el change a    changes/archive/add-authentication/
```

Tras archivar, `openspec list --specs` ya mostrará la capacidad `authentication` como **construida**.

---

## 4. Prompt para arrancar authentication

Pega esto en Claude Code (repo Mi Proyecto) tras el `init`:

```
/opsx:propose Autenticación de usuarios: registro, login, persistencia de sesión,
refresh de token y protección de rutas por rol.

La capacidad "authentication" debe cubrir estos requirements (cada uno con sus
scenarios WHEN/THEN):

1. Registro de usuario
   - éxito (correo válido + contraseña >= 8 chars) → crea cuenta, inicia sesión y redirige por rol
   - correo ya registrado → error, no duplica ni inicia sesión
   - contraseña < 8 chars → error de validación, no envía al backend
2. Inicio de sesión con credenciales
   - credenciales válidas → establece sesión y redirige por rol
   - credenciales inválidas → "Correo electrónico o contraseña incorrectos", sin sesión
   - campos vacíos → errores de validación, sin petición
3. Persistencia de sesión
   - recarga con token de acceso vigente → restaura sesión sin pedir credenciales
   - token ausente/expirado → sesión no autenticada, limpia datos residuales
4. Renovación de token
   - 401 por token expirado → pide nuevo token vía refresh y reintenta la petición
   - refresh inválido/expirado → cierra sesión y redirige a login
5. Cierre de sesión
   - logout manual → invalida sesión, elimina token y datos del usuario, va a login
6. Protección de rutas por auth y rol
   - sin sesión en ruta privada → redirige a login
   - con sesión en /auth (login/registro) → redirige al panel
   - rol sin permiso → estado de acceso denegado con opción de volver

Antes de escribir código de la app, muéstrame el proposal + el spec delta para revisarlo.
```

---

## 5. Decisiones de diseño acordadas (correcciones a la estructura propuesta)

| Propuesta inicial | Corrección acordada |
|---|---|
| `archive/` al nivel raíz de openspec/ | va dentro de `changes/archive/` |
| Capacidad dividida en `spec.md` + `api.md` + `examples.md` + `test-cases.md` | **solo `spec.md`** (los scenarios YA son ejemplos + casos de prueba). El tooling valida `spec.md`. |
| `specs/` pre-llenado con 6 capacidades (auth, users, profile, assignments, lessons, dashboard) | **`specs/` vacío al inicio**; cada capacidad nace como change y llega a `specs/` al archivar (specs = lo construido, no backlog) |
| Sin contexto de proyecto | v1.5.0 **no** crea `project.md`; el contexto va en `openspec/config.yaml` (clave `context:`), que debe **referenciar `docs/`** en vez de duplicar |
| Change = solo proposal + design + tasks | **+ el spec delta** (`changes/<id>/specs/<cap>/spec.md` con `## ADDED/MODIFIED/REMOVED Requirements`) — es el corazón de OpenSpec |
| Tests "siguiendo testing.md" | tests **derivados de los Scenario** del spec; testing.md define el *cómo* (niveles, MSW) |

Notas:
- `design.md` es **opcional**: solo cuando hay una decisión técnica real que justificar.
- `change-id` en kebab-case liderado por verbo: `add-...`, `update-...`, `remove-...`.

---

## 6. Gates de calidad (recomendado)

- **Antes de codear:** `openspec validate <change> --strict` + **revisión humana** del proposal/delta.
- **CI en cada PR:** `openspec validate --strict` + `pnpm validate` (typecheck + lint + test).
- **DX:** ESLint + pre-commit (lint-staged) + Conventional Commits.

### Script `validate` sugerido en `package.json`
```jsonc
{
  "scripts": {
    "validate": "pnpm typecheck && pnpm lint && pnpm test",
    "typecheck": "tsc --noEmit",
    "lint": "eslint .",
    "test": "vitest run",
    "spec:validate": "openspec validate --strict"
  }
}
```

### CI mínima (GitHub Actions) — `.github/workflows/ci.yml`
```yaml
name: CI
on:
  pull_request:
  push:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm dlx @fission-ai/openspec@latest validate --all --strict   # en CI (no interactivo) usar --all
      - run: pnpm validate
```

### Conventional Commits + pre-commit
- Mensajes: `feat:`, `fix:`, `docs:`, `refactor:`, `test:`, `chore:` …
- Pre-commit con `lint-staged` para lint/format solo de lo staged (p. ej. via `husky` o `simple-git-hooks`).

---

## 7. docs/ (perenne, complementa a openspec/)

`docs/` = *cómo* construimos (guía estable). `openspec/` = *qué* hace el sistema + cambios.

Pendiente crear en Mi Proyecto:
- `docs/testing.md` — estrategia de pruebas (niveles, matriz, MSW, Playwright).
- `docs/architecture.md`, `docs/coding-style.md`, `docs/react.md`, `docs/api.md`.
- `docs/adr/` — Architecture Decision Records para decisiones no obvias.
- `CLAUDE.md` (raíz) apuntando a `docs/` y a `openspec/config.yaml`.

### Plantilla mínima `CLAUDE.md` (raíz)
```markdown
# Mi Proyecto — Guía para agentes

- Flujo de especificación: ver `SETUP-OPENSPEC.md` y `openspec/config.yaml`.
- Cómo construimos (perenne): ver `docs/` (testing, architecture, coding-style, react, api).
- Reglas OpenSpec: specs = lo construido; cada capacidad nace como change; tests derivados de Scenarios.
- Antes de codear una capacidad: `openspec validate <change> --strict` + revisión humana.
```

### Qué debe contener `openspec/config.yaml`
El init lo crea con `schema: spec-driven` y ejemplos comentados. Descomenta y rellena:
```yaml
schema: spec-driven

context: |
  Stack: (por enlace a docs/architecture.md, docs/react.md, docs/api.md — no duplicar)
  Convenciones: Conventional Commits; tests derivados de los Scenario del spec.
  Comandos base: pnpm validate · openspec validate --strict.
  Definición de "listo": spec archivado + tests verdes + CI en verde.

# rules:            # reglas por artefacto (opcional)
#   proposal:
#     - Incluir siempre una sección "Non-goals"
```

---

## 8. Troubleshooting

| Síntoma | Causa probable | Solución |
|---|---|---|
| `openspec: command not found` | bin global no está en PATH | `pnpm setup`, reiniciar terminal; revisar `pnpm bin -g` |
| `/opsx:*` no aparece en Claude Code | no elegiste **Claude Code** en el init | re-ejecuta `openspec init --tools claude` |
| `validate --strict` falla | requirement sin scenario o formato del delta incorrecto | cada `### Requirement:` necesita ≥1 `#### Scenario:`; el delta usa `## ADDED/MODIFIED/REMOVED Requirements` |
| Estructura distinta a §2 | versión del CLI o plantilla distinta | compara con lo generado y ajusta esta guía; corre `openspec doctor` |
| Change "aplicado" pero no en `specs/` | falta el archive | `/opsx:archive <change-id>` o `openspec archive <change-id>` |

---

## Notas
- Si `openspec init` genera una estructura distinta a lo aquí descrito, comparar y ajustar (esta guía documenta el objetivo, no una salida literal del CLI).
- El `spec.md` de referencia con los scenarios ya redactados puede regenerarse en la sesión de este repo.
- Fuentes de verdad de comandos: `openspec --help` y `openspec <cmd> --help`.
