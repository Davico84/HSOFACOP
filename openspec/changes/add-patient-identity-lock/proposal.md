## Why

El cupo limita **historias**, no **pacientes**: con cupo 1 (el inicial de toda cuenta nueva), un tratante puede crear su única historia, llenarla con el paciente A e imprimirla, luego reescribirla con el paciente B, imprimirla, y repetir sin límite. La historia impresa y firmada es la oficial, así que esto permitiría obtener historias de muchos pacientes con una sola.

Hoy la vista previa solo imprime lo **guardado** en el servidor (con cambios sin guardar está deshabilitada): para imprimir al paciente B hay que guardar sus datos sobre los de A. Ese guardado es el punto de control.

## What Changes

- **La identidad del paciente queda fija tras la primera impresión**: nombre, tipo y número de documento y fecha de nacimiento no se pueden cambiar después de imprimir la historia por primera vez. El contenido clínico, los demás datos del paciente (domicilio, teléfono, etc.) y la impresión siguen libres: la historia se completa y corrige en varias sesiones y se puede reimprimir.
- **Antes de imprimir**, el tratante corrige esos datos libremente.
- **El servidor registra la impresión** (`patient_locked_at`, migración **V14**) y rechaza con `409` cualquier guardado que cambie la identidad fijada. En el formulario, esos campos aparecen bloqueados con un aviso.
- **Imprimir solo con el botón "Imprimir"**: el botón avisa al servidor antes de abrir el diálogo de impresión. Imprimir la vista previa por el menú del navegador (Ctrl+P) no sale hasta usar el botón; así ninguna impresión escapa al registro.
- **El ADMIN puede desbloquear** la identidad de una historia (p. ej. un error de tipeo detectado después de imprimir); se vuelve a fijar en la siguiente impresión.
- Las historias impresas antes de este cambio quedan desbloqueadas hasta su próxima impresión.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevos requisitos "Identidad del paciente fija tras imprimir" e "Imprimir solo con el botón Imprimir".

## Impact

- Backend: `V14__record_patient_lock.sql` (`patient_locked_at TIMESTAMPTZ NULL`); `POST /api/orthodontic-records/{id}/print` (registra la impresión: fija la identidad si no lo estaba); `DELETE /api/orthodontic-records/{id}/patient-lock` (solo ADMIN); `update` rechaza cambios de identidad fijada con `409 /errors/patient-locked`; `RecordResponse.patientLockedAt`.
- Contrato y cliente regenerados.
- Frontend: botón "Imprimir" llama al servidor antes de `window.print()`; CSS de impresión que oculta las hojas si no se imprimió por el botón; campos de identidad deshabilitados con aviso cuando están fijados; acción "Desbloquear paciente" para el ADMIN.
- Guías: `docs/domain.md` (regla de identidad fija).

## Non-goals

- Impedir capturas de pantalla de la vista previa: no se puede bloquear técnicamente; la historia oficial lleva firma sobre el papel.
- Limitar la cantidad de reimpresiones o numerarlas en la hoja.
- Fijar otros datos (domicilio, teléfono, contenido clínico).
- Historial de cambios (descartado: la oficial es la impresa y firmada).
