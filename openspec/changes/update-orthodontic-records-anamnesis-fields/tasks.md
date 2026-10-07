> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`. El backend (sección 1) debe quedar en verde antes de empezar el frontend.

## 1. Backend

- [x] 1.1 `V15__record_number_manual.sql`, en el orden del design:
  - verificación previa de `id` mayor que 9999 con `RAISE EXCEPTION`;
  - números provisionales `AOC-` + `lpad(id, 4)` y `search_text` reemplazado en el mismo `UPDATE`;
  - `DROP CONSTRAINT ux_orthodontic_records_author_seq` y `DROP COLUMN record_seq`;
  - `ck_orthodontic_records_record_number` y el índice único `ux_orthodontic_records_record_number`;
  - quitar `anamnesis.oralHygiene` con `WHERE … IN ('YES', 'NO')`;
  - `schemaVersion` a 8.
- [x] 1.2 Entidad y repositorio sin `recordSeq` (ni la consulta del máximo); `recordNumber` editable; `existsByRecordNumberAndIdNot`. `RecordContent.CURRENT_SCHEMA_VERSION = 8`
- [x] 1.2b `ClockConfig` con `app.time-zone` (por defecto `America/Lima`, `APP_TIME_ZONE`); documentar la variable en `secrets.properties.example`
- [x] 1.3 DTOs:
  - `CreateRecordRequest` y `UpdateRecordRequest` con `recordNumber` obligatorio (`@NotBlank`, `@Pattern ^AOC-[0-9]{4}$`, mensaje "Usa el formato AOC-0001");
  - servicio: crear y guardar con ese número;
  - `recordNumber` en `RecordData`, asignado a la entidad antes de recalcular `search_text`;
  - verificación previa con `existsByRecordNumberAndIdNot` y, para la carrera, `saveAndFlush` capturando solo la violación `23505` de `ux_orthodontic_records_record_number` → `RecordNumberTakenException` → `409` `/errors/record-number-taken` en `GlobalExceptionHandler`;
  - ejemplos de OpenAPI con `AOC-0015` (`RecordResponse`, `RecordSummaryResponse`, `AdminDashboardResponse`, `UserDashboardResponse`).
- [x] 1.4 `Anamnesis`:
  - `oralHygiene` como `OralHygiene {EXCELLENT, GOOD, REGULAR, DEFICIENT}` y nuevo `menarcheDate` (`LocalDate`);
  - `RecordNormalizer` descarta `menarche` y `menarcheDate` sin sexo femenino, y `menarcheDate` sin `menarche = YES`;
  - validación de `menarcheDate` (no futura con el `Clock`, no anterior a `birthDate`) → `400` en `content.anamnesis.menarcheDate`.
- [x] 1.5 `CephalometricAnalysis` + `TWEED`, `JARABAK`
- [x] 1.6 Tests (uno por scenario, `Clock.fixed` en `America/Lima`):
  - creación con número;
  - número vacío y formatos inválidos (`AOC-15`, `AOC-00001`, `AEO-0015`);
  - duplicado entre autores en crear y guardar;
  - creaciones simultáneas con el mismo número (una `409`);
  - el autor corrige el número tras imprimir (datos del paciente siguen fijos);
  - el `ADMIN` corrige el número de otro autor;
  - nombre vacío y sin sesión;
  - higiene oral por categoría y sin valor;
  - menstruación: fecha válida, respuesta No descarta la fecha, sexo masculino o sin sexo descarta ambas, fecha futura y anterior al nacimiento (`400`), sin fecha de nacimiento solo no futura;
  - cefalometría con 3, menos de 3 y 5 opciones;
  - migración sobre una base con historias `AEO-` repetidas entre autores y higiene `YES`/`NO`;
  - un número corregido queda libre para otra historia;
  - búsqueda por el número nuevo después de editarlo (y no por el anterior) y después de migrar;
  - número migrado `AOC-0001` visible en el listado, el panel y la impresión;
  - fecha de la primera menstruación en el cambio de día de Lima (con el `Clock` fijo a las 23:30 de Lima, "hoy" es válido y "mañana" no).

  Quitar `recordSeq` y los números `AEO-` de todos los fixtures y SQL de prueba: `OrthodonticRecordServiceTest`, `OrthodonticRecordRepositoryIT`, `FacialContentMigrationIT`, `BoltonIncisorsMigrationIT`, `OrthodonticRecordsIT`, `OpenApiContractIT`, `DefaultRecordQuotaIT`, `DashboardIT`, `PatientIdentityLockIT` y cualquier otro que aparezca al compilar. `operationId` sin cambios. `mvn verify` en verde.

## 2. Contrato y cliente

- [x] 2.1 `contracts/openapi.json` regenerado (`-Dcontract.update=true`) y `pnpm generate:api`

## 3. Frontend

- [x] 3.0 `recordNumber` en el schema Zod (`^AOC-[0-9]{4}$`), `emptyRecordValues`, `toFormValues`, `toCreateRequest`, `toUpdateRequest` y los campos del paso 1 en `RECORD_STEPS`; `RECORD_NUMBER_TAKEN_TYPE` en `recordKeys.ts`
- [x] 3.1 "Nueva historia" (es el mismo formulario: el número va en el paso 1 y se exige antes del primer guardado, que crea la historia):
  - pide nombre del paciente y número (`AOC-0001`) con validación Zod;
  - el `409` `/errors/record-number-taken` va junto al campo del número.
- [x] 3.2 Paso 1:
  - número editable para el autor y el `ADMIN`, también tras imprimir;
  - el `409` de número tomado se muestra en el campo con `setError("recordNumber", detail)` (guardado manual y autoguardado), conserva lo escrito y no pausa el autoguardado (la pausa queda solo para `/errors/stale-record`). `getFieldErrors()` solo procesa `400`, así que este caso se maneja aparte.
- [x] 3.3 Higiene oral con las cuatro categorías (selección única, deseleccionable)
- [x] 3.4 Menstruación:
  - pregunta solo con sexo femenino;
  - fecha solo con "Sí", con límites en Zod (no futura, no anterior al nacimiento);
  - limpiar valores cuando la condición deja de cumplirse.
- [x] 3.5 Paso 6: seis opciones cefalométricas, contador `n de 3` que permite más de tres
- [x] 3.6 Vista previa e impresión:
  - número `AOC-`;
  - higiene oral con cuatro casillas;
  - respuesta y fecha de menstruación cuando aplican;
  - seis opciones cefalométricas.

  Verificación con Edge headless + PyMuPDF de que las hojas 1 y 10 no cambian de cantidad de páginas.
- [x] 3.7 Tests Vitest/MSW (uno por scenario de interfaz):
  - número obligatorio, formato y duplicado en el campo sin pausar el autoguardado;
  - higiene oral;
  - menstruación (sexo, No, fecha inválida);
  - cefalometría con 2, 3 y 5.

  Ajustar los fixtures (`test/fixtures.ts` y demás) a `AOC-`. E2E con backend (`records`, `records.responsive`, `autosave`, `quota`) a `AOC-` y al nuevo diálogo de creación, más uno nuevo: crear con número y corregirlo tras imprimir. `pnpm validate` en verde.

## 4. Docs y cierre

- [ ] 4.1 `docs/domain.md`:
  - número visible manual, único entre las historias vigentes (el corregido queda libre), editable por el autor o el ADMIN;
  - sin `record_seq`;
  - higiene oral por categorías;
  - fecha de la primera menstruación.
- [ ] 4.2 `openspec validate update-orthodontic-records-anamnesis-fields --strict`
- [ ] 4.3 Al archivar: `docs/vision.md` ✅
