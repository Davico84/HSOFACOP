> Rama `change/update-orthodontic-records-aeo-number-menarche-year` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V16`: `AOC-nnnn` → `AEO-nnnn` (número y `search_text`), `CHECK` `^AEO-[0-9]{4}$`; `menarcheDate` → `menarcheYear` (año de la fecha) y `schemaVersion` 9
- [ ] 1.2 `@Pattern` y mensajes "AEO-0001" en create/update; ejemplos de `@Schema`; Javadoc de la entidad
- [ ] 1.3 `Anamnesis.menarcheYear` (Integer); `PatientFields`: cuatro cifras, no futuro (año del reloj de la app), no anterior al año de nacimiento; `RecordNormalizer` con el año
- [ ] 1.4 Tests: `TestRecordNumbers` con AEO; `RecordNumberMigrationIT` (V16: número, búsqueda, menarquia fecha → año, `schemaVersion`); validación del año (`MenarcheDateValidationTest` → año); ITs y tests de servicio/controlador con AEO; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el código de orval (`menarcheYear`)
- [ ] 2.2 Zod (`record.ts`): patrón y mensaje AEO; `menarcheYear` con las mismas reglas que el backend
- [ ] 2.3 `Step1Patient`: placeholder "AEO-0001"; `NumberInput` "Año de la 1ª menstruación"; `PrintPatientSection`: "Año:"
- [ ] 2.4 Tests y fixtures con AEO; tests del año (válido, futuro, anterior al nacimiento, sin nacimiento); `e2e/support/recordNumber.ts` con AEO; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: formato `AEO-` + 4 dígitos, `menarcheYear`, `schemaVersion` 9
- [ ] 3.2 Al archivar: `docs/vision.md` ✅
