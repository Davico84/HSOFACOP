> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V13__record_filled_steps.sql` (`filled_steps SMALLINT NULL`, `CHECK 0..255`), `OrthodonticRecord.filledSteps`; `filledSteps` (lista 1–8, `@UniqueElements`) en `CreateRecordRequest` y `UpdateRecordRequest` (ausente al guardar = no cambia); el servidor siempre agrega el paso 1 (al crear sin dato o con `[]` nace `[1]`); `RecordResponse.filledSteps` (lista persistida, nula = sin calcular)
- [ ] 1.2 `GET /api/dashboard/me` (`hasRole('USER')`, ADMIN → `403`) con SQL nativo (`COUNT(*) FILTER`, máscara clínica `& 127`, `bit_count`): totales, mes en curso (límites `Instant` desde el `Clock`), cupo, completitud (completa = pasos 1–7), promedio a 1 decimal nullable, faltantes, los 7 pasos vacíos (`count DESC, step ASC`) y hasta 5 para retomar, solo del actor
- [ ] 1.3 `GET /api/dashboard/admin` (`ADMIN`, si no `403`): usuarios, historias (`complete`/`inProgress`/`notComputed`), 6 meses agrupados con `AT TIME ZONE` de la zona del `Clock` y rellenos con ceros, top 5 cuentas `USER` (activas y deshabilitadas, con `status`), cupos de `USER` activos ≥ 80 % o llenos (cupo 0 y `used > limit` = lleno, orden sin división por cero; hasta 10 + total); DTOs sin correo, listas nunca nulas
- [ ] 1.4 Tests (uno por scenario, `Clock.fixed` en `America/Lima`):
  - controller: `admin_endpoint_is_403_for_user`, `me_endpoint_is_403_for_admin`, `filled_steps_out_of_range_is_400`, `repeated_filled_steps_is_400`, 401 sin sesión;
  - IT records: `save_stores_and_returns_filled_steps`, `create_without_filled_steps_starts_with_step_1`, `create_with_empty_filled_steps_starts_with_step_1`, `old_record_is_not_computed`;
  - IT dashboard USER: `quota_and_totals`, `unlimited_quota`, `completeness_ignores_signatures_step`, `average_is_null_without_computed`, `missing_data_and_empty_steps_order`, `only_own_records`, `empty_dashboard`, `resume_links_last_step_or_1`, `resume_empty_when_all_complete`;
  - IT dashboard ADMIN: `user_counts_by_status`, `per_month_fills_zeros`, `month_cut_uses_app_zone`, `top_authors_only_users_with_status`, `admin_and_disabled_records_count_in_totals`, `quotas_zero_and_reduced_are_full`, `quotas_exclude_disabled`, `quotas_top_10_and_total`, `lists_never_null`;
  - `getMyDashboard`/`getAdminDashboard` en `OpenApiContractIT`; regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [ ] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 `filledStepsOf(values)` (función pura con el criterio de `useStepStatus`, que pasa a usarla) y envío de `filledSteps` al crear y en cada guardado; invalidar `dashboardKeys.all` al crear/guardar, al cambiar un cupo y al cambiar el estado de una cuenta
- [ ] 3.2 `modules/dashboard` (un componente por archivo): `DashboardFeature` por rol, `UserDashboard` (tarjetas, completitud con aviso de sin calcular, datos faltantes, pasos vacíos, para retomar, estado sin historias) y `AdminDashboard` (usuarios, historias, barras por mes, tratantes marcando deshabilitados, cupos con total); listas en lugar de tablas (375 px sin scroll horizontal); valores visibles en cada barra; barras con divisor mínimo 1; meses rotulados sin `new Date`; borrar los datos de ejemplo
- [ ] 3.3 Tests Vitest de los scenarios (USER y ADMIN, vacíos, aviso de sin calcular, promedio "—", enlaces de retomar con y sin último paso y su nombre accesible, barras con todo en cero y valores visibles, rótulos de mes, tratante deshabilitado marcado, total de cupos) y de `filledStepsOf`; revisión visual claro/oscuro a 375 y 1280 px (sin scroll horizontal, foco visible); `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [ ] 4.2 Al archivar — `docs/domain.md` (`OrthodonticRecord.filledSteps`), `docs/vision.md` (`dashboard` ✅)
