## Context

- Hoy el número visible se genera por autor (`AEO-001`) a partir de `record_seq`, es único por autor y no se edita (`OrthodonticRecordService.create`, `findMaxSeq…`).
- El contenido clínico está tipado en Java (`RecordContent` → `Anamnesis`, `RadiographicAnalysis`) y se guarda como JSONB. `Anamnesis.oralHygiene` es `YesNo` y `menarche` es `YesNo`. `RecordNormalizer` ya descarta `menarche` si el sexo no es femenino. `RadiographicAnalysis.CephalometricAnalysis` es `{STEINER, RICKETTS, MCNAMARA, WITS}`.
- El autoguardado (`useAutosave` + `RecordForm`) se pausa tras un `409` de edición concurrente (`/errors/stale-record`). Otros `409` (`/errors/patient-locked`) se avisan sin pausar.
- Los datos del paciente se fijan tras la primera impresión (`patient_locked_at`); el número no forma parte de esa identidad.
- Entorno en fase de prueba: las historias de Neon y de las bases locales se pueden descartar.

## Decisions

### Número de historia manual
- **Formato**: `AOC-` + exactamente cuatro dígitos (`^AOC-[0-9]{4}$`), validado en el DTO (`@Pattern`), en el schema Zod y con un `CHECK` en la base.
- **Unicidad global y permanente**: índice único sobre `record_number` en toda la tabla. Los docentes no reinician la numeración entre cohortes, así que un número nunca se reutiliza. La carrera entre dos guardados se resuelve con el índice: la violación se traduce a `RecordNumberTakenException` → `409` con `type` `/errors/record-number-taken`.
  - El mensaje no revela de quién es la historia que tiene el número (privacidad entre alumnos). La coordinación lo resuelve buscando el número en el listado, donde el `ADMIN` ve todas las historias con su autor.
- **Quién lo edita**: quien puede editar la historia, es decir, su autor o un `ADMIN` (un `USER` ajeno ni siquiera la ve: `404`). Se edita en el paso 1 con el mismo guardado (`PUT`), también después de imprimir. No hay regla extra de permisos.
- **Creación**: "Nueva historia" pide nombre del paciente y número antes de crear (`POST` con `recordNumber`). Se elimina la asignación automática.
- **`record_seq` se elimina** (columna, restricción y consulta del máximo). El identificador técnico es solo `id`.

### Número duplicado y autoguardado
- El `409` `/errors/record-number-taken` se muestra junto al campo del número (error del formulario), conserva lo escrito y **no** pausa el autoguardado. Ese queda solo para `/errors/stale-record`.
- Un número con formato inválido no llega al servidor: Zod lo marca y el autoguardado ya devuelve `invalid` sin enviar.

### Higiene oral por categorías
- Nuevo enum `OralHygiene { EXCELLENT, GOOD, REGULAR, DEFICIENT }` en `Anamnesis.oralHygiene` (contrato y cliente regenerados). Opcional en el borrador, sin valor por defecto.
- Impresión: las cuatro opciones con casillas, como el resto de selecciones únicas.

### Primera menstruación con fecha
- `menarche` sigue siendo `YesNo` y se agrega `menarcheDate` (`LocalDate`, fecha calendario sin hora) en `Anamnesis`.
- `RecordNormalizer`: sin sexo femenino descarta `menarche` y `menarcheDate` (ya descarta `menarche`); con `menarche` distinto de `YES` descarta `menarcheDate`.
- Validación en el servidor, en el servicio y con el `Clock` de la app (zona America/Lima): `menarcheDate` no posterior a hoy y, si hay `birthDate`, no anterior a ella. Si falla: `400` con el error en `content.anamnesis.menarcheDate`. Los mismos límites van en Zod para mostrarlos antes de enviar.

### Diagnóstico cefalométrico
- `CephalometricAnalysis` pasa a `{STEINER, RICKETTS, MCNAMARA, WITS, TWEED, JARABAK}`: solo se agregan valores, las selecciones guardadas siguen siendo válidas.
- Sin mínimo en el servidor (es un borrador). El formulario muestra `n de 3`, permite más de tres y la sección cuenta como completa desde tres. La impresión lista las seis opciones; se verifica que entran en su hoja.

### Migración (V15)
- Como los datos son de prueba, la migración deja la base coherente sin depender de una limpieza manual:
  1. `record_number = 'AOC-' || lpad(id::text, 4, '0')` para las historias existentes (únicos porque `id` es único; la migración falla explícitamente si algún `id` supera 9999). Son números provisionales que el autor o el `ADMIN` corrigen.
  2. Elimina `record_seq` y su restricción de unicidad por autor.
  3. Agrega `CHECK (record_number ~ '^AOC-[0-9]{4}$')` y el índice único global sobre `record_number`.
  4. Quita `anamnesis.oralHygiene` del contenido (`content #- '{anamnesis,oralHygiene}'`) cuando valga `YES` o `NO`: el valor viejo no permite deducir una categoría y, si quedara, no se podría leer con el enum nuevo.
- Si el usuario prefiere vaciar las historias de Neon antes de desplegar, la migración también funciona sobre una tabla vacía.

## Risks

- **Número tomado por error de otro alumno**: el segundo recibe `409` y no puede usar su número hasta que la coordinación corrija el primero. Es el comportamiento buscado (no se duplica nunca); el mensaje indica acudir a la coordinación.
- **Impresiones previas con el número anterior**: si se corrige el número después de imprimir, las hojas ya impresas muestran el anterior. Se reimprime.
- **Higiene oral de historias de prueba**: queda vacía tras la migración; se vuelve a seleccionar.
- **Capacidad del formato**: 9 999 números en total, sin reutilización. Si se acercara al límite, ampliar el formato sería otro change.
