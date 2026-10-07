> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`. El backend (sección 1) debe quedar en verde antes de empezar el frontend.

## 1. Backend

- [ ] 1.1 `V15__record_number_manual.sql`:
  - números provisionales `AOC-` + `lpad(id, 4)`, fallando si algún `id` supera 9999;
  - eliminar `record_seq` y su restricción por autor;
  - `CHECK` del formato e índice único global sobre `record_number`;
  - quitar `anamnesis.oralHygiene` con valor `YES`/`NO` del contenido.
- [ ] 1.2 Entidad y repositorio sin `recordSeq` (ni la consulta del máximo); `recordNumber` editable
- [ ] 1.3 DTOs:
  - `CreateRecordRequest` y `UpdateRecordRequest` con `recordNumber` obligatorio (`@NotBlank`, `@Pattern ^AOC-[0-9]{4}$`, mensaje "Usa el formato AOC-0001");
  - servicio: crear y guardar con ese número;
  - `RecordNumberTakenException` → `409` `/errors/record-number-taken` al violar el índice (también en la carrera).
- [ ] 1.4 `Anamnesis`:
  - `oralHygiene` como `OralHygiene {EXCELLENT, GOOD, REGULAR, DEFICIENT}` y nuevo `menarcheDate` (`LocalDate`);
  - `RecordNormalizer` descarta `menarche` y `menarcheDate` sin sexo femenino, y `menarcheDate` sin `menarche = YES`;
  - validación de `menarcheDate` (no futura con el `Clock`, no anterior a `birthDate`) → `400` en `content.anamnesis.menarcheDate`.
- [ ] 1.5 `CephalometricAnalysis` + `TWEED`, `JARABAK`
- [ ] 1.6 Tests (uno por scenario, `Clock.fixed` en `America/Lima`):
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
  - búsqueda por `AOC-`.

  `operationId` sin cambios. `mvn verify` en verde.

## 2. Contrato y cliente

- [ ] 2.1 `contracts/openapi.json` regenerado (`-Dcontract.update=true`) y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 "Nueva historia":
  - pide nombre del paciente y número (`AOC-0001`) con validación Zod;
  - el `409` `/errors/record-number-taken` va junto al campo del número.
- [ ] 3.2 Paso 1:
  - número editable para el autor y el `ADMIN`, también tras imprimir;
  - el `409` de número tomado se muestra en el campo, conserva lo escrito y no pausa el autoguardado (la pausa queda solo para `/errors/stale-record`).
- [ ] 3.3 Higiene oral con las cuatro categorías (selección única, deseleccionable)
- [ ] 3.4 Menstruación:
  - pregunta solo con sexo femenino;
  - fecha solo con "Sí", con límites en Zod (no futura, no anterior al nacimiento);
  - limpiar valores cuando la condición deja de cumplirse.
- [ ] 3.5 Paso 6: seis opciones cefalométricas, contador `n de 3` que permite más de tres
- [ ] 3.6 Vista previa e impresión:
  - número `AOC-`;
  - higiene oral con cuatro casillas;
  - respuesta y fecha de menstruación cuando aplican;
  - seis opciones cefalométricas.

  Verificación con Edge headless + PyMuPDF de que las hojas 1 y 10 no cambian de cantidad de páginas.
- [ ] 3.7 Tests Vitest/MSW (uno por scenario de interfaz):
  - número obligatorio, formato y duplicado en el campo sin pausar el autoguardado;
  - higiene oral;
  - menstruación (sexo, No, fecha inválida);
  - cefalometría con 2, 3 y 5.

  Ajustar los fixtures (`recordNumber` `AOC-`). E2E con backend: crear con número y corregirlo tras imprimir. `pnpm validate` en verde.

## 4. Docs y cierre

- [ ] 4.1 `docs/domain.md`:
  - número visible manual, global y permanente, editable por el autor o el ADMIN;
  - sin `record_seq`;
  - higiene oral por categorías;
  - fecha de la primera menstruación.
- [ ] 4.2 `openspec validate update-orthodontic-records-anamnesis-fields --strict`
- [ ] 4.3 Al archivar: `docs/vision.md` ✅
