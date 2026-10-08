> Rama `change/update-orthodontic-records-conflict-fields` desde `main`, PR a `main` (docs/commits.md §5b). Solo frontend: antes, skill `frontend-guard`. Commits por scope: frontend · docs; el refactor de etiquetas de los pasos en su propio commit. Requiere mergeado el PR del desplazamiento del aviso (`fix/aviso-historia-cambiada-visible`).

## 1. Frontend

- [ ] 1.1 `config/fieldLabels.ts`: `FIELD_LABELS` ordenado (`path`, `label`, `format` `text`/`date`/`choice`/`choiceList`/`toothList`/`textList`/`group`, `options`, `panel` en el paso 5, `control` `label`/`group`/`table`) y `labelOf(path)`; test estructural: cada `path` existe en `emptyRecordValues()` y toda ruta hoja (arrays como hoja) queda cubierta por una entrada
- [ ] 1.2 Pasos 1–8 leen las etiquetas de sus controles con `labelOf`, sin cambiar textos; test de pantalla por paso con valores que muestran los campos condicionales (y el paso 5 con todos los paneles abiertos), buscando cada entrada según su `control`
- [ ] 1.3 `utils/conflictFields.ts` (puro), con test:
  - `conflictFields(base, mine, server)` → filas por entrada, origen `local`/`remote`/`both`, paso y orden del formulario;
  - celdas de una tabla en una fila; lista como una entrada (`both` aunque cambien elementos distintos);
  - ruta sin entrada → "Campo no identificado (paso N)" y `console.error` con la ruta;
  - `formatFieldValue` para cada `format` y "Vacío".
- [ ] 1.4 `RecordForm`:
  - `server` siempre `toFormValues(fresh)`; la respuesta para la lista no se acepta (no toca `defaultValues`, `version.current`, firma ni caché);
  - motivo `remote`: lista armada en `acceptFresh`;
  - motivo `save` (autoguardado y manual): aviso enseguida; una consulta por aviso con el ref `conflictDetail`, encolada en `queue`; si falla, sin lista;
  - token `conflictToken`: cerrar el aviso o recargar lo incrementa; la respuesta solo se aplica con el token vigente y `stale` activo;
  - lista y `conflictDetail` limpios al cerrar el aviso o recargar;
  - "Ir al campo": `focusTarget` con `id` (`focusSeq`) y `?paso=N`; sin panel, `setFocus` en el efecto de paso + pedido; con panel, al recibir `onPanelRevealed(id)` vigente; un pedido nuevo, cerrar o recargar anula el anterior; grupos abren paso (y panel) sin foco.
- [ ] 1.5 `Step5Models` / `RecordStepContent`: `revealPanel = { id, panel }`; efecto A agrega el panel a `open`; efecto B avisa `onPanelRevealed(id)` una sola vez cuando `value` ya lo incluye
- [ ] 1.6 `StaleRecordBanner`: `role="alert"` solo para mensaje y acciones; lista fuera de la región viva ("Qué cambió (N)", filas con etiqueta, paso, origen en texto, valor del servidor y botón; alto máximo con desplazamiento); `role="status"` aparte con "Se encontraron N diferencias" cuando la lista llega tarde; foco y desplazamiento solo al montarse el aviso (no dependen de la lista)
- [ ] 1.7 Tests (uno por scenario):
  - en ambos, solo aquí, solo en el otro dispositivo;
  - valores legibles (opción, lista de opciones, piezas, lista de textos, fecha, vacío);
  - lista como una sola entrada;
  - tablas agrupadas;
  - ir al campo (paso y foco, sin cambiar lo escrito), ir a un campo en un panel plegado del paso 5 y elegir otro campo antes de que se abra el anterior (foco solo en el último);
  - `409`: aviso enseguida, una sola consulta (también con un guardado manual y una vuelta a la pestaña a la vez), lista al llegar sin mover el foco;
  - `409` con consulta fallida → sin lista;
  - cerrar o recargar antes de que llegue la consulta → la respuesta tardía no muestra nada;
  - campo sin nombre conocido → "Campo no identificado (paso N)";
  - clasificación tras un autoguardado con un valor normalizado por el servidor (la base es la respuesta aceptada).

  `pnpm validate` en verde.

## 2. Docs

- [ ] 2.1 `docs/frontend.md` §4.1: aviso de conflicto con detalle (tres valores base/propio/servidor con la invariante de la base, mapa único de etiquetas con formato, lista fuera de la región `alert`)
- [ ] 2.2 Al archivar: `docs/vision.md` ✅
