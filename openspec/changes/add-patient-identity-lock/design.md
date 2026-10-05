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

### Rechazo de cambios de identidad
- En `update`, si `patient_locked_at` no es nulo y alguno de los 4 campos normalizados difiere del guardado → `PatientLockedException` (`BusinessException`, `409`, tipo `patient-locked`, solo `detail`, como el cupo). Se compara **después** de normalizar, así un espacio sobrante no dispara el 409.
- El ADMIN también está sujeto al bloqueo: corrige desbloqueando explícitamente (deja rastro en `patient_locked_at` = nulo hasta reimprimir).

### Desbloqueo (ADMIN)
- `DELETE /api/orthodontic-records/{id}/patient-lock` (`@PreAuthorize("hasRole('ADMIN')")`): pone `patient_locked_at` en nulo; `204`. Historia inexistente → `404`.
- UI: en el formulario, para el ADMIN y con la identidad fijada, botón "Desbloquear paciente" junto al aviso (con confirmación).

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
