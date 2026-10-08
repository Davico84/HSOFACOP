## Context

- `useRecord` carga la historia con `refetchOnWindowFocus: false` a propósito: el formulario es la **copia de trabajo** y no debe reemplazarse sola mientras se edita.
- `RecordForm` guarda la versión de la última respuesta en `version.current`. Todos los guardados (autoguardado, "Guardar", cambio de paso) pasan por una cola (`queue`). Un `409 /errors/stale-record` muestra `StaleRecordBanner` (recargar o seguir editando) y pausa el autoguardado (`stalePaused`).
- `RecordFormFeature.reload()` vuelve a pedir la historia y remonta el formulario con ella (clave `generation`). Es lo que hace "Recargar historia".
- El autoguardado ya guarda de inmediato cuando la pestaña deja de estar visible (`visibilitychange`/`pagehide`). Al irse al celular, lo escrito en la PC ya quedó guardado.
- El listado y el Inicio usan las opciones por defecto de React Query: ya se actualizan al volver a la pestaña. Solo falta el formulario.

## Goals / Non-Goals

**Goals:** que al volver a una historia abierta se vea lo guardado desde otro dispositivo, sin pisar nunca lo escrito en este.

**Non-Goals:**
- actualización en tiempo real con ambos dispositivos a la vista (WebSocket o eventos del servidor);
- consultas periódicas;
- fusionar automáticamente cambios de dos dispositivos;
- la vista de impresión, que ya pide la historia al abrirse.

## Decisions

### Cuándo se revisa
- Al volver la pestaña a visible (`visibilitychange` → `visible`) y al recibir la ventana el foco (`focus`, para quien alterna ventanas sin ocultar la pestaña).
- No más de una revisión cada 5 s: los dos eventos suelen llegar juntos.
- Solo en una historia existente, sin el aviso de historia cambiada ya visible y sin una revisión en curso.
- Sin intervalos: con la pestaña oculta no se consulta (la base puede dormir) y no se gasta red en el celular.
- Hook genérico de eventos de la ventana en `modules/core/hooks` (`useWindowReturn(callback, { minIntervalMs })`); la lógica de la historia vive en `RecordForm`.

### Qué se revisa
- `getRecord(id)` (la lectura que ya existe) y se compara `version` del servidor con `version.current`. No hace falta un endpoint nuevo: la historia es chica y la consulta solo ocurre al volver.
- La revisión **se encola con los guardados** (la misma `queue`). Si un autoguardado está en curso al volver, la revisión espera su respuesta y compara contra la versión que ese guardado devolvió. Así un guardado propio no se confunde con uno de otro dispositivo.

### Qué se hace
- **Misma versión**: nada.
- **Versión mayor y sin cambios locales** (`!isDirty`): se recarga como "Recargar historia" (actualizar la caché de la consulta y remontar el formulario), en el mismo paso de la URL. Junto al título aparece un aviso en una región `status` (`aria-live="polite"`): "Actualizada con cambios hechos en otro dispositivo", hasta el siguiente cambio. No es una notificación emergente, en línea con la regla del autoguardado.
- **Versión mayor y con cambios locales**: se muestra `StaleRecordBanner` y se pausa el autoguardado (`stalePaused`), exactamente como tras un `409`. El usuario decide: recargar (descarta lo suyo) o seguir editando para copiar lo escrito.
- **Error de red al revisar**: se ignora en silencio (la próxima vuelta lo intenta de nuevo; un guardado posterior seguiría protegido por el `409`). Un `404` (la historia dejó de estar al alcance) se trata como hoy al cargar.

### Recarga sin cambios locales
- `RecordFormFeature` expone la recarga como hoy (`onReload`) y `RecordForm` la llama con un indicador `fromOtherDevice`. El aviso se guarda en el estado de `RecordFormFeature`, porque el formulario se remonta, y se borra con el primer cambio.

## Risks / Trade-offs

- **Ambos dispositivos a la vista a la vez** (la PC sin perder el foco): no se actualiza hasta interactuar con otra ventana o volver a la pestaña. Se acepta. Si hiciera falta, se suma una revisión periódica pausada por inactividad en otro change.
- **Un cambio desde otro dispositivo justo al volver**, mientras se escribe en la PC: lo cubre el `409` del guardado, como hoy.
- **Remontar el formulario** reinicia estados locales del paso (por ejemplo, un acordeón abierto). Es aceptable al traer datos nuevos.
