## 1. Backend — redefinición de capas (project-foundation MODIFIED)

- [x] 1.1 Crear paquete `service` (nivel raíz) y mover ahí la lógica de negocio; `service.<dominio>` con `mapper` co-ubicado
- [x] 1.2 Dejar `infra` solo con adaptadores técnicos (`config`, `security`, `storage`, `mail`); renombrar `infra.utils` → `common`/`shared`
- [x] 1.3 Actualizar `LayeredArchitectureTest`: `persistence` no→`presentation` ni→`service`; `presentation` no→`persistence`; `service` no→`presentation` (sin regla "infra no→service")
- [x] 1.4 Actualizar `docs/architecture.md §2` (diagrama de capas) para reflejar `service` fuera de `infra`
- [x] 1.5 `./mvnw -B verify` en verde tras el refactor (paquetes aún casi vacíos)

## 2. Backend — contrato OpenAPI (api-type-contracts)

- [x] 2.1 Añadir dependencia `springdoc-openapi-starter-webmvc-*` v3.0.3 (compatible Spring Boot 4.x)
- [x] 2.2 Verificar que `/v3/api-docs` responde `200 OK` con documento OpenAPI válido (Scenario "Exposición en runtime")
- [x] 2.3 Configurar export del contrato en build: `springdoc-openapi-maven-plugin` (fallback `spring-boot:start` + `curl` si no soporta Boot 4) y **commitear el snapshot en `contracts/openapi.json`** (versionado, fuera de `target/`) (Scenario "Snapshot del contrato versionado")
- [x] 2.4 Confirmar que las restricciones de Bean Validation de los DTOs aparecen en `contracts/openapi.json` (Scenario "Restricciones de validación reflejadas en el contrato")

## 3. Backend — modelo y persistencia (authentication)

- [x] 3.1 Entidad `User` (`id`, `email` único, `password_hash`, `role` ADMIN/USER, timestamps) en `persistence.entity` + repositorio
- [x] 3.2 Migración Flyway `V2__users.sql` (tabla `users` con índice único en `email`)
- [x] 3.3 Persistencia de refresh tokens en **tabla DB** para rotación/revocación: entidad JPA + `V3__refresh_tokens.sql` + repositorio

## 4. Backend — seguridad y servicios (authentication)

- [x] 4.1 `PasswordEncoder` BCrypt; utilidades JWT (emisión/validación access HS256 + refresh) en `infra.security`
- [x] 4.2 `SecurityConfig` real: filtro JWT, rutas públicas (`/auth/**`, `/actuator/health`, `/v3/api-docs`), CORS con credenciales, CSRF acorde a cookie de refresh (`SameSite=Lax`)
- [x] 4.3 `service.auth`: registro (rol `USER` por defecto, rechazo de correo duplicado), login (mensaje genérico en fallo), refresh (rotación + reintento), logout (invalidar refresh)
- [x] 4.4 Emisión del refresh como cookie `HttpOnly`+`Secure`+`SameSite=Lax`; access en el cuerpo de respuesta

## 5. Backend — API (authentication)

- [x] 5.1 DTOs `*Request`/`*Response` (`record`) con Bean Validation (`@Email`, `@NotBlank`, `@Size(min=8)` en password) — paridad con Zod (`docs/coding-style.md §7`)
- [x] 5.2 `AuthController` en `presentation`: `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout`
- [x] 5.3 Manejo de errores: 409 correo duplicado, 401 credenciales/refresh inválidos, 400 validación (respuesta consistente)

## 6. Backend — tests (derivados de los Scenario)

- [x] 6.1 Test de registro: éxito (crea + inicia sesión), correo duplicado (409, no duplica), (webmvc/security slice o IT)
- [x] 6.2 Test de login: credenciales válidas (sesión), inválidas (401 + mensaje genérico, sin sesión)
- [x] 6.3 Test de refresh: access expirado → nuevo access con refresh válido; refresh inválido/expirado → 401 (fuerza logout)
- [x] 6.4 Test de logout: invalida el refresh (un refresh posterior con el token viejo falla)
- [x] 6.5 Test de autorización por rol en endpoints protegidos (rol sin permiso → 403)

## 7. Frontend — codegen y cliente (api-type-contracts)

- [x] 7.1 Añadir `orval` (devDep) + `orval.config.ts` (input `../../contracts/openapi.json` versionado, output `src/modules/core/services`, `client: react-query`)
- [x] 7.2 Mutator axios en `core/services`: instancia con `withCredentials`, inyección de `Authorization` e interceptor 401 → refresh → reintento (Scenario refresh)
- [x] 7.3 Script `generate:api`; generar tipos+hooks y **commitear los artefactos generados**; `pnpm typecheck` verde usándolos (Scenarios de generación/consumo y "Artefactos generados versionados")
- [x] 7.4 Check de **drift en CI**: regenerar contrato + tipos y fallar si difieren de lo versionado (Scenario "Detección de drift en CI")

## 8. Frontend — sesión y módulo auth (authentication)

- [x] 8.1 Store de sesión (Zustand, **no** persistido): access en memoria, usuario/rol, estados de carga
- [x] 8.2 Bootstrap de sesión al montar la app: intento de refresh inicial (splash/carga) para restaurar sesión (Scenarios persistencia)
- [x] 8.3 Pantallas `login` y `registro` con `react-hook-form` + `zod` (min 8 chars, email, campos requeridos — paridad con backend)
- [x] 8.4 Acción de logout: limpia store y datos locales, redirige a login (Scenario logout)

## 9. Frontend — rutas y guardas (authentication)

- [x] 9.1 `RouteGuard`: sin sesión en ruta privada → login; con sesión en `/auth` → panel; rol sin permiso → acceso denegado con volver (Scenarios de protección)
- [x] 9.2 Redirección por rol tras login/registro (mapa rol → ruta de inicio)

## 10. Frontend — tests (Vitest + RTL + MSW, derivados de los Scenario)

- [x] 10.1 Registro: éxito redirige; correo duplicado muestra error; password < 8 → error de validación sin petición (MSW)
- [x] 10.2 Login: válidas → sesión+redirect; inválidas → mensaje genérico; vacíos → validación sin petición
- [x] 10.3 Persistencia: recarga con sesión restaurable → autenticado; sin refresh válido → no autenticado y limpia datos
- [x] 10.4 Refresh: 401 → refresca y reintenta transparente; refresh inválido → logout+login (MSW)
- [x] 10.5 Guardas: ruta privada sin sesión → login; `/auth` con sesión → panel; rol sin permiso → acceso denegado

## 11. Docs y cierre

- [x] 11.1 `openspec validate add-authentication --strict` en verde
- [x] 11.2 `mvn verify` (backend) y `pnpm validate` (frontend) en verde; CI activa jobs
- [x] 11.3 Al archivar: actualizar `docs/domain.md` (entidad `User`, roles) y marcar `authentication` construida en `docs/vision.md` (gobernanza `CLAUDE.md`)

## 12. Ampliación: datos básicos de perfil en el registro

- [x] 12.1 Backend: `User` gana `fullName`, `username` (único), `phone`, `country`; migración `V4__user_profile.sql` (columnas + índice único en `username`)
- [x] 12.2 Backend: `RegisterRequest` con los nuevos campos + Bean Validation (fullName 2–120, username 3–30, phone patrón básico, country requerido); `UserResponse` expone `fullName` y `username`
- [x] 12.3 Backend: `AuthService.register` persiste los campos y rechaza `username` duplicado (`UsernameAlreadyExistsException` → 409); actualizar `AuthServiceTest`
- [x] 12.4 Contrato: regenerar `contracts/openapi.json` desde el backend (nuevos campos + validaciones) y regenerar el cliente orval
- [x] 12.5 Frontend: `RegisterForm` con los campos nuevos + schema Zod en paridad; saludo por `fullName` en el panel
- [x] 12.6 Frontend: actualizar tests (RegisterForm: campos obligatorios, username duplicado)
- [x] 12.7 `mvn verify` + `pnpm validate` + `openspec validate --strict` en verde

## 13. Ajuste: registro mínimo + confirmación de contraseña

- [x] 13.1 Backend: difiere `username`, `phone`, `country` a perfil (capacidad `users`); migración `V5__slim_register.sql` elimina esas columnas/índice; `User` conserva `fullName`
- [x] 13.2 Backend: `RegisterRequest`/`RegisterCommand`/`UserResponse`/`UserView` sin username/phone/country; `AuthService.register` sin chequeo de username; eliminar `UsernameAlreadyExistsException` y `existsByUsername`; actualizar tests
- [x] 13.3 Contrato: regenerar `contracts/openapi.json` desde el backend + cliente orval
- [x] 13.4 Frontend: `RegisterForm` = nombre, correo, contraseña, **confirmar contraseña**; schema Zod con `confirmPassword === password`; quitar username/phone/country; `SessionUser` sin username
- [x] 13.5 Frontend: tests (confirmación no coincide; quitar username duplicado)
- [x] 13.6 `mvn verify` + `pnpm validate` + `openspec validate --strict` en verde

## 14. Pendientes antes de archivar (reportados 2026-07-03)

- [x] 14.1 **BUG**: `/auth/refresh` devuelve **500** intermitente al recargar la página (debería ser 401 si el refresh es inválido). Error genérico no controlado (`traceId` ej. `cf6e364d`). Depurar con el stacktrace del log (buscar `[trace <id>]`); revisar `AuthService.refresh` (NPE / lazy load / rotación / cookie / doble refresh concurrente bootstrap+interceptor). Añadir test que lo reproduzca.
- [x] 14.2 Mejorar la **interfaz (UI/UX)** del auth: pulir login/registro/panel, estados de carga/error, responsividad y aplicación de marca. Definir alcance.
