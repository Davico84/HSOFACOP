> Rama `change/update-orthodontic-records-cross-device-refresh` desde `main`, PR a `main` (docs/commits.md §5b). Solo frontend: antes, skill `frontend-guard`. Commits por scope: frontend · docs.

## 1. Frontend

- [ ] 1.1 `modules/core/hooks/useWindowReturn.ts` (genérico): llama al callback cuando la pestaña vuelve a estar visible o la ventana recibe el foco, como máximo una vez cada `minIntervalMs`; no llama con la pestaña oculta; limpia los listeners al desmontar. Con su test
- [ ] 1.2 `RecordForm`: revisión encolada con los guardados.
  - `getRecord` y comparación con `version.current`.
  - Misma versión → nada.
  - Versión mayor sin cambios locales → recarga con aviso.
  - Versión mayor con cambios → `StaleRecordBanner` y autoguardado pausado.
  - Error de red → se ignora.
  - Solo con historia existente y sin el aviso ya visible.
- [ ] 1.3 `RecordFormFeature`: recarga con indicador "desde otro dispositivo" y aviso `role="status"` junto al título ("Actualizada con cambios hechos en otro dispositivo"), que se borra con el primer cambio
- [ ] 1.4 Tests (uno por scenario, con MSW y `document.visibilityState` y eventos `visibilitychange`/`focus` simulados):
  - volver sin cambios locales, el formulario muestra lo nuevo en el mismo paso y aparece el aviso;
  - volver con cambios locales, sus valores se conservan, aparece el banner y no hay autoguardado;
  - volver sin cambios en el servidor, sin recarga ni aviso;
  - guardado propio en curso al volver, sin aviso;
  - foco y visibilidad a la vez y alternar ventanas, como máximo 1 consulta en 5 s;
  - con la pestaña oculta y en una historia nueva, sin consulta.

  `pnpm validate` en verde.

## 2. Docs

- [ ] 2.1 `docs/frontend.md` §4.1: `useWindowReturn` y el patrón de la copia de trabajo (sin refetch automático) + revisión al volver
- [ ] 2.2 Al archivar: `docs/vision.md` ✅
