> Backend + contrato + frontend, en un solo PR. Revisado por Codex. Los `*IT` necesitan Docker: `Skipped: 0`. Antes de tocar el frontend, skill `frontend-guard`.
> Regenerar el contrato: `./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dcontract.update=true` y después `pnpm generate:api`.

## 1. Backend — modelo (D1)

- [x] 1.1 `V7__user_status.sql` (`status` con `DEFAULT 'ACTIVE'` y `CHECK`)
- [x] 1.2 `common.UserStatus`; `User.status` (`@Builder.Default ACTIVE`, escribible)

## 2. Backend — login y refresh (D2, D4)

- [x] 2.1 `AccountDisabledException` (403, `account-disabled`)
- [x] 2.2 `AuthService.login`: rechazo `DISABLED` tras BCrypt sin contador; `resetFailedLogins … AND status = 'ACTIVE'` (0 filas → 401, nunca tokens)
- [x] 2.3 `AuthService.refresh`: usuario `DISABLED` → 403 antes de comprobar revocado/expirado, sin escrituras; `AuthController`: `@ApiResponse` 403 (`ApiProblem`, problem+json) en `login` y `refresh`
- [x] 2.4 `AuthServiceTest`: orden del login (DISABLED con contraseña correcta/incorrecta, reset 0 filas) y refresh DISABLED

## 3. Backend — gestión (D3, D6)

- [x] 3.1 `PageResponse<T>`, `UserSummaryResponse`, `ChangeUserStatusRequest` en `presentation.dto`; tope `setMaxPageSize(100)`
- [x] 3.2 `UserRepository.findByIdForUpdate` (`PESSIMISTIC_WRITE`); `RefreshTokenRepository.revokeAllByUserId`; `service.users.UserAdminService` (`list`, `changeStatus` con 404/409/idempotencia/revocación); `UserNotFoundException` (404), `AccountStatusNotChangeableException` (409)
- [x] 3.3 `UsersController` (`/api/users`, `@PreAuthorize ADMIN`, `@ParameterObject @PageableDefault`, `operationId` + `@ApiResponse` de D6)
- [x] 3.4 `UserAdminServiceTest`, `UsersControllerTest` (`@WebMvcTest`), `UserAccountStatusIT`, `UserStatusRaceIT`, `LoginLockoutIT.disabled_locked_account_stays_generic_401` (tabla de D8)
- [x] 3.5 `OpenApiContractIT`: helpers por método HTTP, operationIds y schemas nuevos, 400/404/409; regenerar `contracts/openapi.json`; `ContractDriftIT` verde; `./mvnw -B verify` verde, `Skipped: 0`

## 4. Frontend (D5, D7)

- [x] 4.1 `pnpm generate:api` (`listUsers`, `changeUserStatus`, `UserStatus`, `PageResponse…`)
- [x] 4.2 `refreshSession`: toast único con el `detail` ante `403 account-disabled`; `httpClient.test.ts`
- [x] 4.3 shadcn `table`, `badge`, `alert-dialog` (checklist de D7)
- [x] 4.4 Sección "Usuarios": `sections.ts` (`ADMIN`), `navItems`, `PATHS.USERS`, `sectionRoute`, `UsersScreen`
- [x] 4.5 `modules/users`: `userKeys`, `useUsers`, `useChangeUserStatus`; `UsersFeature`, `UsersTable`, `UserStatusBadge`, `ChangeStatusDialog`, `UsersPagination`, estado vacío
- [x] 4.6 `UsersFeature.test.tsx` (tabla de D8)
- [x] 4.7 `pnpm validate` verde

## 5. Docs y cierre

- [x] 5.1 `docs/domain.md`: `status` en `User` (texto y ER), reglas de la capacidad `users`; quitar `status` de "candidatos"
- [x] 5.2 `docs/backend.md` §5.1 (`PageResponse` real, `@ParameterObject @PageableDefault`, tope 100, página vacía) y §11 (cuentas deshabilitadas: login, refresh, revocación)
- [x] 5.3 `docs/frontend.md`: `modules/users` como ejemplo de keys/paginación/mutación, aviso de cuenta deshabilitada en `refreshSession`
- [x] 5.4 `docs/vision.md`: roadmap de `users` (esta es la primera parte; roles, alta y perfil pendientes)
- [x] 5.5 Prueba manual: ADMIN deshabilita a un USER → el USER con sesión abierta sale con el aviso al renovar (o al recargar); no puede entrar ("cuenta deshabilitada"); reactivar → vuelve a entrar; filas ADMIN sin acción; un USER no ve "Usuarios"
- [x] 5.6 `openspec validate add-user-account-status --strict`
