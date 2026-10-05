## Context

- La vista preliminar (`RecordPrintFeature`) carga la historia **guardada** y "Imprimir" llama a `window.print()`; Ctrl+P también imprime hoy. Con cambios sin guardar, "Vista previa" está deshabilitado en el formulario.
- `OrthodonticRecordService.update` guarda la historia completa con control de versión (`@Version`); el autoguardado y los guardados manuales pasan por ahí. `create` ya bloquea la fila del autor (`findByIdForUpdate`) para el cupo.
- Con el cupo inicial 1 (`update-default-record-quota`), reescribir la única historia para otro paciente e imprimirla es la forma de saltarse el cupo.
- Revisión externa (Codex): la vista en el navegador no puede garantizar que nadie imprima por fuera; la autoridad debe ser el servidor y la concurrencia debe estar definida.

## Goals / Non-Goals

**Goals:** que una historia no sirva para imprimir a varios pacientes; avance impreso permitido y distinguible; corrección controlada por el ADMIN con rastro.

**Non-Goals:** PDF generado en el servidor, impedir capturas o herramientas de desarrollador, limitar reimpresiones, historial de cambios de la historia, notificaciones.

## Decisions

### Datos fijos y forma canónica
- **Fijos**: `patientName`, `documentType`, `documentNumber`, `birthDate`, `patientSex`, `birthPlace` (no cambian en una persona). **Editables**: `address`, `phone`, `treatmentStartDate`, `treatingDentist` y `content`. La UI muestra el alcance en el aviso ("Fijos al imprimir: nombre, documento, fecha y lugar de nacimiento y sexo").
- `PatientIdentity` (servicio de records): record con la forma canónica de esos campos —texto: `Normalizer.NFKC`, luego `SearchNormalizer.normalize` (sin tildes, minúsculas, espacios colapsados); documento: tipo + solo dígitos; fecha y sexo tal cual—. Se compara `PatientIdentity.of(guardado)` con `PatientIdentity.of(normalizado entrante)`; distinto → `PatientLockedException` (`409 /errors/patient-locked`, solo `detail`). Corregir escritura (mayúsculas, tildes, espacios) pasa.

### Concurrencia
- `print`, `update`, `requestUnlock`, `discardUnlockRequest` y `unlock` cargan la historia con bloqueo de fila (`@Lock(PESSIMISTIC_WRITE)` en un `findWithAuthorByIdForUpdate`), así se serializan.
- `patient_locked_at`, `unlock_requested_at` y `unlock_request_reason` llevan `@OptimisticLock(excluded = true)`: imprimir, solicitar o desbloquear **no** cambian la versión, así el formulario abierto del tratante o del ADMIN no queda desactualizado (su autoguardado seguiría funcionando). La seguridad no depende de la versión sino del **bloqueo de fila**: `update` compara la identidad bajo el mismo bloqueo que `print`, así un guardado de otra pestaña o simultáneo nunca cambia datos fijados (→ `409 patient-locked`). Probado con impresión y guardado concurrentes. **Reimpresión**: no modifica la entidad (idempotente).
  - *Cambio respecto de la propuesta revisada*: la revisión pedía que la primera impresión subiera la versión; al implementarlo, eso dejaba desactualizado el formulario abierto tras solicitar o desbloquear. El bloqueo de fila cubre el mismo riesgo sin ese efecto.
- Solicitar/descartar/desbloquear son condicionales al estado leído bajo el bloqueo (fijada, pendiente o no), así dos solicitudes simultáneas dejan una sola y la otra recibe `409`.

### Registro de la impresión (servidor = autoridad)
- `POST /api/orthodontic-records/{id}/print` (`operationId: printRecord`; autor o ADMIN; ajena → `404`): cuerpo opcional `{ filledSteps }` (mismo formato y validación que al guardar). Si la historia no tiene `filled_steps` (anterior a las métricas), se guarda el enviado (el servidor agrega el paso 1). Fija `patient_locked_at` con el `Clock` si era nulo. Responde `200` `{ record: RecordResponse, printedOn: "2026-10-05", clinicalFilledSteps: 4 }` (`printedOn` = fecha en la zona del `Clock`; `clinicalFilledSteps` = bits 1–7 de `filled_steps`).
- La vista: `await printRecord(id, { filledSteps })` → guarda `printedOn`/`clinicalFilledSteps` para la marca → pone `data-print-ready` en el contenedor → `window.print()`; quita `data-print-ready` en `afterprint` **y** en un `setTimeout(0)` tras volver `window.print()` (bloqueante en los navegadores de escritorio) y al recuperar el foco, así nunca queda activo.
- CSS (en `PAGE_CSS`): `@media print { .print-sheets { display: none } [data-print-ready] .print-sheets { display: block } .print-guard-notice { display: block } [data-print-ready] .print-guard-notice { display: none } }`; en pantalla el aviso está oculto. **Por defecto oculto**: si el atributo nunca llegó (hidratación incompleta, Ctrl+P), no salen las hojas.
- **Riesgo residual documentado**: con herramientas de desarrollador o capturas se pueden obtener las hojas sin registrar; la mitigación de negocio es que la historia oficial lleva firmas sobre el papel.

### Marca de avance
- Usa `printedOn` y `clinicalFilledSteps` del registro (servidor), no el reloj ni el cálculo del navegador. `< 7` → `PrintPage` muestra la línea en el margen superior, en posición absoluta dentro del área sin contenido (no desplaza nada); `7` → sin marca. En pantalla, antes de imprimir, la vista muestra la marca con la fecha de hoy como vista previa de lo que saldrá.
- Verificación con Edge headless + PyMuPDF: misma cantidad de hojas, márgenes y posiciones con y sin marca.

### Desbloqueo, eventos y solicitudes
- Columnas en `orthodontic_records`: `patient_locked_at TIMESTAMPTZ NULL`, `unlock_requested_at TIMESTAMPTZ NULL`, `unlock_request_reason VARCHAR(200) NULL`; índice parcial `ix_orthodontic_records_unlock_pending ON orthodontic_records (unlock_requested_at) WHERE unlock_requested_at IS NOT NULL`.
- Tabla `record_unlock_events (id, record_id FK, admin_id FK users, action VARCHAR(20) CHECK IN ('UNLOCKED','DISCARDED'), reason VARCHAR(200) NULL, created_at TIMESTAMPTZ)`, solo inserción. Las cuentas no se borran en el sistema (solo se deshabilitan), así que las FK son `RESTRICT`.
- `DELETE /{id}/patient-lock` (`unlockPatient`, solo ADMIN): sin fijar → `409 patient-not-locked`; si no, `patient_locked_at` nulo, evento `UNLOCKED` con el motivo pendiente (si había) y se cierra la solicitud; `204`.
- `POST /{id}/unlock-request` (`requestPatientUnlock`, autor o ADMIN con acceso; ajena → `404`): `{ reason }` (`@NotBlank @Size(max=200)`); sin fijar → `409 patient-not-locked`; pendiente → `409 unlock-already-requested`; si no, guarda fecha y motivo; `204`.
- `DELETE /{id}/unlock-request` (`discardPatientUnlockRequest`, solo ADMIN): sin pendiente → `204` (idempotente, sin evento); si no, evento `DISCARDED` con el motivo y limpia; `204`.
- `RecordResponse`: `patientLockedAt` (nullable), `lastUnlock { byName, at }` (nullable; último evento `UNLOCKED`), `unlockRequest { requestedAt, reason }` (nullable). `RecordSummaryResponse.patientLocked` (boolean requerido).
- Cuentas deshabilitadas no inician sesión ni renuevan (`add-user-account-status`), así que no pueden imprimir ni solicitar; no requiere lógica extra.

### Frontend
- Datos fijos en `Step1Patient`: controles **de solo lectura** (`readOnly` en texto/fecha; selección única deshabilitada visualmente pero con su valor en el formulario vía `Controller`), nunca `disabled` del registro de RHF, para que `getValues` y el autoguardado los sigan enviando. Aviso `FieldHint` con el alcance y "Desbloqueada por X el dd/mm" si aplica.
- Tratante: "Solicitar desbloqueo" (`Dialog` con motivo) o "Desbloqueo solicitado el …". ADMIN: "Desbloquear datos del paciente" (confirmación) y, si hay solicitud, su motivo y "Descartar solicitud". `409 patient-locked` (otra pestaña) → mensaje y recarga.
- Candado (`Lock`, `aria-label`) en `RecordsTable`/`RecordsCardList`. `UnlockRequestsList` en `AdminDashboard` (hasta 10 + total). Desbloquear/descartar/solicitar invalida `recordKeys.detail`, `recordKeys.lists` y `dashboardKeys.all`.

## Risks / Trade-offs

- [Herramientas de desarrollador o capturas] → No se impide; documentado. La oficial requiere firmas.
- [Error de tipeo tras imprimir] → Solicitud y desbloqueo del ADMIN, con rastro.
- [ADMIN cómplice] → No se impide, pero cada desbloqueo queda registrado (quién, cuándo, motivo) para auditarlo.
- [Bloqueo de fila en cada guardado] → Las historias tienen un solo autor activo; la contención es mínima (como en `create`).
- [Cambio del alcance de "identidad"] → Sexo y lugar de nacimiento se fijan también (decisión tomada por revisión: no cambian en una persona); domicilio y teléfono quedan editables porque sí cambian.

## Migration Plan

V14 agrega columnas nullable, el índice parcial y la tabla de eventos; las historias existentes quedan desbloqueadas. Contrato y cliente en el mismo PR. Rollback: columnas y tabla se ignoran y el botón vuelve a imprimir sin registrar.

## Orden de implementación

1. Backend completo con sus IT en verde (bloqueo, concurrencia, forma canónica, eventos, solicitudes) **antes** del frontend.
2. Contrato y cliente.
3. Frontend (impresión → formulario → listado/Inicio) y verificación de impresión.
