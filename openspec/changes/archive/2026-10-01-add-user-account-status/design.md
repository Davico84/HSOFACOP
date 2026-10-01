## Context

- `users`: `email`, `password_hash`, `role` (`ADMIN`/`USER`), `full_name`, `failed_login_attempts` y `locked_until` (solo lectura en la entidad, los escriben `UPDATE` atómicos), timestamps (`@UpdateTimestamp`). Sin estado de cuenta.
- `refresh_tokens`: `token_hash`, `expires_at`, **`revoked`** (columna existente; hoy solo se crea en `false`).
- `AuthService.login` (no transaccional a propósito): `findByEmail` → bloqueo vigente → BCrypt (fallo: `LoginAttemptService.recordFailure`, `REQUIRES_NEW`) → `completeLogin` en `TransactionTemplate` (reset condicional + tokens).
- `AuthService.refresh` (`@Transactional`): busca el refresh por hash → rechaza revocado/expirado → rotación atómica → tokens nuevos. No mira el usuario.
- `JwtAuthenticationFilter` es stateless; el access token dura `JWT_ACCESS_TTL` (15 min).
- Frontend: `httpClient` reintenta tras `401` con `refreshSession()` (single-flight; lo usa también el bootstrap de `RootLayout`) y, si falla, limpia la sesión → `RequireAuth` redirige a login, **sin mensaje**. `getUserFriendlyError` pinta el `detail` de un `ApiProblem`.
- No hay endpoints de gestión ni `PageResponse`. `OpenApiErrorsConfig` añade `401` (fuera de `PublicPaths`) y `403` (`@PreAuthorize`); `OpenApiContractIT` exige `operationId` y éxito declarado (sus helpers solo leen `post`).

## Goals / Non-Goals

**Goals:** una cuenta deshabilitada no inicia ni renueva sesión y, si estaba dentro, sale con una explicación; el `ADMIN` gestiona el estado de las cuentas `USER`; sin tocar el contador del bloqueo.

**Non-Goals:** ver `proposal.md` (corte inmediato, búsqueda, cambio de rol, auditoría, más estados, mitigar la diferencia temporal del login).

## Decisions

### D1. Esquema y modelo
`V7__user_status.sql`: `ALTER TABLE users ADD COLUMN status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE'` + `CHECK (status IN ('ACTIVE','DISABLED'))`. Aditiva.
`common.UserStatus` (enum); `User.status` (`@Enumerated(STRING)`, `@Builder.Default ACTIVE`), **escribible** por la entidad (a diferencia de los campos del bloqueo): se cambia bajo bloqueo de fila (D3), así Hibernate actualiza `updated_at` y la entidad nunca queda obsoleta.

### D2. Orden del login
```
findByEmail ─ no ─▶ 401 genérico
bloqueo vigente ─ sí ─▶ 401 genérico (sin BCrypt, sin contador)              [gana aunque esté DISABLED]
BCrypt ─ falla ─▶ recordFailure + 401 genérico                                  [también si DISABLED]
DISABLED ─ sí ─▶ 403 AccountDisabledException (sin tocar el contador)
completeLogin: resetFailedLogins … AND status = 'ACTIVE' → 0 filas ⇒ 401, NUNCA issueTokens
```
- El `403` solo tras acertar la contraseña evita la enumeración por **contenido y código** de respuesta, pero **no** la diferencia temporal ya existente (BCrypt solo se ejecuta con correo existente y no bloqueado); mitigarla queda fuera.
- `resetFailedLogins`: `WHERE id = :id AND status = 'ACTIVE' AND (locked_until IS NULL OR locked_until <= :now)`. Si afecta 0 filas (bloqueo concurrente **o** deshabilitación concurrente), `completeLogin` lanza `InvalidCredentialsException` y no emite tokens; el contador y `locked_until` quedan como estaban.
- `AccountDisabledException extends BusinessException` (`403`, `type` `/errors/account-disabled`, detail "Tu cuenta está deshabilitada. Contacta con el administrador.").

### D3. Cambio de estado bajo bloqueo de fila; revocación (no borrado) de sesiones
`UserAdminService.changeStatus(id, status)` (`@Transactional`):
1. `UserRepository.findByIdForUpdate(id)` (`@Lock(PESSIMISTIC_WRITE)`): no existe → `404` (`UserNotFoundException`).
2. `role != USER` → `409` (`AccountStatusNotChangeableException`, "Solo se puede cambiar el estado de cuentas con rol USER").
3. Mismo estado → devolver la cuenta (idempotente, `200`).
4. `user.setStatus(status)` (dirty checking: Hibernate escribe `status` y `updated_at`; los campos del bloqueo no se tocan, son `updatable = false`).
5. Si es `DISABLED`: `refreshTokens.revokeAllByUserId(id)` (`UPDATE refresh_tokens SET revoked = true WHERE user_id = :id`) en la misma transacción.
La clasificación 404/409 y el cambio ocurren con la fila bloqueada: no dependen de una lectura que pueda quedar obsoleta. Hoy el rol no cambia por ninguna vía de la app; si se añade una, deberá respetar este bloqueo.
**Revocar en vez de borrar** (revisión de Codex, punto g): el refresh necesita encontrar el token para poder decir *por qué* falla (D4). Reactivar no toca los tokens: siguen revocados (no se restauran sesiones).

### D4. Refresh de una cuenta deshabilitada: 403 explicativo, sin escritura
En `AuthService.refresh`, tras encontrar el token y **antes** de comprobar revocado/expirado: si su `User` está `DISABLED` → `AccountDisabledException` (`403`, mismo `type` y detail que el login). No emite tokens ni escribe nada (no hace falta transacción propia ni hay riesgo de bloqueo: la revocación ya la hizo D3). Después, revocado o expirado → `401` como hoy.
Precondición documentada: `findByTokenHash` es una lectura sin bloqueo pesimista.

### D5. Frontend: aviso al cerrar la sesión por cuenta deshabilitada
`refreshSession()` (single-flight, compartido por el interceptor y el bootstrap): si el refresh falla con un `ApiProblem` de `type` `/errors/account-disabled`, muestra **una vez** un toast con su `detail` antes de rechazar; el resto del flujo no cambia (limpiar sesión → login). Un `401` de `/auth/refresh` no dispara otro refresh (`isAuthPath`).

### D6. API de gestión (`/api/users`, solo `ADMIN`)
`UsersController` con `@PreAuthorize("hasRole('ADMIN')")` en la clase:
| Operación | `operationId` | Éxito | Errores declarados (`application/problem+json`) |
|---|---|---|---|
| `GET /api/users` | `listUsers` | `200` `PageResponse<UserSummaryResponse>` | — (401/403/500 transversales) |
| `PATCH /api/users/{id}/status` | `changeUserStatus` | `200` `UserSummaryResponse` | `400` (`ValidationProblem` para `status` nulo; `ApiProblem` para un valor no deserializable), `404`, `409` (`ApiProblem`) |
- `listUsers(page = 0, size = 20)` con **parámetros explícitos** y **orden fijo en el servidor** (`id`). *Corrección al implementar*: con un `Pageable` (`@ParameterObject`) el cliente podría mandar `sort=passwordHash` (revelaría el orden de los hashes) o una propiedad inexistente (500). **Tope de 100**: un `size` mayor se recorta y `PageResponse.size` devuelve el aplicado; `page < 0` o `size < 1` → `400`.
- `PageResponse<T>` (`presentation.dto`): `content`, `page`, `size`, `totalElements`, `totalPages`, `last`; se construye desde `Page<T>` (nunca se serializa `Page`). Una página posterior a la última devuelve `content` vacío. `OpenApiContractIT` comprueba que el schema generado tipa `content` como array de `UserSummaryResponse`; si springdoc no resuelve el genérico, se declara un DTO concreto.
- `ChangeUserStatusRequest(@NotNull UserStatus status)`.
- `UserSummaryResponse`: **exactamente** `id`, `email`, `fullName`, `role`, `status`; no reutiliza `UserResponse` ni serializa `User`.
- Capas: `presentation.controller.UsersController` → `service.users.UserAdminService` (`UserSummaryView`) → `persistence`.

### D7. Frontend: sección "Usuarios"
- `sections.ts`: `{ id: "users", path: PATHS.USERS ("/usuarios"), roles: ["ADMIN"] }`; `navItems`: "Usuarios" (icono `Users`); `routes`: `sectionRoute("users", [{ index: true, element: <UsersScreen /> }])`; `UsersScreen` = `return <UsersFeature />;`.
- `modules/users/`:
  - `hooks/userKeys.ts`: `userKeys.all = ["users"]`, `userKeys.list({ page, size, sort })`.
  - `hooks/useUsers({ page })`: `useQuery` sobre `listUsers`, `placeholderData: keepPreviousData`.
  - `hooks/useChangeUserStatus`: mutación sobre `changeUserStatus`; `onSuccess` y `onError` invalidan `userKeys.all` (sin actualización optimista); toast de error con `getUserFriendlyError`.
  - `components/`: `UsersFeature`, `UsersTable`, `UserStatusBadge`, `ChangeStatusDialog`, `UsersPagination`, estado vacío (cada componente en su archivo).
- Filas `ADMIN`: sin acción. Filas `USER`: "Deshabilitar"/"Activar" con confirmación (`AlertDialog`); botón deshabilitado mientras la mutación de esa fila está en curso.
- Página vacía con `page > 0`: estado vacío con "Volver a la página anterior".
- shadcn `table`, `badge`, `alert-dialog` en `core/ui`: **nunca** `init`; tras el `add`, `git diff` (`globals.css` intacto, sin carpeta `@/`), corregir `import { cn } from "cn"` a `@/modules/core/utils/cn`, `pnpm remove cn` si se instaló; `shadcn-imports.test.ts` lo vigila.

### D8. Tests (uno por Scenario)
| Scenario | Test |
|---|---|
| Cuenta nueva activa | `UserAccountStatusIT.registered_user_is_active` |
| Independiente del bloqueo | `UserAccountStatusIT.status_change_preserves_lockout_fields` |
| Correo de cuenta deshabilitada | `UserAccountStatusIT.disabled_email_remains_registered` |
| Primera página / siguiente / vacía / tope 100 | `UserAccountStatusIT.list_*` |
| Solo los datos necesarios | `UserAccountStatusIT.list_exposes_only_summary_fields` (sin `passwordHash`, `failedLoginAttempts`, `lockedUntil`, `createdAt`, `updatedAt`) |
| Listado / cambio por USER → 403; body inválido → 400; 404/409 mapeados | `UsersControllerTest` (`@WebMvcTest` + `@EnableMethodSecurity` + `@WithMockUser`, service mockeado) |
| Deshabilitar / reactivar / mismo estado / ADMIN (también la propia, ambos estados) / inexistente | `UserAccountStatusIT` (estado, `revoked` de sus tokens, 409/404) + `UserAdminServiceTest` |
| Credenciales inválidas en cuenta DISABLED (cuenta el fallo) | `UserAccountStatusIT.disabled_wrong_password_counts_failure` |
| Deshabilitada con contraseña correcta | `UserAccountStatusIT.disabled_correct_password_is_403_without_counter` |
| Bloqueada y deshabilitada | `LoginLockoutIT.disabled_locked_account_stays_generic_401` |
| Deshabilitada durante el login | `UserStatusRaceIT` (spy de `PasswordEncoder.matches` que pone `DISABLED`): `401`, sin refresh token, contador y bloqueo intactos |
| Refresh de cuenta deshabilitada | `UserAccountStatusIT.disabled_refresh_is_403` + `AuthServiceTest` |
| Reactivar no restaura sesiones | `UserAccountStatusIT.reactivated_old_refresh_is_401` |
| Deshabilitar concurrente con refresh | `UserAccountStatusIT.concurrent_disable_and_refresh` (sin 500, `DISABLED`, tokens revocados, refresh posterior rechazado) |
| Contrato | `OpenApiContractIT`: helpers por método (`operation(path, method)`), operationIds `listUsers`/`changeUserStatus`, schemas `PageResponse…`/`UserSummaryResponse`/`ChangeUserStatusRequest`, 400/404/409 problem+json, 401/403 transversales; `ContractDriftIT` tras regenerar |
| Frontend: aviso al cerrar sesión | `httpClient.test.ts`: refresh `403 account-disabled` → sesión limpia + un solo toast; `401` normal → sin toast; sin bucle |
| Frontend: pantalla | `UsersFeature.test.tsx` (MSW): tabla, paginación (`placeholderData`, "Siguiente" con `last`), confirmar/cancelar, fila pendiente, error 409 → toast + recarga, página vacía, ADMIN sin acción; la paridad de secciones cubre "Sección restringida" |

## Risks / Trade-offs

- [Sesión viva hasta 15 min tras deshabilitar] → aceptado.
- [Diferencia temporal en el login revela qué correos existen] → ya existía; fuera de alcance.
- [El `403` confirma la existencia de la cuenta a quien conoce la contraseña] → aceptable.
- [Bloqueo de fila al cambiar el estado] → operación puntual de un admin; el refresh no bloquea filas (lectura simple), sin riesgo de interbloqueo.

## Migration Plan

`V7` aditiva (todas las cuentas `ACTIVE`). Contrato y cliente cambian en el mismo PR. Rollback = revertir el PR.
