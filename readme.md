# Mi Proyecto

**Plantilla base single-tenant** (una sola empresa): registro e inicio de sesión con JWT, panel privado con sidebar/header responsive, dashboard de ejemplo y un **asistente para configurar la identidad de cada proyecto nuevo** (nombre, BD, logos y colores). Ver [Crear un proyecto desde la plantilla](#crear-un-proyecto-desde-la-plantilla).

Proyecto **greenfield** desarrollado con **especificaciones dirigidas (spec-driven) usando [OpenSpec](https://github.com/Fission-AI/OpenSpec)**. Monorepo modular: **backend** Java/Spring + **frontend** React/Vite.

---

## Filosofía: spec-driven

Todo el desarrollo gira en torno a **capacidades** (capabilities), y cada capacidad se **especifica antes de construirse**. Dos preguntas, dos fuentes de verdad:

| Pregunta | Vive en |
|---|---|
| **¿Qué hace el sistema?** (capacidades + cambios) | `openspec/` |
| **¿Cómo lo construimos?** (estándares perennes) | `docs/` |

> Las **capacidades = specs**. No se escribe código de una capacidad sin su spec.

---

## Estructura del proyecto

```
Mi Proyecto/
├─ openspec/                  # 🧭 QUÉ hace el sistema (OpenSpec)
│  ├─ specs/                  #   capacidades YA CONSTRUIDAS (1 carpeta = 1 capacidad)
│  │  └─ project-foundation/spec.md
│  ├─ changes/                #   capacidades EN PROGRESO (propuestas de cambio)
│  │  ├─ add-authentication/  #     proposal.md · design.md · tasks.md · specs/ (delta)
│  │  └─ archive/             #     changes ya archivados (histórico)
│  └─ config.yaml             #   contexto del proyecto para la IA
│
├─ docs/                      # 📚 CÓMO construimos (estándares perennes)
│  ├─ vision.md               #   ⭐ catálogo/roadmap de capacidades + gobernanza del ciclo
│  ├─ domain.md               #   modelo de dominio: actores, glosario, entidades, ER
│  ├─ architecture.md         #   stack cerrado + arquitectura back/front
│  ├─ backend.md              #   estándares Java/Spring (capas, DTOs, JPA, seguridad)
│  ├─ frontend.md             #   estándares frontend (React Query, Zustand, UI, capa API)
│  ├─ coding-style.md         #   estilo general (TypeScript, nombres) + paridad de validación
│  ├─ testing.md              #   estrategia de pruebas + puente Scenario→test
│  ├─ tooling-setup.md        #   tooling reproducible (scripts, MSW, husky, CI)
│  ├─ commits.md              #   Conventional Commits en español + convención Refs:
│  └─ adr/                    #   Architecture Decision Records
│
├─ modules/                   # 🧩 el código de la aplicación
│  ├─ backend/                #   Java 25 · Maven · Spring Boot 4 (capas:
│  │                          #     presentation · service · persistence · infra · common)
│  └─ frontend/               #   React 19 · Vite · TypeScript (src/:
│                             #     modules/{core,auth,dashboard} · screens · routes · store · config · styles)
│                             #   public/brand/: logos (rutas en project.config.json)
│
├─ project.config.json        # 🎨 identidad visible + datos de BD (pnpm project:setup)
├─ scripts/project/           #   asistente project:setup / project:apply (+ tests)
│
├─ contracts/
│  └─ openapi.json            # 📜 contrato OpenAPI versionado (fuente del codegen del front)
│
├─ .github/workflows/         # CI por área (backend · frontend · openspec)
├─ SETUP-OPENSPEC.md          # flujo y comandos de OpenSpec (setup, ciclo)
├─ CLAUDE.md                  # guía para agentes de IA (reglas del proyecto)
└─ readme.md                  # este documento
```

---

## OpenSpec: dónde se definen las capacidades

Este es el corazón del proyecto. Una **capacidad** es un área cohesiva de comportamiento con su propio `spec.md`.

- **`openspec/specs/<capacidad>/spec.md`** → lo **YA construido**. Formato:
  `## Requirements` → `### Requirement:` (con **SHALL**) → `#### Scenario:` (**WHEN/THEN**). Cada requirement tiene ≥ 1 scenario, y **los tests se derivan de esos scenarios**.
- **`openspec/changes/<id>/`** → capacidades **en progreso**: `proposal.md` (por qué), `design.md` (cómo), `tasks.md` (pasos) y `specs/<cap>/spec.md` (el **delta**: `## ADDED | MODIFIED | REMOVED Requirements`). Al terminar, el delta se fusiona en `openspec/specs/` y el change pasa a `changes/archive/`.

**El ciclo** (detalle en [`SETUP-OPENSPEC.md`](SETUP-OPENSPEC.md)):

```
/opsx:explore → /opsx:propose → revisión humana → /opsx:apply → tests → /opsx:archive
```

[`docs/vision.md`](docs/vision.md) es el **puente** entre las tres fases: `planeada` (roadmap) → `en progreso` (change activo) → `construida` (`specs/`).

### Estado de las capacidades

| Capacidad | Tipo | Estado | Dónde |
|---|---|---|---|
| `project-foundation` | técnica | ✅ construida | [`openspec/specs/project-foundation/`](openspec/specs/project-foundation/spec.md) |
| `authentication` | negocio | ✅ construida | [`openspec/specs/authentication/`](openspec/specs/authentication/spec.md) |
| `api-type-contracts` | técnica | ✅ construida | [`openspec/specs/api-type-contracts/`](openspec/specs/api-type-contracts/spec.md) |
| `app-shell` | técnica | ✅ construida | [`openspec/specs/app-shell/`](openspec/specs/app-shell/spec.md) |
| `template-bootstrap` | técnica | ✅ construida | [`openspec/specs/template-bootstrap/`](openspec/specs/template-bootstrap/spec.md) |
| capacidades de negocio de tu producto | negocio | ⏳ planeadas | roadmap en [`docs/vision.md`](docs/vision.md) |

> El catálogo completo, el orden sugerido y la convención de granularidad están en [`docs/vision.md`](docs/vision.md).

---

## Stack

- **Backend**: Java 25 · Maven · **Spring Boot 4** · Spring Web MVC + springdoc-openapi · Spring Data JPA + **PostgreSQL** · **Flyway** (`ddl-auto=none`) · Spring Security + JWT.
- **Frontend**: **React 19** · Vite · TypeScript · Tailwind + shadcn · TanStack Query + axios · Zustand · react-hook-form + zod · react-router v7. Cliente API **generado con orval** desde `contracts/openapi.json`.

Detalle y versiones en [`docs/architecture.md`](docs/architecture.md).

---

## Crear un proyecto desde la plantilla

1. Copia la plantilla (clon o "Use this template") e instala: `pnpm install`.
2. Configura la identidad con el asistente:
   ```bash
   pnpm project:setup
   ```
   Pregunta cada dato mostrando el valor actual (**Enter = mantener**): nombre, tagline y descripción; base de datos (nombre, usuario, **clave**, puerto, contenedor) y JWT issuer; logos (ruta de un archivo png/svg/webp: se copia a `modules/frontend/public/brand/`); colores de marca (`#rrggbb` o `hsl(H S% L%)`). Muestra un resumen y solo aplica si confirmas.
   - ¿Prefieres editar a mano? Cambia [`project.config.json`](project.config.json) (el editor autocompleta con su JSON Schema) y ejecuta `pnpm project:apply` (`--dry-run` para ver qué cambiaría).
3. Revisa `git diff`, reescribe `docs/vision.md` y `docs/domain.md` con tu producto y commitea.

**Qué cambia**: textos y logos del login/sidebar, título y favicon de la pestaña, título y descripción de OpenAPI (contrato + cliente generado), colores de marca, valores por defecto de BD/JWT (`secrets.properties.example`, `compose.yaml`) y el nombre en README/docs/`CLAUDE.md`/OpenSpec. Crea tu `secrets.properties` y `.env` locales si no existen (con `JWT_SECRET` aleatorio). Si tu `secrets.properties` ya existe, **manda sobre la config**: el asistente te propone sus valores de BD (Enter = no cambiar) y te muestra qué claves locales cambiarán; `project:apply` no pisa los valores que personalizaste (te avisa "se mantiene tu valor local…").

**Qué NO cambia (a propósito)**: los identificadores técnicos internos — paquete Java `com.odontorisas`, clase `OdontorisasApplication`, `groupId`/`artifactId` del `pom.xml`, `name` de los `package.json` (`odontorisas-frontend`) y `spring.application.name`. No se ven en la app y renombrarlos arriesga la estabilidad; si lo necesitas, hazlo a mano en un change propio.

> La clave de la BD y el `JWT_SECRET` **nunca** van a `project.config.json` (se versiona): solo a tu `secrets.properties`, ignorado por git.

**Base de datos (Postgres en Docker)**: el usuario y la contraseña que indiques los crea Docker **solo la primera vez** que levanta un contenedor nuevo. Cada proyecto tiene su propio contenedor y volumen (el nombre del contenedor, en minúsculas, nombra también el volumen `<nombre>_pgdata`). Si cambias la **contraseña** y el contenedor está en marcha, el asistente la cambia también dentro de Postgres (`ALTER USER`); si cambias el **nombre de la BD o el usuario** de un proyecto que ya tiene datos, recréalo con `docker compose --env-file secrets.properties down -v` (**borra sus datos**) o usa otro nombre de contenedor. Si ya tienes Postgres instalado en tu PC (puerto 5432), el asistente no te deja usar ese puerto: elige otro libre (ej. 5436).

---

## Cómo arrancar

**Prerequisitos**: JDK 25 · Node 22 · pnpm · Docker (Postgres local). (Tooling reproducible en [`docs/tooling-setup.md`](docs/tooling-setup.md).)

### Backend
```bash
pnpm project:setup                                  # crea secrets.properties si no existe (o cópialo del .example)
cd modules/backend
docker compose --env-file secrets.properties up -d  # Postgres local
./mvnw spring-boot:run                              # arranca en http://localhost:8080
```
Contrato OpenAPI en `http://localhost:8080/v3/api-docs` (y Swagger UI en `/swagger-ui.html`).

### Frontend
```bash
pnpm install                                        # instala todo el workspace
pnpm --filter odontorisas-frontend dev              # arranca en http://localhost:5173
```

### Pruebas y calidad
```bash
cd modules/backend && ./mvnw verify                 # backend (test slices + ArchUnit)
pnpm --filter odontorisas-frontend validate         # frontend (typecheck + lint + test)
```

### Regenerar el cliente API (tras cambiar el contrato)
```bash
curl http://localhost:8080/v3/api-docs > contracts/openapi.json
pnpm --filter odontorisas-frontend generate:api
```

---

## Documentación

| Documento | Para qué |
|---|---|
| [`docs/vision.md`](docs/vision.md) | Objetivos de producto, **roadmap de capacidades**, gobernanza y granularidad |
| [`docs/domain.md`](docs/domain.md) | Modelo de dominio: actores, glosario, entidades y diagrama ER |
| [`docs/architecture.md`](docs/architecture.md) | Stack cerrado + arquitectura de backend y frontend |
| [`docs/backend.md`](docs/backend.md) | Estándares Java/Spring (capas, DTOs/validación, JPA, seguridad, errores RFC 9457) |
| [`docs/frontend.md`](docs/frontend.md) | Estándares frontend (arquitectura, capa API generada, React Query, Zustand, UI) |
| [`docs/coding-style.md`](docs/coding-style.md) | Estilo general (TypeScript, nombres) + paridad de validación Zod↔Bean Validation |
| [`docs/testing.md`](docs/testing.md) | Estrategia de pruebas y puente Scenario→test |
| [`docs/tooling-setup.md`](docs/tooling-setup.md) | Tooling reproducible (Vitest/MSW, husky/commitlint, CI) |
| [`docs/commits.md`](docs/commits.md) | Estándar de commits |
| [`SETUP-OPENSPEC.md`](SETUP-OPENSPEC.md) | Flujo y comandos de OpenSpec |
| [`CLAUDE.md`](CLAUDE.md) | Guía para agentes de IA (reglas del proyecto) |

---

## Convenciones

- **Commits**: [Conventional Commits](https://www.conventionalcommits.org/) en **español** (hook `commit-msg` los valida). Ver [`docs/commits.md`](docs/commits.md).
- **Gates antes de subir**: `openspec validate <change> --strict` + revisión humana · `./mvnw verify` (backend) · `pnpm --filter odontorisas-frontend validate` (frontend).
- **No commitear** secretos (`secrets.properties`, `.env`), `target/`, `dist/`, `node_modules/`.
