## Context

- La vista preliminar (`RecordPrintFeature`) carga la historia **guardada** (`GET /api/orthodontic-records/{id}`) y el botón "Imprimir" llama a `window.print()`. Con cambios sin guardar, "Vista previa" está deshabilitado en el formulario. Imprimir con Ctrl+P sobre la vista también funciona hoy.
- `OrthodonticRecordService.update` guarda la historia completa con control de versión; el autoguardado y los guardados manuales pasan por ahí.
- Con el cupo inicial 1 (`update-default-record-quota`), reescribir la única historia para otro paciente e imprimirla es la forma de saltarse el cupo.

## Goals / Non-Goals

**Goals:** que una historia no sirva para imprimir a varios pacientes, sin estorbar la corrección y reimpresión normales de un mismo paciente.

**Non-Goals:** bloquear capturas de pantalla, limitar reimpresiones, historial de cambios, fijar datos no identificatorios.

## Decisions

### Qué se fija y cuándo
- **Identidad** = `patientName`, `documentType`, `documentNumber`, `birthDate` (normalizados como al guardar: sin espacios sobrantes). El sexo, domicilio, teléfono, lugar de nacimiento, fecha de inicio y el contenido clínico quedan libres.
- **Cuándo**: en la primera impresión registrada. Columna `patient_locked_at TIMESTAMPTZ NULL` (V14); nula = desbloqueada (también las historias impresas antes de este cambio).

### Registro de la impresión
- `POST /api/orthodontic-records/{id}/print` (autor o ADMIN; ajena → `404`, como `get`): si `patient_locked_at` es nulo lo fija con el `Clock`; si ya estaba, no cambia nada (idempotente). Responde `200` con la historia (`RecordResponse`, ahora con `patientLockedAt`). No incrementa `version` si ya estaba fijada; si la fija, es una escritura normal (la vista la recarga).
- El botón "Imprimir": `await printRecord(id)` → si responde bien, `window.print()`; si falla, toast con el error y "Reintentar", sin diálogo.

### Ctrl+P no imprime sin registrar
- La vista agrega al contenedor de hojas un atributo `data-print-ready` **solo** mientras el botón abre el diálogo (se pone tras el `POST` y se quita en `afterprint`).
- CSS de impresión (en `PAGE_CSS`): `@media print { [data-print-guard]:not([data-print-ready]) .print-sheets { display: none } [data-print-guard]:not([data-print-ready]) .print-guard-notice { display: block } }`; el aviso "Usa el botón Imprimir de la vista preliminar." está oculto en pantalla y al imprimir con el botón.
  - *Por qué CSS y no interceptar `beforeprint`*: `beforeprint` no puede cancelar la impresión ni esperar al servidor; el CSS decide qué sale en el papel de forma síncrona.

### Marca de avance
- La vista preliminar calcula los pasos clínicos con datos de la historia **guardada** con la misma función del formulario (`filledStepsOf(toFormValues(record))`, pasos 1–7); no depende de `filled_steps` del servidor (puede estar "sin calcular" en historias viejas).
- Incompleta (< 7) → `PrintPage` muestra en el margen superior, posicionada en absoluto dentro del área sin contenido de la hoja, una línea pequeña: "AVANCE · N de 7 pasos clínicos con datos · impreso el dd/mm/aaaa" (fecha local del momento de la vista). Al ser absoluta, no desplaza renglones ni logos: se verifica con Edge headless + PyMuPDF que una impresión con marca y otra sin marca tienen las mismas hojas y posiciones.
- Completa → sin marca. La marca también se ve en la vista previa en pantalla (es lo que saldrá).

### Rechazo de cambios de identidad
- En `update`, si `patient_locked_at` no es nulo y alguno de los 4 campos normalizados difiere del guardado → `PatientLockedException` (`BusinessException`, `409`, tipo `patient-locked`, solo `detail`, como el cupo). Se compara **después** de normalizar, así un espacio sobrante no dispara el 409.
- El ADMIN también está sujeto al bloqueo: corrige desbloqueando explícitamente (deja rastro en `patient_locked_at` = nulo hasta reimprimir).

### Desbloqueo (ADMIN) y su registro
- `DELETE /api/orthodontic-records/{id}/patient-lock` (`@PreAuthorize("hasRole('ADMIN')")`): pone `patient_locked_at` en nulo, guarda `patient_unlocked_at` (`Clock`) y `patient_unlocked_by` (FK `users`, el actor) y cierra la solicitud pendiente (`unlock_requested_at`/`unlock_request_reason` en nulo); `204`. Historia inexistente → `404`. Sin la identidad fijada → `409` (nada que desbloquear).
- Solo el **último** desbloqueo (columnas en la historia, sin tabla de historial): suficiente para ver quién y cuándo sin introducir auditoría completa.
- `RecordResponse`: `patientLockedAt`, `lastUnlock { byName, at }` (nulo si nunca) y `unlockRequest { requestedAt, reason }` (nulo si no hay).
- UI: en el formulario, junto al aviso de identidad fija: para el ADMIN, "Desbloquear paciente" (con confirmación) y, si hay solicitud, su motivo y "Descartar solicitud"; para todos, "Desbloqueada por X el dd/mm/aaaa" si hubo un desbloqueo.

### Solicitud de desbloqueo
- Columnas en la historia: `unlock_requested_at TIMESTAMPTZ NULL`, `unlock_request_reason VARCHAR(200) NULL` (una sola solicitud pendiente por historia; no hace falta tabla aparte).
- `POST /{id}/unlock-request` (autor o ADMIN con acceso; ajena → `404`): cuerpo `{ reason }` (`@NotBlank @Size(max=200)`); identidad no fijada → `409 /errors/patient-not-locked`; solicitud ya pendiente → `409 /errors/unlock-already-requested`; si no, guarda fecha y motivo; `204`.
- `DELETE /{id}/unlock-request` (solo ADMIN): descarta (pone ambos en nulo); `204`; sin solicitud → `204` igual (idempotente).
- UI tratante: con la identidad fijada y sin solicitud, "Solicitar desbloqueo" abre un `Dialog` con el motivo; con solicitud, texto "Desbloqueo solicitado el dd/mm/aaaa" sin botón.

### Candado en el listado
- `RecordSummaryResponse.patientLocked` (boolean, `patient_locked_at IS NOT NULL`), sin consultas extra (es columna de la misma fila).
- Tabla y tarjetas: ícono `Lock` con `aria-label="Identidad del paciente fija"` junto al número; con `Tooltip` en escritorio.

### Solicitudes en Inicio del ADMIN
- `GET /api/dashboard/admin` suma `unlockRequests: { total, items: [{ recordId, recordNumber, patientName, authorName, requestedAt, reason }] }`, hasta 10 de la más antigua a la más nueva (`ORDER BY unlock_requested_at ASC, id ASC`), con el mismo patrón que `quotas`.
- `AdminDashboard` agrega `UnlockRequestsList` (un componente por archivo): cada fila enlaza a `recordPath(id, 1)`; vacío → "No hay solicitudes de desbloqueo". Desbloquear/descartar invalida `dashboardKeys.all` y el detalle de la historia.

### Frontend del formulario
- Con `record.patientLockedAt`, los campos de identidad del paso 1 se renderizan `disabled` con un `FieldHint` ("Fijado al imprimir la historia el <fecha>. Pide al administrador que lo desbloquee para corregirlo."). Como están deshabilitados, el autoguardado nunca envía cambios en ellos.
- Si igual llega un `409 patient-locked` (p. ej. otra pestaña desactualizada), se muestra el mensaje y se recarga la historia.

## Risks / Trade-offs

- [Capturas de pantalla de la vista previa] → No se pueden impedir; se documenta. La historia oficial requiere firmas sobre el papel.
- [Un tratante imprime con un error de tipeo] → El ADMIN desbloquea; es un paso extra deliberado.
- [Navegadores que ignoran el CSS de impresión] → Todos los navegadores soportados respetan `@media print`; se verifica con Edge headless (imprimir sin `data-print-ready` → solo el aviso).
- [Reimpresión de la misma historia en otra sesión] → El `POST` es idempotente: reimprimir no cambia nada.

## Migration Plan

V14 agrega `patient_locked_at` nullable; las historias existentes quedan desbloqueadas. Contrato y cliente regenerados en el mismo PR. Rollback: la columna se ignora y el botón vuelve a imprimir sin registrar.
