## Context

- Hoy el número visible se genera por autor (`AEO-001`) a partir de `record_seq`, es único por autor y no se edita (`OrthodonticRecordService.create`, `findMaxSeq…`).
- El contenido clínico está tipado en Java (`RecordContent` → `Anamnesis`, `RadiographicAnalysis`) y se guarda como JSONB. `Anamnesis.oralHygiene` es `YesNo` y `menarche` es `YesNo`. `RecordNormalizer` ya descarta `menarche` si el sexo no es femenino. `RadiographicAnalysis.CephalometricAnalysis` es `{STEINER, RICKETTS, MCNAMARA, WITS}`.
- El autoguardado (`useAutosave` + `RecordForm`) se pausa tras un `409` de edición concurrente (`/errors/stale-record`). Otros `409` (`/errors/patient-locked`) se avisan sin pausar.
- Los datos del paciente se fijan tras la primera impresión (`patient_locked_at`); el número no forma parte de esa identidad.
- Entorno en fase de prueba: las historias de Neon y de las bases locales se pueden descartar.

## Decisions

### Número de historia manual
- **Formato**: `AOC-` + exactamente cuatro dígitos (`^AOC-[0-9]{4}$`), validado en el DTO (`@Pattern`), en el schema Zod y con un `CHECK` en la base.
- **Unicidad global entre historias vigentes**: índice único `ux_orthodontic_records_record_number` sobre `record_number` en toda la tabla (de cualquier autor y cohorte: los docentes no reinician la numeración).
  - **No se reserva el número anterior al corregir.** Una corrección casi siempre arregla un número mal ingresado que puede ser de otra historia, y reservarlo bloquearía a su dueño legítimo. Que los docentes no repitan números es una práctica de la coordinación; el sistema impide los duplicados vigentes. (Descartado: una tabla histórica de números usados, propuesta en la revisión.)
- **Conversión del duplicado a `409`**:
  - El servicio consulta antes si el número ya está en otra historia (`existsByRecordNumberAndIdNot`) para el caso común, con mensaje claro.
  - Para la carrera entre dos guardados, guarda con `saveAndFlush` y captura `DataIntegrityViolationException` **solo** si la causa raíz es PostgreSQL `23505` con la restricción `ux_orthodontic_records_record_number`; la convierte en `RecordNumberTakenException`.
  - Cualquier otra violación sigue su camino actual (error interno).
  - `GlobalExceptionHandler` la traduce a `409` con `type` `/errors/record-number-taken`.
  - Sirve igual en `create` y en `update`, porque la carrera es entre historias distintas (no la cubren `@Version` ni el bloqueo de fila).
  - El mensaje no revela de quién es la historia que tiene el número (privacidad entre alumnos). La coordinación lo resuelve buscando el número en el listado, donde el `ADMIN` ve todas las historias con su autor.
- **Quién lo edita**: quien puede editar la historia, es decir, su autor o un `ADMIN` (un `USER` ajeno ni siquiera la ve: `404`). Se edita en el paso 1 con el mismo guardado (`PUT`), también después de imprimir. No hay regla extra de permisos.
- **Creación**: "Nueva historia" pide nombre del paciente y número antes de crear (`POST` con `recordNumber`). Se elimina la asignación automática.
- **`record_seq` se elimina** (columna, restricción `ux_orthodontic_records_author_seq` y consulta del máximo). El identificador técnico es solo `id`.
- **El número viaja en `RecordData`** (creación y guardado), y el servicio lo asigna a la entidad **antes** de recalcular `search_text`, que lo incluye. Así la búsqueda encuentra el número nuevo y deja de encontrar el anterior.
- **Frontend**: `recordNumber` entra en el schema Zod, `emptyRecordValues`, `toFormValues`, `toCreateRequest`, `toUpdateRequest` y los campos del paso 1 en `RECORD_STEPS`; deja de mostrarse deshabilitado en `Step1Patient`.

### Número duplicado y autoguardado
- El `409` `/errors/record-number-taken` se muestra junto al campo del número, conserva lo escrito y **no** pausa el autoguardado (la pausa sigue siendo solo de `/errors/stale-record`).
  - Hoy `getFieldErrors()` solo procesa respuestas `400`, así que se agrega `RECORD_NUMBER_TAKEN_TYPE` en `recordKeys.ts` y `RecordForm` (guardado manual y autoguardado) y el diálogo de "Nueva historia" hacen `setError("recordNumber", …)` con el `detail` del servidor.
- Un número con formato inválido no llega al servidor: Zod lo marca y el autoguardado ya devuelve `invalid` sin enviar.

### Higiene oral por categorías
- Nuevo enum `OralHygiene { EXCELLENT, GOOD, REGULAR, DEFICIENT }` en `Anamnesis.oralHygiene` (contrato y cliente regenerados). Opcional en el borrador, sin valor por defecto.
- Impresión: las cuatro opciones con casillas, como el resto de selecciones únicas.

### Primera menstruación con fecha
- `menarche` sigue siendo `YesNo` y se agrega `menarcheDate` (`LocalDate`, fecha calendario sin hora) en `Anamnesis`.
- `RecordNormalizer`: sin sexo femenino descarta `menarche` y `menarcheDate` (ya descarta `menarche`); con `menarche` distinto de `YES` descarta `menarcheDate`.
- Validación en el servidor, en el servicio y con el `Clock` de la app: `menarcheDate` no posterior a hoy y, si hay `birthDate`, no anterior a ella. Si falla: `400` con el error en `content.anamnesis.menarcheDate`. Los mismos límites van en Zod para mostrarlos antes de enviar.

### Diagnóstico cefalométrico
- `CephalometricAnalysis` pasa a `{STEINER, RICKETTS, MCNAMARA, WITS, TWEED, JARABAK}`: solo se agregan valores, las selecciones guardadas siguen siendo válidas.
- Sin mínimo en el servidor (es un borrador). El formulario muestra `n de 3`, permite más de tres y la sección cuenta como completa desde tres. La impresión lista las seis opciones; se verifica que entran en su hoja.

### Zona horaria de la app
- Hoy `ClockConfig` usa `Clock.systemDefaultZone()`. En Render el contenedor corre en **UTC**, así que en producción "hoy" cambia a las 19:00 de Lima. Afecta a esta validación, a la fecha de "impreso el" y a los meses del panel.
- Se corrige en este change: `app.time-zone` (por defecto `America/Lima`, variable `APP_TIME_ZONE`) y `Clock.system(ZoneId.of(…))`. Los tests ya usan `Clock.fixed` en `America/Lima`.

### Versión del contenido
- `RecordContent.CURRENT_SCHEMA_VERSION` pasa de 7 a **8**. V15 sube `schemaVersion` del contenido guardado igual que V10: `GREATEST(COALESCE((content->>'schemaVersion')::int, 1), 8)`.

### Migración (V15)
- Como los datos son de prueba, la migración deja la base coherente sin depender de una limpieza manual. En este orden:
  1. **Verificación previa**: si alguna historia tiene `id > 9999`, la migración falla con un mensaje explícito (bloque `DO` con `RAISE EXCEPTION`) antes de cambiar nada.
  2. **Números provisionales y búsqueda**, en un solo `UPDATE` (a la derecha se leen los valores anteriores):
     `record_number = 'AOC-' || lpad(id::text, 4, '0')` y `search_text = replace(search_text, lower(record_number), lower('AOC-' || lpad(id::text, 4, '0')))`. `search_text` guarda el número normalizado (`aeo-001`), que no tiene tildes, así que el reemplazo en minúsculas es exacto. Son números que el autor o el `ADMIN` corrigen.
  3. `ALTER TABLE orthodontic_records DROP CONSTRAINT ux_orthodontic_records_author_seq;` y `DROP COLUMN record_seq;`
  4. `ADD CONSTRAINT ck_orthodontic_records_record_number CHECK (record_number ~ '^AOC-[0-9]{4}$');` y `CREATE UNIQUE INDEX ux_orthodontic_records_record_number ON orthodontic_records (record_number);` (hoy no hay ningún índice sobre `record_number`).
  5. `content = content #- '{anamnesis,oralHygiene}' WHERE content->'anamnesis'->>'oralHygiene' IN ('YES', 'NO')`: el valor viejo no permite deducir una categoría y, si quedara, no se podría leer con el enum nuevo.
  6. `schemaVersion` del contenido a 8.
- Si el usuario prefiere vaciar las historias de Neon antes de desplegar, la migración también funciona sobre una tabla vacía.

## Risks

- **Número tomado por error de otro alumno**: el segundo recibe `409` y no puede usar su número hasta que se corrija el primero (lo hace su autor o el `ADMIN`, que lo encuentra buscándolo en el listado). Al corregirse, el número queda libre. El mensaje indica acudir a la coordinación.
- **Impresiones previas con el número anterior**: si se corrige el número después de imprimir, las hojas ya impresas muestran el anterior. Se reimprime.
- **Higiene oral de historias de prueba**: queda vacía tras la migración; se vuelve a seleccionar.
- **Capacidad del formato**: 9 999 números vigentes a la vez. Si se acercara al límite, ampliar el formato sería otro change.
