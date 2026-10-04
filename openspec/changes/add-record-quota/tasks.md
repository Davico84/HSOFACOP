> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V11__user_record_quota.sql` (`record_quota INTEGER NULL CHECK >= 0`) y `User.recordQuota`
- [ ] 1.2 Creación: verificar el cupo bajo `findByIdForUpdate` (solo `USER`); `RecordQuotaReachedException` (`BusinessException`) → `409 /errors/record-quota-reached` solo con `detail`; `@ApiResponse(409)` en `createRecord`
- [ ] 1.3 `GET /api/orthodontic-records/quota` (`limit`, `used`, `reached`) para el usuario autenticado; ADMIN: `limit=null`, `reached=false`, `used` real
- [ ] 1.4 `PATCH /api/users/{id}/record-quota` (`ADMIN`, solo cuentas `USER`, 0–9999 o `null`; `409 /errors/quota-not-applicable` para `ADMIN`); listado de usuarios con `recordQuota` y `recordCount` (conteo agrupado por página); `UserSummaryResponse` con ambos campos también en `PATCH /{id}/status`; `operationId` nuevos en `OpenApiContractIT`
- [ ] 1.5 Tests: controller (400/403/404/409), IT (cupo lleno → 409 sin crear; creaciones simultáneas → solo una; editar con cupo lleno; ADMIN sin límite; listado con conteo); regenerar contrato; `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `pnpm generate:api`; hook `useRecordQuota`
- [ ] 2.2 Listado de historias: "N de M historias", "Nueva historia" deshabilitado con tooltip + `FieldHint` al llegar al tope en la cabecera y en `RecordsEmptyState`; formulario nuevo con aviso al inicio, "Crear historia" deshabilitado y manejo del `409`; invalidar el cupo al crear
- [ ] 2.3 `pnpm dlx shadcn@latest add dialog` con las precauciones de `sheet`; Usuarios: columna "Historias" ("3 de 5" / "3 · sin límite" / "3 · no aplica" en ADMIN) y diálogo "Cupo" (`NumberInput` 0–9999 paso 1, "Sin límite", aviso si queda por debajo de las creadas), solo cuentas `USER`
- [ ] 2.4 Tests Vitest de los scenarios (listado y usuarios) y E2E; `pnpm validate` verde

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [ ] 3.2 Al archivar — `docs/domain.md`: `User.recordQuota` y la regla de cupo; `docs/vision.md` ✅
