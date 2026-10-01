## Why

Todo el roadmap de negocio asume **identidad + rol** (ver `docs/vision.md`): sin autenticación no hay pacientes, citas ni tratamientos protegidos. `authentication` es, además, el **primer API REST real** del sistema, por lo que es el punto natural para materializar dos decisiones técnicas ya acordadas que necesitan un endpoint real para probarse: **contratos API tipados de extremo a extremo** y la **corrección de la ubicación de la lógica de negocio** en las capas del backend.

## What Changes

- **Nueva capacidad `authentication`**: registro, inicio de sesión, persistencia de sesión, renovación de token, cierre de sesión y protección de rutas por auth y rol (`ADMIN`/`USER`). Backend con Spring Security + JWT (`com.auth0:java-jwt`); frontend con `react-hook-form` + `zod`, `RouteGuard` central e interceptor de `axios` para el refresh.
- **Nueva capacidad `api-type-contracts`**: el backend expone y **exporta su especificación OpenAPI** en build-time; el frontend **genera tipos + hooks** (orval) a partir de ese contrato. Primer consumidor real: los endpoints de auth (register/login/refresh). Ver política de paridad `Zod ↔ Bean Validation` en `docs/coding-style.md §7`.
- **Redefinición de capas backend** (**BREAKING** a nivel de estructura de paquetes; sin impacto runtime porque aún no hay servicios): la lógica de negocio pasa de `infra.service.<dominio>` a **`service.<dominio>`**; `infra` queda para adaptadores técnicos (`config`, `security`, `storage`, `mail`); `utils` → `common`/`shared`; `persistence` se mantiene (entidades JPA = modelo de dominio, decisión consciente, no hexagonal puro). Actualiza `docs/architecture.md §2` y el test ArchUnit.
- **Nuevas dependencias**: backend `springdoc-openapi` v3.0.3 (compatible con Spring Boot 4.x) + export del `openapi.json` en build; frontend `orval` (devDep).

## Capabilities

### New Capabilities
- `authentication`: identidad y control de acceso — registro, login, sesión persistente, refresh de token, logout y guardas de ruta por autenticación y rol.
- `api-type-contracts`: contrato tipado extremo a extremo — el backend publica/exporta su OpenAPI y el frontend deriva de él sus tipos y hooks de acceso a la API.

### Modified Capabilities
- `project-foundation`: **MODIFICA** el Scenario "Capas del backend" del requirement "Estructura arquitectónica establecida" — la lógica de negocio vive en `service.<dominio>`, no bajo `infra`; `infra` pasa a ser exclusivamente adaptadores técnicos.

## Non-goals

- **Gestión de usuarios/staff** (alta/baja, edición de roles, listados) → capacidad `users` (roadmap #2).
- **Recuperación de contraseña**, verificación por correo y **OAuth/social login** → futuras.
- **Gestión/edición de perfil** (actualizar datos personales tras el alta) → capacidad `users`. *(El registro sí **captura** datos básicos: nombre completo, nombre de usuario, teléfono y país.)*
- **Rate limiting / bloqueo por intentos fallidos** y **MFA** → endurecimiento futuro.
- Generar los schemas **Zod desde OpenAPI** (auto): se mantiene la paridad manual por ahora (ver `docs/coding-style.md §7`); la automatización se evaluará después.

## Impact

- **Backend** (`modules/backend`):
  - Nuevo `service.auth` (registro/login/refresh, emisión y validación de JWT), `presentation` (controller + DTOs `*Request`/`*Response` con Bean Validation), `persistence` (entidad `User` + repositorio), `infra.security` (SecurityConfig real, filtro JWT), migración Flyway `V2` (tabla de usuarios).
  - Reestructura de paquetes (`service` fuera de `infra`), actualización de `LayeredArchitectureTest` y `docs/architecture.md §2`.
  - Deps: `springdoc-openapi` v3.0.3; export de `openapi.json` a `target/` (plugin de springdoc; fallback `bootRun` + `curl`).
- **Frontend** (`modules/frontend`):
  - Nuevo `modules/auth` (pantallas login/registro, store de sesión con Zustand, hooks), rutas con `RouteGuard`, `core/services` con el cliente/tipos generados; interceptor axios para refresh de token.
  - Dep `orval` + `orval.config.ts` + script `generate:api`.
- **CI**: paso de generación/verificación de tipos desde el OpenAPI (a detallar en `design.md`/`tasks.md`); `mvn verify` y `pnpm validate` siguen siendo los gates.
- **Docs vivos**: al archivar, actualizar `docs/domain.md` (entidad `User`/roles) y `docs/vision.md` (marcar `authentication` construida) — ver gobernanza en `CLAUDE.md`.
