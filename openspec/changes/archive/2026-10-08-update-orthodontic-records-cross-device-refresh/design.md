## Context

- `useRecord` carga la historia con `refetchOnWindowFocus: false` a propósito: el formulario es la **copia de trabajo** y no debe reemplazarse sola mientras se edita.
- `RecordForm`:
  - guarda la versión de la última respuesta en `version.current`;
  - pasa todos los guardados (autoguardado, "Guardar", cambio de paso) por una cola (`queue`);
  - ante un `409 /errors/stale-record`, muestra `StaleRecordBanner` (recargar o seguir editando) y pausa el autoguardado (`stalePaused`).
- `RecordFormFeature.reload()` vuelve a pedir la historia y remonta el formulario con ella (clave `generation`). Es lo que hace "Recargar historia".
- El autoguardado guarda de inmediato cuando la pestaña deja de estar visible (`visibilitychange`/`pagehide`).
- **Cambios que no suben `version`** (`add-patient-identity-lock`): registrar una impresión fija los datos del paciente (`patientLockedAt`), y solicitar, desbloquear o descartar cambian `unlockRequest` y `lastUnlock`. Los campos del formulario quedan intactos, pero cambia lo que muestra el paso 1 (datos de solo lectura, aviso y candado).
- El listado y el Inicio usan las opciones por defecto de React Query: ya se actualizan al volver a la pestaña. Solo falta el formulario.

## Goals / Non-Goals

**Goals:** que al volver a una historia abierta se vea lo guardado o cambiado desde otro dispositivo (datos, impresión, desbloqueo), sin pisar nunca lo escrito en este.

**Non-Goals:**
- actualización en tiempo real con ambos dispositivos a la vista;
- consultas periódicas;
- fusionar automáticamente cambios de dos dispositivos;
- revisar dentro de la vista de impresión (`/imprimir`), que pide la historia al abrirse.

## Decisions

### Cuándo se revisa
- **Eventos:**
  - `visibilitychange` → `visible`;
  - `focus` de la ventana;
  - `pageshow` con `persisted` (Safari/iOS al restaurar la página desde la caché del navegador).
- **Hook genérico** `useWindowReturn(callback, { minIntervalMs })` en `modules/core/hooks`:
  - ignora los eventos si `document.visibilityState !== "visible"`;
  - aplica **un solo** límite de 5 s compartido por los tres eventos;
  - limpia los listeners al desmontar.
- **Condiciones:** solo en una historia existente, sin el aviso de historia cambiada ya visible y sin otra revisión en curso.
- **Sin intervalos:** con la pestaña oculta no se consulta, así la base puede dormir.

### Qué se revisa: una sola consulta
- La revisión **se encola con los guardados** (la misma `queue`): si un autoguardado está en curso al volver, espera su respuesta y compara contra la versión que ese guardado devolvió.
- **Una sola consulta**: `getRecord(id)` (sin reintentos) y, si trae algo nuevo, `queryClient.setQueryData(recordKeys.detail(id), fresh)`.
  - Es la respuesta `fresh` que se compara y con la que se remonta.
  - No se usa `fetchQuery`: un error de red dejaría la consulta en error y la pantalla pasaría a "No se pudo cargar", perdiendo lo escrito.
  - No hay `refetch` adicional en ningún caso.

### Barrera para el autoguardado
- Al iniciar la revisión se cancela el temporizador del autoguardado (`autosave.cancel()`).
- Un autoguardado que ya estaba en la cola puede ejecutarse después de la revisión. Por eso **cada tarea encolada de autoguardado vuelve a comprobar una barrera justo antes del PUT**: `staleRef`, un ref que la revisión pone en `true` al detectar conflicto (igual que el `409`). Si está activa, la tarea termina sin guardar.
  - `enabled` de `useAutosave` solo evita nuevas programaciones; la barrera cubre las que ya estaban encoladas.
- Un "Guardar" manual con la barrera activa se envía igual. El servidor responde `409` y se muestra el aviso de siempre: no se pierde nada y es la acción explícita del usuario.

### Invariante de `version.current`
- `version.current` solo cambia desde la cola: con la respuesta de un guardado o al aceptar una revisión.
- Nunca se sincroniza desde la prop `record`: un `useEffect` podría pisar la versión de un guardado en vuelo.
- Toda respuesta nueva se acepta en un único punto (`acceptFresh`), que decide entre los casos de abajo.
- **Firma de la historia** para saber si hay algo nuevo:
  - `version`;
  - `patientLockedAt`;
  - `unlockRequest?.requestedAt`;
  - `lastUnlock?.at`.

  Se compara contra la de la última respuesta conocida. Si es igual, no se hace nada.

### Qué se hace con la respuesta nueva
1. **Solo cambió el bloqueo o el desbloqueo** (misma `version`): se actualiza la caché y el formulario recibe la historia nueva **sin remontarse** (el paso 1 deriva de ella los datos fijos, el aviso y el candado). Lo escrito no se toca y no hay banner.
2. **Cambió `version`**: se comparan los **valores actuales** del formulario (`form.getValues()`) con `toFormValues(fresh)` usando el mismo `diffPaths` que `applySaved`. `isDirty` solo indica si hay cambios propios respecto de lo cargado, no si chocan con el servidor.
   - **Sin diferencias** (incluido un guardado propio que llegó al servidor aunque su respuesta se perdió): `version.current = fresh.version`, `form.reset(toFormValues(fresh))` (baseline al día, sin cambios pendientes) y sin aviso.
   - **Con diferencias y sin cambios propios** (`!isDirty`): se remonta el formulario con `fresh` (que ya está en la caché, `generation + 1`) en el mismo paso de la URL, con el aviso "Actualizada con cambios hechos en otro dispositivo".
     - La comparación y la decisión ocurren sin ningún `await` entre medio.
     - **Justo antes de remontar se vuelve a comprobar** `isDirty` y `diffPaths`: si apareció algo escrito, no se remonta y se muestra el conflicto (banner `remote`).
     - Lo mismo antes del `form.reset` del caso "sin diferencias", que usa `keepDirtyValues`.
   - **Con diferencias y con cambios propios**: `StaleRecordBanner` con motivo `remote` y autoguardado pausado. El usuario decide: recargar (descarta lo suyo) o seguir editando para copiarlo.
3. El aviso de actualización vive en el estado de `RecordFormFeature` (sobrevive al remontaje), en una región `status` (`aria-live="polite"`) junto al título, y se borra con el primer cambio del formulario.

### Texto del aviso de historia cambiada
`StaleRecordBanner` recibe `reason`:
- `"save"` (tras un `409`, como hoy): "La historia cambió desde que la abriste (otra pestaña u otro usuario). Tus cambios no se guardaron."
- Al aparecer (cualquier motivo), el aviso se desplaza a la vista (`scrollIntoView`, centrado; sin animación con `prefers-reduced-motion`) y recibe el foco: se puede estar editando al final del formulario, lejos del aviso, y sin verlo no se entiende por qué no se guarda.
- `"remote"` (detectado al volver): "La historia cambió en otro dispositivo mientras tenías cambios sin guardar aquí. Recárgala para ver la versión actual (perderás lo escrito aquí) o sigue editando para copiarlo."

### Errores al revisar
- **Red o servidor (5xx):** se ignora en silencio. La próxima vuelta lo reintenta y un guardado posterior sigue protegido por el `409`.
- **`404`** (la historia dejó de estar al alcance): `RecordForm` lo informa con `onNotFound` y `RecordFormFeature` muestra "Historia no encontrada", igual que en la carga inicial, sin otra consulta.
- **`401`:** lo maneja el interceptor de `httpClient`: si el refresh funciona, reintenta la revisión; si falla, cierra la sesión y los guards llevan al login. La revisión no lo trata como error de red.

### Vuelta desde la impresión
`/imprimir` no revisa nada. Al volver de la vista previa al formulario, este se monta de nuevo y `useRecord` pide la historia (`refetchOnMount`, la consulta está vencida). Como la caché ya tiene una copia, `RecordFormFeature` muestra la carga hasta esa consulta (`isFetching && !isFetchedAfterMount`): si no, el formulario se montaría con la copia anterior y no tomaría la respuesta. Un test fija que se vea lo último guardado o impreso.

### Tests y alcance de esta propuesta
- Esta propuesta describe el diseño; el código y los tests se escriben en `/opsx:apply` (tareas 1.x).
- jsdom no reproduce si cerrar un diálogo de Radix dispara `window.focus` en un navegador real. Por eso:
  - la deduplicación se prueba en el test unitario de `useWindowReturn`, con eventos explícitos, incluido `pageshow` con `persisted`;
  - el test de integración usa el diálogo real y cuenta los GET;
  - en el despliegue se verifica a mano en Chrome y en un celular.

## Risks / Trade-offs

- **Ambos dispositivos a la vista a la vez** (la PC sin perder el foco): no se actualiza hasta volver a la ventana. Se acepta; una revisión periódica pausada por inactividad iría en otro change.
- **Un cambio remoto justo mientras se escribe en la PC:** lo cubre el `409` del guardado, como hoy.
- **Remontar el formulario** reinicia estados locales del paso (por ejemplo, un acordeón abierto). Solo ocurre sin cambios propios.
- **Comparar valores en cada vuelta con versión nueva** es barato (un objeto de formulario); no ocurre sin versión nueva.
