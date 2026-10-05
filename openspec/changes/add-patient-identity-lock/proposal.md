## Why

El cupo limita **historias**, no **pacientes**: con cupo 1 (el inicial de toda cuenta nueva), un tratante puede crear su única historia, llenarla con el paciente A e imprimirla, luego reescribirla con el paciente B, imprimirla, y repetir sin límite. La historia impresa y firmada es la oficial, así que esto permitiría obtener historias de muchos pacientes con una sola.

La vista previa solo muestra lo **guardado** en el servidor: para imprimir al paciente B hay que guardar sus datos sobre los de A. Ese guardado es el punto de control.

## What Changes

- **Datos fijos del paciente tras la primera impresión** (completa o avance, que a veces se pide impreso): nombre, tipo y número de documento, fecha de nacimiento, sexo y lugar de nacimiento —datos que no cambian en una persona— no se pueden cambiar después. Siguen editables lo que sí cambia (domicilio, teléfono, fecha de inicio de tratamiento) y todo el contenido clínico; la historia se reimprime cuantas veces haga falta. La comparación usa una forma canónica (sin mayúsculas, tildes ni espacios sobrantes): corregir "ana quispe" a "Ana Quispe" se permite; otro nombre, no.
- **El servidor es la autoridad de la impresión**: `POST /print` registra la impresión (fija los datos la primera vez) y devuelve fecha y avance calculados en el servidor. La vista solo muestra las hojas al imprimir después de ese registro; imprimir por el menú del navegador (Ctrl+P) saca un aviso. No es una garantía contra herramientas de desarrollador o capturas de pantalla (riesgo residual documentado; la oficial lleva firmas sobre el papel).
- **Marca de avance**: si la ficha no está completa (7 pasos clínicos con datos), cada hoja lleva "AVANCE · N de 7 pasos clínicos con datos · impreso el <fecha>", con fecha y conteo del servidor; la completa sale limpia.
- **Desbloqueo del ADMIN** con **registro de eventos** (quién, cuándo, acción, motivo): todos los desbloqueos y descartes quedan registrados; la historia muestra el último.
- **Solicitud de desbloqueo** del tratante con motivo; el ADMIN la ve en su Inicio y desbloquea o descarta.
- **Candado** en el listado para historias con los datos fijos.
- Concurrencia definida: imprimir, guardar, solicitar, descartar y desbloquear bloquean la fila de la historia.
- Historias impresas antes de este cambio: desbloqueadas hasta su próxima impresión.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevos requisitos "Datos del paciente fijos tras imprimir", "Impresión registrada en el servidor", "Marca de avance en impresiones incompletas", "Desbloqueo con registro de eventos", "Solicitud de desbloqueo" y "Candado en el listado".
- `dashboard`: nuevo requisito "Solicitudes de desbloqueo en Inicio del ADMIN".

## Impact

- Backend: `V14__record_patient_lock.sql` (columnas `patient_locked_at`, `unlock_requested_at`, `unlock_request_reason` con índice parcial de pendientes; tabla `record_unlock_events`); `PatientIdentity` (forma canónica); endpoints `printRecord`, `unlockPatient`, `requestPatientUnlock`, `discardPatientUnlockRequest`; `update` rechaza cambios de datos fijos (`409 patient-locked`); `RecordResponse`/`RecordSummaryResponse` ampliados; `GET /api/dashboard/admin` con solicitudes.
- Contrato y cliente regenerados.
- Frontend: vista preliminar (registro, hojas ocultas por defecto al imprimir, marca de avance del servidor), formulario (campos fijos de solo lectura con aviso, solicitar/desbloquear/descartar), candado en el listado, solicitudes en Inicio del ADMIN.
- Guías: `docs/domain.md` (datos fijos, eventos de desbloqueo).

## Non-goals

- Garantizar que nadie pueda imprimir las hojas por fuera de la app (herramientas de desarrollador, capturas): no es posible con una vista en el navegador; un PDF generado en el servidor quedaría para un cambio aparte si hiciera falta.
- Exigir la ficha completa para imprimir (el avance impreso es legítimo).
- Limitar reimpresiones.
- Historial de cambios de la historia (solo se registran los eventos de desbloqueo).
- Notificaciones (correo, push) de solicitudes.
