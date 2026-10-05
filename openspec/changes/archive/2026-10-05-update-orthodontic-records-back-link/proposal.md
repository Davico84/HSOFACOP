## Why

Desde una historia clínica (edición o nueva) no hay forma visible de volver al listado: solo el menú lateral (oculto en celular) o el "atrás" del navegador, que recorre uno a uno los pasos visitados. Además, el menú lleva al listado limpio y se pierde la búsqueda y la página desde donde se abrió la historia.

## What Changes

- Enlace "← Historias clínicas" arriba a la izquierda, sobre el título, en la historia (edición y nueva). La navegación queda a la izquierda y las acciones ("Vista previa") a la derecha.
- El enlace vuelve al listado **con la búsqueda y la página** que tenía (`/historias?q=…&pagina=N`), aunque en medio se haya cambiado de paso, creado la historia o pasado por la vista previa. Sin un listado previo en la pestaña, vuelve a `/historias`.
- Con cambios sin guardar, el enlace pide la misma confirmación que cualquier salida (`LeaveConfirmDialog`).
- "Volver a las historias" de "Historia no encontrada" usa el mismo destino.
- El listado recordado se borra al cerrar sesión.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevo requisito "Volver al listado desde la historia".

## Impact

- Frontend `modules/records`: cabecera de `RecordForm`, `RecordNotFound`, `RecordsFeature` (recuerda su URL); nuevo componente `RecordsBackLink`.
- Estado de cliente: nuevo store Zustand `src/store/useRecordsListStore.ts` (`sessionStorage`), limpiado en el cierre de sesión (`useAuth`).
- Sin cambios de backend, contrato ni base de datos.
- Guías: `docs/frontend.md` (patrón de navegación de vuelta).

## Non-goals

- Migas de pan completas (breadcrumbs de varios niveles) o un patrón general para todas las pantallas.
- Cambiar el "Volver" de la vista previa de impresión (ya regresa a donde se abrió).
- Recordar el listado entre pestañas o entre sesiones del navegador.
