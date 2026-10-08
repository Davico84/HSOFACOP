## Context

- El aviso de historia cambiada (`StaleRecordBanner`) aparece por dos motivos:
  - `"save"`: un guardado respondió `409` (otra pestaña u otro usuario);
  - `"remote"`: al volver a la pestaña, la revisión trajo una versión nueva con valores distintos y había cambios propios (`update-orthodontic-records-cross-device-refresh`).
- Ofrece "Recargar historia" (descarta lo escrito aquí) o "Seguir editando" (cierra el aviso, el autoguardado sigue pausado y un guardado manual vuelve a dar `409`). No dice qué campos difieren.
- Al aparecer, el aviso se desplaza a la vista y recibe el foco (`fix/aviso-historia-cambiada-visible`).
- `utils/formDiff.ts` ya tiene `diffPaths(a, b)` (rutas con puntos; **un array cuenta como hoja**) y `valueAt`.
- `config/recordSteps.ts` tiene `stepOfField(path)`. `config/options.ts` tiene las opciones con su texto.
- Las etiquetas de los campos hoy están escritas en el JSX de cada paso (`label="Domicilio"`); no hay un mapa ruta → etiqueta.
- El paso 5 es el único con paneles plegables (`Accordion` con estado local `open`; abre solo los paneles con errores de validación).

## Goals / Non-Goals

**Goals:** que el aviso diga qué campos difieren, de dónde viene cada diferencia y qué hay en el servidor, y lleve a cada campo.

**Non-Goals:**
- combinar versiones o tomar del servidor algunos campos (opción descartada por ahora);
- mostrar valores dentro de las tablas de medidas, o qué elemento de una lista viene de cada dispositivo;
- actualizar la lista mientras el aviso está abierto (es una foto del momento en que se armó);
- cambiar textos de ayuda, títulos de paneles o etiquetas de impresión.

## Decisions

### Clasificar las diferencias (tres valores)
- Utilidad pura `conflictFields(base, mine, server)` en `utils/conflictFields.ts`:
  - `base` = `form.formState.defaultValues`;
  - `mine` = `form.getValues()`;
  - `server` = `toFormValues(fresh)` (nunca `fresh` crudo: así `null`, vacíos y secciones ausentes se comparan igual que en el formulario).
- Rutas candidatas: `diffPaths(mine, server)` (si `mine` ya es igual al servidor, no hay nada que perder ni que traer).
- Origen de cada ruta:
  - `mine ≠ base` y `server = base` → `"local"` ("Solo aquí: se pierde al recargar");
  - `mine = base` y `server ≠ base` → `"remote"` ("En otro dispositivo");
  - los dos distintos de `base` → `"both"` ("En ambos").
- **Invariante de la base**: `defaultValues` es siempre la última respuesta **aceptada** del servidor. Se actualiza solo en:
  - la carga o el remontaje (`toFormValues(record)`);
  - `applySaved` tras un guardado (`reset(server, { keepDirtyValues: true })` y luego las rutas no tocadas desde el servidor, incluidos los valores que el servidor normaliza);
  - `acceptFresh` cuando no hay diferencias.

  La respuesta que se consulta para armar la lista **no se acepta**: no toca `defaultValues`, `version.current`, la firma ni la caché.
- **Listas**: un array es una sola entrada (como en `diffPaths`). `"both"` significa que la lista entera difiere de la base en los dos lados; no indica qué elemento viene de cada dispositivo.
- Alternativa descartada: comparar solo `mine` con `server`. No distingue lo que se pierde de lo que llega, que es justo lo que el usuario necesita para decidir qué copiar.

### Mapa único de etiquetas con formato
- `FIELD_LABELS` es la fuente única de las etiquetas de los **controles del formulario** que puede listar el aviso. No cubre encabezados, textos de ayuda, títulos de paneles ni etiquetas de impresión.
- `config/fieldLabels.ts`: `FIELD_LABELS`, arreglo ordenado (orden del formulario) de entradas:
  - `path: FieldPath<RecordFormValues>`;
  - `label`;
  - `format`: `"text" | "date" | "choice" | "choiceList" | "toothList" | "textList" | "group"`;
  - `options` (para `choice`/`choiceList`, de `config/options.ts`);
  - `panel` (solo paso 5: `"transversal" | "moyers" | "nance" | "bolton"`);
  - `control`: cómo se encuentra en pantalla: `"label"` (control etiquetado: texto, fecha, medida, área de texto), `"group"` (grupo con nombre: opciones, varias opciones, piezas) o `"table"` (entradas `group`).
- Los pasos leen de ahí **solo las etiquetas de sus campos** (`label={labelOf("address")}`); los textos visibles no cambian. Encabezados, ayudas, títulos de paneles e impresión quedan como están.
- Dos tests del mapa, separados:
  1. **Estructural**: cada `path` existe en `emptyRecordValues()` y **toda ruta hoja** (arrays como hoja) queda cubierta por alguna entrada; un campo nuevo sin entrada rompe el test.
  2. **De pantalla**: se renderiza cada paso con valores que muestran sus campos condicionales (p. ej. hábitos de succión "Sí", bruxismo con desgaste, patrón II/III, menarquia, mordida cruzada; el paso 5 con todos los paneles abiertos) y cada entrada se encuentra según su `control`: `getByLabelText(label)` para `"label"`, `getByRole("group", { name: label })` para `"group"`; las `"table"` se buscan por el título de su sección. Así el texto visible coincide con el mapa.
- Alternativas descartadas:
  - leer la etiqueta del DOM: solo funciona con el paso montado;
  - un mapa aparte solo para el aviso: dos fuentes de texto que se desalinean.

### Agrupar por entrada
- Cada ruta se lleva a la entrada más específica que la contiene (subiendo por los prefijos). Varias rutas en la misma entrada (las celdas de una tabla) se muestran **una sola vez**; si sus orígenes difieren, la fila queda en `"both"`.
- Entradas `group` (tablas de medidas de transversal, Moyers, Nance y Bolton): sin valor, con "Ir al paso", que abre el paso y, en el paso 5, su panel, sin enfocar una celda.
- Una ruta sin entrada no pasa en desarrollo (lo impide el test estructural). Como último recurso en producción se muestra como **"Campo no identificado (paso N)"**, con "Ir al paso" y sin valor (no parece una fila normal), y se registra con `console.error` (ruta incluida) para detectarlo.
- Orden: por paso y, dentro del paso, por el orden del mapa.

### Valores legibles (`formatFieldValue(entry, value)`)
- vacío (`""`, `null`, `[]`) → "Vacío";
- `choice` → texto de la opción; `choiceList` → textos separados por comas;
- `toothList` → "Pieza 11, Pieza 12";
- `textList` → cada elemento, separados por "; ";
- `date` (`yyyy-mm-dd`) → `dd/mm/aaaa`;
- `text` → tal cual, recortado a 3 líneas en pantalla (`line-clamp-3`) con el texto completo en `title`.

### De dónde sale la versión del servidor
- **Motivo `remote`**: `acceptFresh` ya tiene `fresh`; arma la lista en el mismo punto en que decide el conflicto (sin `await` entre medio).
- **Motivo `save` (`409`)**, tanto del autoguardado como del guardado manual:
  - el aviso se muestra enseguida, sin lista;
  - **una sola consulta por aviso**: `conflictDetail` (ref) guarda la promesa en curso; mientras exista no se lanza otra, y `checkRemote` no encola revisión (ya sale con `stale`/`staleRef` activos; el ref lo cubre también en el camino del guardado manual). Se limpia al cerrar el aviso o recargar;
  - **respuestas tardías**: cada consulta lleva un token (`const token = ++conflictToken.current`). Cerrar el aviso o recargar incrementa `conflictToken`. Al resolver, la lista solo se aplica si el token sigue vigente y `stale` sigue activo; si no, se descarta sin tocar nada;
  - la consulta (`getRecord(id)`) se encola en `queue` y no se acepta (ver la invariante);
  - si falla (red, `5xx`, `404`) el aviso queda sin lista; el `401` lo resuelve el interceptor como siempre;
- La lista vive en el estado de `RecordForm` junto con `stale` y se borra al cerrar el aviso o al recargar.

### Presentación y accesibilidad
- `role="alert"` solo envuelve el **mensaje breve y las acciones** (como hoy).
- La lista va **fuera** de esa región viva, debajo, en un bloque sin `aria-live`: "Qué cambió (N)" y un `<ul>` con alto máximo y desplazamiento propio en pantallas chicas.
- **Foco y desplazamiento una sola vez**: solo la transición del aviso de oculto a visible (`stale`: `null` → motivo) desplaza la vista y da el foco al aviso. El efecto del banner depende de su montaje (y del motivo), **no** de la lista.
- La llegada de la lista (`undefined` → filas) solo actualiza el `role="status"` aparte con "Se encontraron N diferencias"; no mueve el foco ni desplaza la vista.
- Cada fila: etiqueta · "Paso N" · marca de origen (texto, no solo color) · "En el servidor: …" · botón "Ir al campo" (o "Ir al paso" en los grupos).

### Ir al campo (protocolo con identificador de pedido)
1. `RecordForm` guarda `focusTarget = { id, path, panel?, focus }` con `id = ++focusSeq.current` (`focus` es falso en los grupos) y cambia `?paso=N`. Un pedido nuevo reemplaza al anterior; cerrar el aviso o recargar lo anula.
2. **Sin panel** (pasos 1–4, 6–8, o campos del paso 5 fuera de paneles): un efecto de `RecordForm` que depende de `step` y `focusTarget` ejecuta `form.setFocus(path)` cuando el paso del URL ya es el del pedido (el paso se monta en el mismo commit) y limpia el pedido.
3. **Con panel** (paso 5): `RecordStepContent` pasa a `Step5Models` `revealPanel = { id, panel }` y `onPanelRevealed(id)`.
   - Efecto A (depende de `revealPanel.id`): `setOpen(prev => union(prev, panel))`. Así el panel queda en el estado propio `open` (no depende de `withErrors`) y un `onValueChange` posterior lo conserva salvo que el usuario lo cierre a propósito.
   - Efecto B (depende de `value` y `revealPanel.id`): cuando `value.includes(panel)` (el contenido ya está montado en ese commit) llama una sola vez `onPanelRevealed(id)` (ref con el último `id` avisado).
   - `RecordForm` al recibirlo: si `id === focusTarget.id`, ejecuta `setFocus(path)` (si `focus`) y limpia el pedido; si no, lo ignora.
4. Los grupos (`focus` falso) siguen el mismo camino y solo abren paso y panel.
- El aviso sigue visible; lo escrito no cambia.

## Risks / Trade-offs

- **Refactor mecánico de los 8 pasos** (≈150 etiquetas): riesgo de cambiar un texto por error. Lo cubre el test que compara las etiquetas visibles con el mapa; los commits de ese refactor van separados del resto.
- **Una consulta extra tras cada `409`**: es raro y una sola por aviso.
- **Lista fija mientras el aviso está abierto**: si el usuario sigue escribiendo puede quedar desactualizada; al volver a guardar, el `409` la recalcula.
- **Listas sin detalle por elemento**: "En ambos" puede abarcar cambios en elementos distintos; se acepta (el usuario ve la lista completa del servidor).
- **Valores largos** recortados en pantalla: el texto completo queda en `title` y, al recargar, en el propio campo.
