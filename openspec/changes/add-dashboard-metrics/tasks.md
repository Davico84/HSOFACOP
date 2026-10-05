> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V13__record_filled_steps.sql` (`filled_steps SMALLINT NULL`, `CHECK 0..255`), `OrthodonticRecord.filledSteps`; `UpdateRecordRequest.filledSteps` (lista 1–8 sin repetidos, ausente = no cambia) y `RecordResponse.filledSteps` (lista, nula = sin calcular)
- [ ] 1.2 `GET /api/dashboard/me`: totales, mes en curso (`Clock`), cupo, completitud, datos faltantes, pasos vacíos y hasta 5 para retomar, solo del actor
- [ ] 1.3 `GET /api/dashboard/admin` (`ADMIN`, si no `403`): usuarios, historias, 6 meses con ceros, top 5 tratantes, cupos ≥ 80 % o llenos
- [ ] 1.4 Tests: controller (403, 400 de `filledSteps`) e IT de cada scenario (solo sus historias, sin calcular, meses vacíos, top 5, cupos); `operationId` en `OpenApiContractIT`; regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [ ] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 `filledStepsOf(values)` (función pura con el criterio de `useStepStatus`) y envío de `filledSteps` en cada guardado; invalidar `dashboardKeys.all` al guardar y al cambiar un cupo
- [ ] 3.2 `modules/dashboard`: `DashboardFeature` por rol, `UserDashboard` (tarjetas, completitud, datos faltantes, pasos vacíos, para retomar, estado sin historias) y `AdminDashboard` (usuarios, historias, barras por mes, top tratantes, cupos); borrar los datos de ejemplo
- [ ] 3.3 Tests Vitest de los scenarios (USER y ADMIN, vacíos, sin calcular, enlaces de retomar, barras con ceros) y de `filledStepsOf`; revisión visual claro/oscuro a 375 y 1280 px; `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [ ] 4.2 Al archivar — `docs/domain.md` (`OrthodonticRecord.filledSteps`), `docs/vision.md` (`dashboard` ✅)
