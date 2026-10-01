# Arquitectura y Stack — Mi Proyecto

Decisión de stack **cerrada el 2026-07-02**. Este documento es la fuente de verdad del *cómo* construimos.
El *qué* (capacidades + cambios) vive en `openspec/`. El flujo de trabajo, en `SETUP-OPENSPEC.md`.

Referencias base:
- Estructura de repo: **monorepo modular** (`modules/`), con `docs/` y `openspec/` en la raíz — alineada con el template FixRiver (`modules/frontend`); del demo `lidr-specboot-main` se tomó la idea de docs/specs en la raíz.
- Backend: especificación del equipo (Java 25 / Spring Boot).
- Frontend: template FixRiver `modules/frontend/proyecto-base` (versiones reales tomadas de su `package.json`).

---

## 1. Estructura del repositorio (monorepo modular)

```
Mi Proyecto/
├─ openspec/              # specs + changes (qué hace el sistema)
│  └─ config.yaml         # schema spec-driven + contexto/reglas para la IA
├─ docs/                  # estándares perennes (este archivo, backend, frontend, testing, adr/)
├─ modules/backend/               # Java 25 · Maven · Spring Boot (app principal)
├─ modules/frontend/              # React 19 · Vite · TypeScript (SPA)
├─ .github/workflows/     # CI
├─ CLAUDE.md              # guía para agentes → apunta a docs/ y openspec/
└─ SETUP-OPENSPEC.md      # setup y flujo OpenSpec
```

---

## 2. Backend — Java 25 · Spring Boot 4.0.6

| Área | Tecnología |
|---|---|
| Lenguaje / build | Java 25 · Maven |
| Framework | Spring Boot 4.0.6 |
| API REST | Spring Web MVC + springdoc-openapi (Swagger, por perfil) |
| Realtime | Spring WebSocket (STOMP) — encaja con `@stomp/stompjs` + `sockjs` del front |
| Persistencia | Spring Data JPA (Hibernate) + PostgreSQL |
| Migraciones | Flyway (`db/migration`) · `ddl-auto=none` (schema lo maneja Flyway) |
| Seguridad | Spring Security + JWT (`com.auth0:java-jwt`) |
| Validación | Bean Validation (`starter-validation`) |
| Caché | Spring Cache + Caffeine |
| Almacenamiento | AWS S3 (subida de imágenes) |
| IA | Spring AI (chat memory JDBC) — para el bot |
| Utilidades | Lombok · mail vía webhook |
| Configuración | Única (sin perfiles); todos los valores externalizados como secretos (env vars + `secrets.properties` local ignorado) |
| Testing | Test slices: H2, JPA-test, security-test, webmvc-test, websocket-test, flyway-test |

### Arquitectura por capas (paquetes reales)
```
presentation   → controller · dto
      ↓
service        → <dominio> (+ mapper co-ubicado)      # lógica de negocio / casos de uso
      ↓
persistence    → entity · repository · specification (queries dinámicas)

infra          → config · security · storage · mail   # adaptadores técnicos (transversal)
common         → utilidades / tipos compartidos
```
- La **lógica de negocio** vive en `service.<dominio>`, **no** en `infra`. `infra` es solo adaptadores técnicos (framework, seguridad, S3, mail).
- `presentation` no accede a `persistence` directamente: pasa por `service`.
- `persistence` no depende de `presentation` ni de `service` (las entidades JPA son el modelo de dominio; no hexagonal puro, decisión consciente).
- `specification` centraliza las queries dinámicas (JPA Criteria/Specifications).
- Migraciones versionadas en `db/migration`; el schema NO lo gestiona Hibernate (`ddl-auto=none`).

---

## 3. Frontend — React 19 · Vite · TypeScript

Base: template FixRiver `modules/frontend/proyecto-base`.

| Área | Tecnología |
|---|---|
| Core | React 19 · TypeScript · Vite |
| UI | Tailwind CSS 4 (CSS-first, `@tailwindcss/vite`) + shadcn/Radix + `@base-ui/react` · `lucide-react` · `framer-motion` · `sonner` · `recharts` |
| Datos servidor | `@tanstack/react-query` + `axios` |
| Estado cliente | Zustand |
| Formularios | `react-hook-form` + `zod` (`@hookform/resolvers`) |
| Routing | `react-router-dom` v7 + `RouteGuard` central (roles ADMIN/USER/ALL) |
| Realtime | `@stomp/stompjs` + `sockjs-client` |
| Testing | Vitest + React Testing Library + MSW · e2e con Playwright |
| Calidad | ESLint + typescript-eslint · pre-commit con `lint-staged` |
| Gestor | pnpm |

### Arquitectura orientada a pantallas (Screens)
```
src/
├─ layouts/     # UserLayout, AdminLayout (Sidebar + Header + <Outlet/>)
├─ screens/     # vistas por dominio (admin/, auth/, home) — orquestan, no conectan servicios
├─ modules/     # lógica de negocio encapsulada y portable
│  ├─ core/     # components, ui (shadcn), services, utils, enum — sin deps a otros módulos
│  ├─ auth/     # servicios/lógica de autenticación
│  └─ [dominio]/
├─ store/       # stores Zustand (estado cliente)
├─ routes/      # definición de rutas + constantes PATHS
└─ styles/      # estilos globales / temas
```
- **Screens** orquestan e instancian componentes de módulos; no llaman a axios ni renderizan tablas directas.
- **Modules** encapsulan lógica reutilizable; `core/` no depende de otros módulos.
- **RouteGuard** centraliza auth + roles: sesión activa en ruta pública → redirige por rol; sin token → login (con `?next=`); rol no permitido → 403 AccessDenied.

Detalle ampliado de los estándares de frontend en `docs/frontend.md` (arquitectura pantallas/módulos, React Query, Zustand, patrones de UI) y `docs/coding-style.md` (estilo general de código). Adaptados del template FixRiver.

---

## 4. Contrato back ↔ front

- **Auth**: JWT emitido por Spring Security; el front lo guarda y lo envía vía `axios` (interceptor). Refresh de token ante 401.
- **Roles**: ADMIN / USER (alineados con `$UserRole` del front y la seguridad por rol del back).
- **Realtime**: STOMP sobre WebSocket (back Spring WebSocket ↔ front `@stomp/stompjs` + `sockjs-client`).
- **API docs**: springdoc-openapi (Swagger) por perfil como contrato de referencia.

---

## 5. Calidad y CI

- **Gate de spec** (antes de codear): `openspec validate <change> --strict` + revisión humana.
- **Backend**: `mvn verify` (compila + test slices).
- **Frontend**: `pnpm validate` (typecheck + lint + test); e2e Playwright cuando aplique.
- **CI por PR**: `openspec validate --strict` + validate de backend + frontend.
- **Commits**: Conventional Commits. **Pre-commit** (front): `lint-staged`.
- **Seguridad y observabilidad (planeado, aún NO adoptado)**: escaneo de vulnerabilidades de dependencias (empezar por **GitHub Dependabot** + `pnpm audit` / OWASP Dependency-Check en CI; **Snyk** si se requiere SAST, licencias o escaneo de contenedores, con cuenta/`SNYK_TOKEN`) y monitoreo de errores en runtime con **Sentry** (SDK front React + back Spring Boot, correlacionable con el `traceId` de RFC 9457). Se introducen con el setup de deploy/entornos. Ver `docs/vision.md §7`.

---

## 6. Andamiaje (change `add-project-scaffolding`)

- [x] `modules/backend/`: proyecto Maven + Spring Boot (capas, config única+secrets, Flyway).
- [x] `modules/frontend/`: Vite + React (estructura screens/modules, tooling Vitest/MSW/ESLint).
- [x] `docs/`: testing, coding-standards, react-query, zustand, ui-patterns, tooling-setup, backend-standards, capabilities, roadmap, data-model.
- [x] `docs/adr/0001` — decisión de stack y estructura.
- [x] `.github/workflows/ci.yml` (openspec + backend + frontend).
- [x] `CLAUDE.md` raíz + commitlint/husky + pre-commit lint-staged.
