## Context

`authentication` es la primera capacidad de negocio y el primer API REST real de OdontoRisas. Sobre ella se apoya todo el roadmap. El stack ya está cerrado (`docs/architecture.md`): Spring Boot 4 + Spring Security + `com.auth0:java-jwt` en backend; React 19 + react-query + axios + Zustand + `RouteGuard` en frontend. Este change, además de la autenticación, materializa dos decisiones técnicas acordadas que necesitan un endpoint real: los **contratos API tipados** (`api-type-contracts`) y la **redefinición de capas** del backend (MODIFICA `project-foundation`).

## Goals / Non-Goals

**Goals:**
- Autenticación stateless por JWT (access + refresh) que soporte registro, login, sesión persistente, refresco transparente, logout y guardas por rol.
- Pipeline OpenAPI → TS: el backend exporta su contrato y el frontend genera tipos + hooks (orval), probado con los endpoints de auth.
- Reubicar la lógica de negocio en `service.<dominio>` con `infra` solo para adaptadores técnicos, y fijarlo con ArchUnit.

**Non-Goals:**
- Gestión de usuarios/roles (capacidad `users`), recuperación de contraseña, OAuth social, MFA, rate limiting (ver `proposal.md`).
- Generar Zod desde OpenAPI automáticamente (paridad manual por ahora, `docs/coding-style.md §7`).

## Decisions

### D1. JWT: access corto en memoria + refresh en cookie httpOnly (rotado y revocable)
- **Access token** JWT HS256 (secreto externalizado), TTL corto (~15 min), enviado en `Authorization: Bearer`. Se guarda **solo en memoria** (store Zustand no persistido) — inmune a robo por XSS desde `localStorage`.
- **Refresh token** en **cookie `HttpOnly` + `Secure` + `SameSite=Lax`**, TTL largo (~7 días). Al recargar la app, el access en memoria se pierde y se restaura llamando al endpoint de refresco (la cookie viaja sola) → satisface "persistencia de sesión".
- **Refresh persistido y rotado en tabla DB** (`refresh_tokens`, Flyway + JPA): cada refresco emite uno nuevo e invalida el anterior; el logout borra el registro. Esto permite que "cerrar sesión **invalida** la sesión" sea real (no solo esperar a que expire) y sobrevive a reinicios. **[DECIDIDO]**
- **Alternativa considerada**: ambos tokens en `localStorage` (más simple, menos CORS/CSRF), **rechazada** por exposición a XSS de datos clínicos. **Alternativa**: refresh JWT stateless o en Caffeine — rechazadas (sin invalidación real / no persiste reinicios).
- **Trade-off/CSRF**: usar cookie exige `withCredentials` + CORS con credenciales y protección CSRF en el endpoint de refresco (mitigado por `SameSite=Lax` + método POST). Ver R1.

### D2. Contrato OpenAPI (springdoc v3.0.3) + snapshot versionado en Git
- `springdoc-openapi-starter-webmvc-*` **v3.0.3** (compatible con Spring Boot 4.x) expone `/v3/api-docs`.
- **Export a archivo**: preferido `springdoc-openapi-maven-plugin` en fase `integration-test` (arranca la app y vuelca el documento). **Fallback** si el plugin no es compatible con Boot 4: `spring-boot:start` + `curl /v3/api-docs` (o un test de integración que escriba el archivo). Ver R2.
- **Contrato versionado y desacoplado [DECIDIDO]**: el documento exportado se **commitea como snapshot en Git** en `contracts/openapi.json` (ubicación neutral, no bajo `target/` que está ignorado). Es la **fuente única** para el codegen del frontend, de modo que el job de front **no depende** del build del backend.
- **Detección de drift**: el snapshot se regenera desde el backend; CI falla si el `contracts/openapi.json` regenerado difiere del versionado (contrato desactualizado).

### D3. Codegen frontend con orval (tipos + hooks react-query + mutator axios), artefactos versionados
- `orval.config.ts`: input `../../contracts/openapi.json` (el snapshot versionado, **no** `target/`); output en `src/modules/core/services`; `client: react-query`.
- **Mutator axios personalizado**: orval usa una instancia axios propia donde se inyecta el `Authorization` y vive el **interceptor de refresco** (401 → refresh → reintento). Así los hooks generados heredan el comportamiento de sesión sin código a mano.
- **Artefactos generados versionados [DECIDIDO]**: los archivos TS generados por orval se **commitean** en `src/modules/core/services`. CI ejecuta `generate:api` y falla si hay diferencias (los generados están desincronizados del contrato). Así el pipeline de front es autónomo (typecheck/lint/test sin backend).
- Script `generate:api`.

### D4. Redefinición de capas (primero, sobre paquetes vacíos)
- Se ejecuta **antes** de escribir auth: mover a `service.<dominio>` (con `mapper` co-ubicado), dejar `infra` para `config`/`security`/`storage`/`mail`, `utils` → `common`. `persistence` se mantiene (entidades JPA = modelo de dominio; **no** hexagonal puro).
- **ArchUnit** (`LayeredArchitectureTest`): `persistence` no→`presentation` ni→`service`; `presentation` no→`persistence`; `service` no→`presentation`. **No** se añade "infra no depende de service" (SecurityConfig cablea servicios = composition root legítimo). Actualizar `docs/architecture.md §2`.

### D5. Modelo de datos y seguridad
- Entidad `User`: `id`, `email` (único), `password_hash`, `role` (`ADMIN`|`USER`), timestamps. Contraseñas con **BCrypt** (`PasswordEncoder`). Migración Flyway `V2__users.sql` (+ `V3__refresh_tokens.sql` para el refresh).
- **Registro mínimo [REVISADO 2026-07-03]**: para no sobrecargar el alta, el registro captura solo **nombre completo, correo y contraseña** (más **confirmación de contraseña**, validada solo en el cliente — no viaja al backend). `User` conserva `full_name`. **`username`, `phone` y `country` se difieren** a la futura gestión de perfil (capacidad `users`): la migración `V4__user_profile.sql` los introdujo y `V5__slim_register.sql` los **elimina** (se re-añadirán con `users`). Login sigue **solo por email**. Paridad Zod↔Bean Validation (`docs/coding-style.md §7`): `full_name` requerido (2–120), `password` ≥ 8; la confirmación es regla de cliente (`confirmPassword === password`). `UserResponse` expone `fullName` para el saludo en el panel.
- Rol por defecto en registro: `USER`. Redirección por rol en frontend vía `RouteGuard` (mapa rol → ruta de inicio).
- Mensaje de login inválido genérico ("Correo electrónico o contraseña incorrectos") para no filtrar existencia de cuentas. Nota de alcance: se **captura** perfil básico al alta, pero la **gestión/edición de perfil** sigue fuera (capacidad `users`).

## Risks / Trade-offs

- **R1. CSRF/CORS por cookie de refresh** → `SameSite=Lax` + endpoint refresh por POST + CORS con origen explícito y credenciales; documentar en `infra.security`.
- **R2. `springdoc-openapi-maven-plugin` podría no soportar Boot 4** → fallback `spring-boot:start` + `curl` en el build (D2); decidir en `apply` tras probar el plugin.
- **R3. Acoplamiento front↔back por el contrato** → **resuelto** versionando el snapshot `contracts/openapi.json` y los TS generados (D2/D3): el job de front es autónomo. El riesgo se traslada a *drift* del contrato → mitigado por el check de CI que regenera y compara.
- **R4. Access en memoria = parpadeo al recargar** (breve estado "cargando" mientras se refresca) → mostrar splash/guard de carga hasta resolver el refresh inicial.
- **R5. Reestructura de paquetes toca la spec archivada `project-foundation`** → mitigado: cambio sobre paquetes casi vacíos + ArchUnit + delta MODIFIED en este mismo change.

## Migration Plan

1. Refactor de capas (paquetes vacíos) + ArchUnit + `architecture.md` → `mvn verify` verde.
2. springdoc + export `openapi.json` (con fallback) → contrato disponible.
3. Backend auth: `User`, Flyway, `service.auth`, `infra.security` (JWT + filtro + SecurityConfig), controllers/DTOs.
4. Frontend: orval (mutator + interceptor), `modules/auth`, rutas + `RouteGuard`, store de sesión.
5. Tests derivados de los Scenario (back y front) + `pnpm validate` + `mvn verify`.
6. Al archivar: actualizar `docs/domain.md` (User/roles) y `docs/vision.md` (gobernanza en `CLAUDE.md`).

## Decisiones resueltas (revisión humana, 2026-07-03)

- **Sesión (D1)**: confirmado **access en memoria + refresh en cookie `HttpOnly`**. La restauración al recargar es vía refresh (el Scenario "persistencia de sesión" se lee como *sesión restaurable con refresh vigente*, no como access almacenado en cliente).
- **Refresh token**: **tabla en BD** (Flyway + JPA), con rotación y revocación en logout.
- **Contrato/CI (D2/D3)**: **snapshot `contracts/openapi.json` versionado en Git** + **archivos TS generados versionados**; jobs de front y back **desacoplados**; CI verifica drift (regenera y compara).
