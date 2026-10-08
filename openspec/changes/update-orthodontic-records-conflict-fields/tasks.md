> Rama `change/update-orthodontic-records-conflict-fields` desde `main`, PR a `main` (docs/commits.md §5b). Solo frontend: antes, skill `frontend-guard`. Commits por scope: frontend · docs; el refactor de etiquetas de los pasos en su propio commit. Requiere mergeado el PR del desplazamiento del aviso (`fix/aviso-historia-cambiada-visible`).

## 1. Frontend

- [ ] 1.1 `config/fieldLabels.ts`: `FIELD_LABELS` ordenado (`path`, `label`, `format` `text`/`date`/`choice`/`choiceList`/`toothList`/`textList`/`group`, `options`, `panel` en el paso 5) y `labelOf(path)`; tests:
  - cada `path` existe en `emptyRecordValues()`;
  - toda ruta hoja (arrays como hoja) queda cubierta por una entrada.
- [ ] 1.2 Pasos 1–8 leen las etiquetas de sus campos con `labelOf`, sin cambiar textos; test que renderiza cada paso y encuentra cada entrada `field` por su etiqueta
- [ ] 1.3 `utils/conflictFields.ts` (puro), con test:
  - `conflictFields(base, mine, server)` → filas por entrada, origen `local`/`remote`/`both`, paso y orden del formulario;
  - celdas de una tabla en una fila; lista como una entrada (`both` aunque cambien elementos distintos);
  - ruta sin entrada → fila de grupo "Otros datos del paso N";
  - `formatFieldValue` para cada `format` y "Vacío".
- [ ] 1.4 `RecordForm`:
  - `server` siempre `toFormValues(fresh)`; la respuesta para la lista no se acepta (no toca `defaultValues`, `version.current`, firma ni caché);
  - motivo `remote`: lista armada en `acceptFresh`;
  - motivo `save` (autoguardado y manual): aviso enseguida; una consulta por aviso con el ref `conflictDetail`, encolada en `queue`; si falla, sin lista; descartada si el aviso ya se cerró o se recargó;
  - lista y `conflictDetail` limpios al cerrar el aviso o recargar;
  - "Ir al campo": `focusTarget` + `?paso=N`; `setFocus` en el render siguiente; grupos solo abren el paso.
- [ ] 1.5 `Step5Models` / `RecordStepContent`: panel pedido agregado a `open` y aviso `onPanelRevealed`
- [ ] 1.6 `StaleRecordBanner`: `role="alert"` solo para mensaje y acciones; lista fuera de la región viva ("Qué cambió (N)", filas con etiqueta, paso, origen en texto, valor del servidor y botón; alto máximo con desplazamiento); `role="status"` aparte con "Se encontraron N diferencias" cuando la lista llega tarde; sin mover foco ni vista al llegar
- [ ] 1.7 Tests (uno por scenario):
  - en ambos, solo aquí, solo en el otro dispositivo;
  - valores legibles (opción, lista de opciones, piezas, lista de textos, fecha, vacío);
  - lista como una sola entrada;
  - tablas agrupadas;
  - ir al campo (paso y foco, sin cambiar lo escrito) e ir a un campo en un panel plegado del paso 5;
  - `409`: aviso enseguida, una sola consulta (también con un guardado manual y una vuelta a la pestaña a la vez), lista al llegar sin mover el foco;
  - `409` con consulta fallida → sin lista;
  - clasificación tras un autoguardado con un valor normalizado por el servidor (la base es la respuesta aceptada).

  `pnpm validate` en verde.

## 2. Docs

- [ ] 2.1 `docs/frontend.md` §4.1: aviso de conflicto con detalle (tres valores base/propio/servidor con la invariante de la base, mapa único de etiquetas con formato, lista fuera de la región `alert`)
- [ ] 2.2 Al archivar: `docs/vision.md` ✅
