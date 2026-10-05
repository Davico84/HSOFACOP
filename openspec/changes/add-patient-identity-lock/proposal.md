## Why

El cupo limita **historias**, no **pacientes**: con cupo 1 (el inicial de toda cuenta nueva), un tratante puede crear su única historia, llenarla con el paciente A e imprimirla, luego reescribirla con el paciente B, imprimirla, y repetir sin límite. La historia impresa y firmada es la oficial, así que esto permitiría obtener historias de muchos pacientes con una sola.

Hoy la vista previa solo imprime lo **guardado** en el servidor (con cambios sin guardar está deshabilitada): para imprimir al paciente B hay que guardar sus datos sobre los de A. Ese guardado es el punto de control.

## What Changes

- **La identidad del paciente queda fija tras la primera impresión**, esté la ficha completa o no (a veces se pide el avance impreso): nombre, tipo y número de documento y fecha de nacimiento no se pueden cambiar después de imprimir la historia por primera vez. El contenido clínico, los demás datos del paciente (domicilio, teléfono, etc.) y la impresión siguen libres: la historia se completa y corrige en varias sesiones y se puede reimprimir.
- **Antes de imprimir**, el tratante corrige esos datos libremente.
- **El servidor registra la impresión** (`patient_locked_at`, migración **V14**) y rechaza con `409` cualquier guardado que cambie la identidad fijada. En el formulario, esos campos aparecen bloqueados con un aviso.
- **Imprimir solo con el botón "Imprimir"**: el botón avisa al servidor antes de abrir el diálogo de impresión. Imprimir la vista previa por el menú del navegador (Ctrl+P) no sale hasta usar el botón; así ninguna impresión escapa al registro.
- **Marca de avance**: si la ficha no está completa (los 7 pasos clínicos con datos), cada hoja impresa lleva "AVANCE · N de 7 pasos clínicos con datos · impreso el <fecha>"; la ficha completa se imprime limpia. Un avance no puede pasar por historia terminada.
- **El ADMIN puede desbloquear** la identidad de una historia (p. ej. un error de tipeo detectado después de imprimir); se vuelve a fijar en la siguiente impresión.
- **Candado en el listado**: las historias con la identidad fijada muestran un candado (tabla y tarjetas), para el tratante y el ADMIN.
- **Registro del desbloqueo**: se guarda el último desbloqueo (qué ADMIN y cuándo) y se muestra junto al aviso ("Desbloqueada por X el dd/mm/aaaa").
- **Solicitar el desbloqueo**: el tratante pide el desbloqueo desde la historia, con un motivo breve; el ADMIN ve las solicitudes pendientes en su Inicio y las resuelve (desbloquear o descartar).
- Las historias impresas antes de este cambio quedan desbloqueadas hasta su próxima impresión.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevos requisitos "Identidad del paciente fija tras imprimir", "Imprimir solo con el botón Imprimir", "Marca de avance en impresiones incompletas", "Candado de identidad en el listado", "Registro del último desbloqueo" y "Solicitud de desbloqueo".
- `dashboard`: nuevo requisito "Solicitudes de desbloqueo en Inicio del ADMIN".

## Impact

- Backend: `V14__record_patient_lock.sql` (`patient_locked_at`, `patient_unlocked_at`, `patient_unlocked_by`, `unlock_requested_at`, `unlock_request_reason`); `POST /{id}/print` (registra la impresión: fija la identidad si no lo estaba); `DELETE /{id}/patient-lock` (solo ADMIN, registra quién y cuándo); `POST /{id}/unlock-request` (autor, con la identidad fijada); `DELETE /{id}/unlock-request` (solo ADMIN, descartar); `update` rechaza cambios de identidad fijada con `409 /errors/patient-locked`; `RecordResponse` (fijada, último desbloqueo, solicitud pendiente) y `RecordSummaryResponse.patientLocked`; `GET /api/dashboard/admin` suma las solicitudes pendientes.
- Contrato y cliente regenerados.
- Frontend: botón "Imprimir" llama al servidor antes de `window.print()`; CSS de impresión que oculta las hojas si no se imprimió por el botón; marca de avance; campos de identidad deshabilitados con aviso (y último desbloqueo); "Solicitar desbloqueo" para el tratante y "Desbloquear paciente" / "Descartar solicitud" para el ADMIN; candado en el listado; solicitudes pendientes en Inicio del ADMIN.
- Guías: `docs/domain.md` (regla de identidad fija).

## Non-goals

- Impedir capturas de pantalla de la vista previa: no se puede bloquear técnicamente; la historia oficial lleva firma sobre el papel.
- Exigir la ficha completa para imprimir (el avance impreso es un uso legítimo).
- Limitar la cantidad de reimpresiones o numerarlas en la hoja.
- Fijar otros datos (domicilio, teléfono, contenido clínico).
- Historial de cambios ni de todos los desbloqueos (solo se guarda el último; descartado: la oficial es la impresa y firmada).
- Notificaciones (correo, push) de solicitudes: el ADMIN las ve al entrar a Inicio.
