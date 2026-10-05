## Why

El sistema existe para llenar la historia con agilidad desde celular, tablet o PC y **seguir donde se dejó**. Hoy lo escrito en el paso actual solo se guarda al cambiar de paso o al pulsar "Guardar": en celular y tablet, cambiar de app, bloquear la pantalla o quedarse sin batería puede cerrar la pestaña sin aviso (Safari en iOS ignora el aviso de salida) y se pierde ese trabajo, que en el paso 5 son decenas de medidas. Además, al volver a abrir una historia, en otro dispositivo o en el mismo, siempre empieza en el paso 1.

## What Changes

- **Autoguardado** en historias ya creadas: con cambios pendientes, se guarda solo unos segundos después de dejar de escribir y al ocultarse la pestaña (cambiar de app o bloquear la pantalla). Un indicador junto al título dice el estado: "Guardando…", "Guardado", "Sin guardar: corrige los campos marcados" o "No se pudo guardar" con reintento.
- Lo que se escribe mientras un guardado está en curso **no se pisa** con la respuesta del servidor.
- El autoguardado no muestra toasts; cambiar de paso y "Guardar" siguen guardando al instante como hoy.
- **Retomar en el último paso**: la historia recuerda en el servidor el último paso en que se guardaron cambios y se abre ahí desde el listado (tabla y tarjetas), en cualquier dispositivo. Un `?paso=` explícito sigue mandando.
- Backend: columna `last_step` (migración V12), campo opcional `lastStep` (1–8) en el guardado y `lastStep` en la respuesta de la historia. Contrato y cliente regenerados.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevos requisitos "Autoguardado del paso en curso" y "Retomar en el último paso trabajado".

## Impact

- Backend `orthodontic-records`: `V12__record_last_step.sql`, entidad, `UpdateRecordRequest`, `RecordResponse`, servicio; tests de controller e IT.
- Contrato `contracts/openapi.json` y cliente generado.
- Frontend `modules/records`: `RecordForm` (autoguardado e indicador), nuevo hook `useAutosave`, `RecordFormFeature` (paso inicial), enlaces del listado (`RecordEditLink`, tabla y tarjetas).
- Guías: `docs/frontend.md` (patrón de autoguardado).

## Non-goals

- Autoguardar una historia **nueva** antes de crearla: se sigue creando con "Crear historia" (lo exige el cupo y el número correlativo).
- Trabajo sin conexión (cola local, PWA): si no hay red, se avisa y se reintenta al volver la conexión, pero lo escrito vive en la pestaña.
- Historial de versiones o deshacer: la historia oficial es la impresa y firmada; un error se corrige editando.
- Edición simultánea en dos dispositivos: sigue el control de versión actual (409 y aviso para recargar).
