> Rama `change/update-orthodontic-records-aeo-number-menarche-year` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V16` transaccional con el SQL del design: **primero** el preflight que aborta con los ids si hay `menarcheDate` no `null` que no sea string ISO convertible a `date`, o `schemaVersion` que no sea JSON number entero; `AOC-nnnn` → `AEO-nnnn` (número y `search_text`), `CHECK` `^AEO-[0-9]{4}$`; `menarcheDate` ISO → `menarcheYear` y la clave vieja quitada siempre (también `null`); `schemaVersion` 9 con la expresión del design
- [ ] 1.2 `RecordContent.CURRENT_SCHEMA_VERSION = 9`
- [ ] 1.3 `@Pattern` y mensajes "AEO-0001" en create/update; ejemplos `@Schema` AEO en `CreateRecordRequest`, `UpdateRecordRequest`, `RecordResponse`, `RecordSummaryResponse`, `UserDashboardResponse` y `AdminDashboardResponse`; Javadoc de la entidad
- [ ] 1.4 `Anamnesis.menarcheYear` (Integer); `PatientFields`: cuatro cifras, no futuro (año del reloj de la app), no anterior al año de nacimiento; `RecordNormalizer` con el año
- [ ] 1.5 Tests: `TestRecordNumbers` con AEO; `RecordNumberMigrationIT` (V16: número y búsqueda; menarquia ausente, `null`, ISO válida, formato inválido y fecha imposible `2023-02-30` → aborta sin cambiar nada; `schemaVersion` ausente, `8`, y `"8"`/`8.0` → aborta); guardar una historia migrada deja `schemaVersion` 9; validación del año (`MenarcheDateValidationTest` → año); ITs y tests de servicio/controlador con AEO; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el código de orval (`menarcheYear`); comprobar que ninguno contiene "AOC"
- [ ] 2.2 Zod (`record.ts`): patrón y mensaje AEO; `menarcheYear` con las mismas reglas que el backend
- [ ] 2.3 `Step1Patient`: placeholder "AEO-0001"; `NumberInput` "Año de la 1ª menstruación"; `PrintPatientSection`: "Año:"
- [ ] 2.4 Tests y fixtures con AEO; tests del año (válido, futuro, anterior al nacimiento, sin nacimiento); `e2e/support/recordNumber.ts` con AEO; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: formato `AEO-` + 4 dígitos, `menarcheYear`, `schemaVersion` 9
- [ ] 3.2 Al archivar: `docs/vision.md` ✅
