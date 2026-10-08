## Why

Cuando la historia cambió en otro dispositivo u otra pestaña y hay cambios propios sin guardar, el aviso de historia cambiada ofrece "Recargar historia" (descarta lo escrito aquí) o "Seguir editando" para copiarlo. Pero no dice **qué** cambió: el usuario no sabe qué campos escribió aquí que se perderán, ni cuáles trae la otra versión, y copia a ciegas en un formulario de 8 pasos.

## What Changes

- El aviso de historia cambiada muestra **la lista de campos que difieren** entre el formulario y la versión del servidor, cada uno con:
  - su nombre y su paso;
  - de dónde viene la diferencia: **solo aquí** (se pierde al recargar), **en otro dispositivo** (llega al recargar) o **en ambos**;
  - el **valor actual en el servidor** (las opciones con su texto, vacío como "Vacío"); en las tablas de medidas, solo el nombre de la tabla;
  - un botón **"Ir al campo"** que abre su paso y le da el foco (en las tablas, "Ir al paso").
- Vale para los dos motivos del aviso:
  - **al volver desde otro dispositivo**: usa la versión que ya trajo la revisión;
  - **tras un `409` al guardar** (otra pestaña u otro usuario): una consulta de la historia para armar la lista. Si falla, el aviso sale como hoy, sin la lista.
- Las etiquetas de los controles del formulario pasan a un **mapa único** (ruta → etiqueta y formato); los pasos leen de ahí las etiquetas de sus controles, para que la lista y el formulario no se desalineen. No cubre encabezados, ayudas, títulos de paneles ni impresión.
- No se combina nada: recargar y seguir editando hacen lo mismo que hoy.
- Sin cambios de backend ni de contrato.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevo requisito "Detalle de lo que cambió en el aviso de historia cambiada".

## Impact

- Frontend:
  - `StaleRecordBanner` (lista de diferencias);
  - `RecordForm` (calcula la lista y la consulta tras el `409`);
  - utilidades puras en `records/utils` (clasificar diferencias y formatear valores);
  - `records/config/fieldLabels.ts` (mapa de etiquetas) y los pasos que lo usan.
- Sin cambios en backend, contrato ni base de datos.
- Docs: `docs/frontend.md` §4.1 (aviso de conflicto con detalle).
