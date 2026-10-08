## Context

- El aviso de historia cambiada (`StaleRecordBanner`) aparece por dos motivos:
  - `"save"`: un guardado respondió `409` (otra pestaña u otro usuario);
  - `"remote"`: al volver a la pestaña, la revisión trajo una versión nueva con valores distintos y había cambios propios (`update-orthodontic-records-cross-device-refresh`).
- Ofrece "Recargar historia" (descarta lo escrito aquí) o "Seguir editando" (cierra el aviso, el autoguardado sigue pausado y un guardado manual vuelve a dar `409`). No dice qué campos difieren.
- `utils/formDiff.ts` ya tiene `diffPaths(a, b)` (rutas con puntos; un array cuenta como hoja) y `valueAt`.
- `config/recordSteps.ts` tiene `stepOfField(path)`. `config/options.ts` tiene las opciones con su texto.
- Las etiquetas de los campos hoy están escritas en el JSX de cada paso (`label="Domicilio"`); no hay un mapa ruta → etiqueta.
- El formulario mantiene como valores iniciales (`formState.defaultValues`) la última versión aceptada del servidor: la carga, o el `reset` tras cada guardado.

## Goals / Non-Goals

**Goals:** que el aviso diga qué campos difieren, de dónde viene cada diferencia y qué hay en el servidor, y lleve a cada campo.

**Non-Goals:**
- combinar versiones o tomar del servidor algunos campos (opción descartada por ahora);
- mostrar valores dentro de las tablas de medidas;
- actualizar la lista mientras el aviso está abierto (es una foto del momento en que apareció).

## Decisions

### Clasificar las diferencias (tres valores)
- Utilidad pura `conflictFields(base, mine, server)` en `utils/conflictFields.ts`:
  - `base` = `form.formState.defaultValues` (última versión aceptada);
  - `mine` = `form.getValues()`;
  - `server` = `toFormValues(fresh)`.
- Rutas candidatas: `diffPaths(mine, server)` (si `mine` ya es igual al servidor, no hay nada que perder ni que traer).
- Origen de cada ruta:
  - `mine ≠ base` y `server = base` → `"local"` ("Solo aquí: se pierde al recargar");
  - `mine = base` y `server ≠ base` → `"remote"` ("En otro dispositivo");
  - los dos distintos de `base` → `"both"` ("En ambos").
- Alternativa descartada: comparar solo `mine` con `server`. No distingue lo que se pierde de lo que llega, que es justo lo que el usuario necesita para decidir qué copiar.

### Agrupar por campo visible
- Cada ruta se lleva a la **entrada del mapa de etiquetas** más específica que la contiene (subiendo por los prefijos). Varias rutas que caen en la misma entrada (las celdas de una tabla) se muestran **una sola vez**; si sus orígenes difieren, la fila queda en `"both"`.
- Entradas de **campo** (texto, fecha, opción, lista de opciones): con valor del servidor e "Ir al campo".
- Entradas de **grupo** (las tablas de medidas de transversal, Moyers, Nance y Bolton): sin valor, con "Ir al paso".
- Una ruta sin entrada (no debería pasar) cae en el título de su paso, como grupo.
- Orden: por paso y, dentro del paso, por el orden del mapa (el del formulario).

### Mapa único de etiquetas
- `config/fieldLabels.ts`: `FIELD_LABELS`, un arreglo ordenado de `{ path, label, kind: "field" | "group", options? }`, con `path` tipado como `FieldPath<RecordFormValues>`.
- Los pasos toman de ahí las etiquetas de sus campos (`label={labelOf("address")}`), así la lista y el formulario no se desalinean. Las etiquetas que hoy no son de un campo (encabezados, textos de ayuda) no cambian.
- Un test recorre el mapa: cada `path` existe en los valores vacíos del formulario y las rutas hoja de esos valores quedan cubiertas por alguna entrada.
- Alternativa descartada: leer la etiqueta del DOM. Solo funciona con el paso montado y se rompe con los campos de otros pasos.

### Valores legibles
- `formatFieldValue(entry, value)`:
  - vacío (`""`, `null`, `[]`) → "Vacío";
  - opción → su texto de `options`; lista de opciones → textos separados por comas;
  - fecha (`yyyy-mm-dd`) → `dd/mm/aaaa`;
  - texto → tal cual, recortado a 3 líneas en pantalla (`line-clamp-3`) con el texto completo en `title`.

### De dónde sale la versión del servidor
- **Motivo `remote`**: `acceptFresh` ya tiene `fresh`; calcula la lista en el mismo punto en que decide el conflicto (sin `await` entre medio).
- **Motivo `save` (`409`)**: tras el `409`, **una** consulta `getRecord(id)` encolada en `queue` (no toca `version.current`, la firma ni la caché: solo arma la lista; "Recargar historia" sigue haciendo su propia recarga).
  - Si falla (red, `5xx`, `404`): el aviso queda sin lista. El `401` lo resuelve el interceptor como siempre.
  - Mientras llega, el aviso se muestra ya, sin lista (la lista aparece al llegar, sin mover el foco ni volver a desplazar la vista).
- La lista vive en el estado de `RecordForm` junto con `stale` y se borra al cerrar el aviso o al recargar.

### Presentación
- Dentro del aviso, debajo del texto: "Qué cambió (N)" y la lista (`<ul>`), con alto máximo y desplazamiento propio en pantallas chicas para no tapar el formulario.
- Cada fila: etiqueta · "Paso N" · marca de origen (texto, no solo color) · "En el servidor: …" · botón "Ir al campo"/"Ir al paso".
- "Ir al campo": `setSearchParams({ paso })` y, ya montado el paso, `form.setFocus(path)` (si el campo está dentro de un panel plegado, el paso abre el panel que contiene el campo enfocado igual que con los errores de validación; si no se puede enfocar, queda abierto el paso). El aviso sigue visible.

## Risks / Trade-offs

- **Mapa de etiquetas grande** (≈150 campos) y refactor mecánico de los 8 pasos. Lo compensa tener una sola fuente; el test evita que quede un campo sin entrada.
- **Una consulta extra tras cada `409`**: es raro y solo una vez por aviso.
- **Lista fija mientras el aviso está abierto**: si el usuario sigue escribiendo, puede quedar desactualizada; al volver a guardar, el `409` la recalcula.
- **Valores largos** recortados en pantalla: el texto completo queda en `title` y, al recargar, en el propio campo.
