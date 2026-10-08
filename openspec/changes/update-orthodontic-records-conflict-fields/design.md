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
- `config/fieldLabels.ts`: `FIELD_LABELS`, arreglo ordenado (orden del formulario) de entradas:
  - `path: FieldPath<RecordFormValues>`;
  - `label`;
  - `format`: `"text" | "date" | "choice" | "choiceList" | "toothList" | "textList" | "group"`;
  - `options` (para `choice`/`choiceList`, de `config/options.ts`);
  - `panel` (solo paso 5: `"transversal" | "moyers" | "nance" | "bolton"`).
- Los pasos leen de ahí **solo las etiquetas de sus campos** (`label={labelOf("address")}`); los textos visibles no cambian. Encabezados, ayudas, títulos de paneles e impresión quedan como están.
- Tests del mapa:
  - cada `path` existe en los valores vacíos del formulario (`emptyRecordValues`);
  - **toda ruta hoja** de esos valores (con arrays como hoja) queda cubierta por alguna entrada: un campo nuevo sin entrada rompe el test;
  - las etiquetas visibles de cada paso coinciden con las del mapa (se renderiza el paso y se busca cada `field` por su etiqueta).
- Alternativas descartadas:
  - leer la etiqueta del DOM: solo funciona con el paso montado;
  - un mapa aparte solo para el aviso: dos fuentes de texto que se desalinean.

### Agrupar por entrada
- Cada ruta se lleva a la entrada más específica que la contiene (subiendo por los prefijos). Varias rutas en la misma entrada (las celdas de una tabla) se muestran **una sola vez**; si sus orígenes difieren, la fila queda en `"both"`.
- Entradas `group` (tablas de medidas de transversal, Moyers, Nance y Bolton): sin valor, con "Ir al paso" (abre además su panel).
- Una ruta sin entrada no pasa en desarrollo (lo impide el test de cobertura). Como último recurso en producción cae en una fila de grupo con el título de su paso ("Otros datos del paso N").
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
  - la consulta (`getRecord(id)`) se encola en `queue` y no se acepta (ver la invariante);
  - si falla (red, `5xx`, `404`) el aviso queda sin lista; el `401` lo resuelve el interceptor como siempre;
  - si el aviso se cerró o se recargó antes de que llegue, la respuesta se descarta.
- La lista vive en el estado de `RecordForm` junto con `stale` y se borra al cerrar el aviso o al recargar.

### Presentación y accesibilidad
- `role="alert"` solo envuelve el **mensaje breve y las acciones** (como hoy).
- La lista va **fuera** de esa región viva, debajo, en un bloque sin `aria-live`: "Qué cambió (N)" y un `<ul>` con alto máximo y desplazamiento propio en pantallas chicas.
- Al llegar la lista tarde (motivo `save`), un `role="status"` aparte anuncia solo "Se encontraron N diferencias". No se mueve el foco ni se vuelve a desplazar la vista (el desplazamiento y el foco ocurren una sola vez, al aparecer el aviso).
- Cada fila: etiqueta · "Paso N" · marca de origen (texto, no solo color) · "En el servidor: …" · botón "Ir al campo" (o "Ir al paso" en los grupos).

### Ir al campo
1. `RecordForm` guarda un `focusTarget` (`path`, `panel?`) y cambia `?paso=N`.
2. Se monta el paso. Si la entrada tiene `panel`, `RecordStepContent` se lo pasa a `Step5Models`, que lo agrega a su estado `open` en un efecto y avisa (`onPanelRevealed`).
3. En el render siguiente (paso montado y, si hacía falta, panel abierto), `RecordForm` ejecuta `form.setFocus(path)` y limpia `focusTarget`.
4. Los grupos no enfocan una celda: abren el paso (y su panel) y nada más.
- El aviso sigue visible; lo escrito no cambia.

## Risks / Trade-offs

- **Refactor mecánico de los 8 pasos** (≈150 etiquetas): riesgo de cambiar un texto por error. Lo cubre el test que compara las etiquetas visibles con el mapa; los commits de ese refactor van separados del resto.
- **Una consulta extra tras cada `409`**: es raro y una sola por aviso.
- **Lista fija mientras el aviso está abierto**: si el usuario sigue escribiendo puede quedar desactualizada; al volver a guardar, el `409` la recalcula.
- **Listas sin detalle por elemento**: "En ambos" puede abarcar cambios en elementos distintos; se acepta (el usuario ve la lista completa del servidor).
- **Valores largos** recortados en pantalla: el texto completo queda en `title` y, al recargar, en el propio campo.
