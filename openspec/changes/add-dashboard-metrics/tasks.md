> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V13__record_filled_steps.sql` (`filled_steps SMALLINT NULL`, `CHECK 0..255`), `OrthodonticRecord.filledSteps`; `filledSteps` (lista 1–8, `@UniqueElements`) en `CreateRecordRequest` y `UpdateRecordRequest` (ausente al guardar = no cambia); `RecordResponse.filledSteps` (lista, nula = sin calcular)
- [ ] 1.2 `GET /api/dashboard/me` con SQL nativo (`COUNT(*) FILTER`, máscara clínica `& 127`, `bit_count`): totales, mes en curso (límites `Instant` desde el `Clock`), cupo, completitud (completa = pasos 1–7), promedio a 1 decimal nullable, faltantes, los 7 pasos vacíos (`count DESC, step ASC`) y hasta 5 para retomar, solo del actor
- [ ] 1.3 `GET /api/dashboard/admin` (`ADMIN`, si no `403`): usuarios, historias (`complete`/`inProgress`/`notComputed`), 6 meses agrupados con `AT TIME ZONE` de la zona del `Clock` y rellenos con ceros, top 5 tratantes, cupos ≥ 80 % o llenos (hasta 10 + total)
- [ ] 1.4 Tests: controller (403, 400 de `filledSteps` fuera de rango y repetidos) e IT de cada scenario con `Clock.fixed` en `America/Lima` (solo sus historias, crear nace calculada, Firmas no cuenta, sin calcular, promedio nulo, meses vacíos, corte de mes, top 5, cupos con tope 10); `operationId` `getMyDashboard`/`getAdminDashboard` en `OpenApiContractIT`; regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [ ] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 `filledStepsOf(values)` (función pura con el criterio de `useStepStatus`, que pasa a usarla) y envío de `filledSteps` al crear y en cada guardado; invalidar `dashboardKeys.all` al crear/guardar, al cambiar un cupo y al cambiar el estado de una cuenta
- [ ] 3.2 `modules/dashboard` (un componente por archivo): `DashboardFeature` por rol, `UserDashboard` (tarjetas, completitud, datos faltantes, pasos vacíos, para retomar, estado sin historias) y `AdminDashboard` (usuarios, historias, barras por mes, top tratantes, cupos con total); barras con divisor mínimo 1; meses rotulados sin `new Date`; borrar los datos de ejemplo
- [ ] 3.3 Tests Vitest de los scenarios (USER y ADMIN, vacíos, sin calcular, promedio "—", enlaces de retomar con y sin último paso, barras con todo en cero, rótulos de mes) y de `filledStepsOf`; revisión visual claro/oscuro a 375 y 1280 px; `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [ ] 4.2 Al archivar — `docs/domain.md` (`OrthodonticRecord.filledSteps`), `docs/vision.md` (`dashboard` ✅)
