> Rama `change/update-orthodontic-records-conflict-fields` desde `main`, PR a `main` (docs/commits.md §5b). Solo frontend: antes, skill `frontend-guard`. Commits por scope: frontend · docs. Requiere mergeado el PR del desplazamiento del aviso (`fix/aviso-historia-cambiada-visible`).

## 1. Frontend

- [ ] 1.1 `config/fieldLabels.ts`: `FIELD_LABELS` ordenado (`path`, `label`, `kind` `field`/`group`, `options`) y `labelOf(path)`; test: cada `path` existe en los valores vacíos y toda ruta hoja queda cubierta por una entrada
- [ ] 1.2 Pasos 1–8 leen las etiquetas de sus campos con `labelOf` (sin cambiar el texto visible)
- [ ] 1.3 `utils/conflictFields.ts` (puro), con test:
  - `conflictFields(base, mine, server)` → filas por entrada del mapa, con origen `local`/`remote`/`both`, paso y orden del formulario;
  - celdas de una tabla agrupadas en una fila;
  - `formatFieldValue`: vacío, opción, lista de opciones, fecha y texto.
- [ ] 1.4 `RecordForm`:
  - motivo `remote`: lista calculada en `acceptFresh` con `fresh`;
  - motivo `save`: una `getRecord` encolada tras el `409`, sin tocar versión, firma ni caché; si falla, sin lista;
  - lista borrada al cerrar el aviso o recargar;
  - "Ir al campo": paso de la URL y `setFocus` al montar el paso.
- [ ] 1.5 `StaleRecordBanner`: "Qué cambió (N)" con las filas (etiqueta, paso, origen en texto, valor del servidor, botón), alto máximo con desplazamiento; sin mover el foco ni la vista cuando la lista llega después
- [ ] 1.6 Tests (uno por scenario): ambos, solo aquí, solo en el otro dispositivo, valores legibles, tablas agrupadas, ir al campo (paso y foco, sin cambiar lo escrito), `409` con una sola consulta y `409` con consulta fallida

  `pnpm validate` en verde.

## 2. Docs

- [ ] 2.1 `docs/frontend.md` §4.1: aviso de conflicto con detalle (tres valores base/propio/servidor, mapa único de etiquetas)
- [ ] 2.2 Al archivar: `docs/vision.md` ✅
