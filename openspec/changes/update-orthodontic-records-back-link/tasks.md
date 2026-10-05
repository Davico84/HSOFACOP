> Solo frontend (sin backend ni contrato). Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Frontend

- [x] 1.1 Store `src/store/useRecordsListStore.ts` (`listUrl`, `setListUrl`, `clear`; `persist` en `sessionStorage` `hsfacop.records-list`; solo acepta rutas `/historias…`) y `clear()` en el cierre de sesión de `useAuth`
- [x] 1.2 `RecordsFeature` guarda su URL (`/historias` + búsqueda y página) al cambiar
- [x] 1.3 `RecordsBackLink` ("← Historias clínicas", destino `listUrl ?? /historias`) en la cabecera de `RecordForm` (edición y nueva), sobre el título; `RecordNotFound` usa el mismo destino
- [x] 1.4 Tests Vitest de los scenarios (búsqueda y página tras cambiar de paso, tras crear, tras la vista previa, sin listado previo, cambios sin guardar, no encontrada, cierre de sesión) y del store; `pnpm validate` verde

## 2. Docs y cierre

- [x] 2.1 `docs/vision.md`: estado 🚧 del change
- [x] 2.2 `docs/frontend.md`: patrón de enlace de vuelta (arriba a la izquierda, destino recordado en un store)
- [ ] 2.3 Al archivar — `docs/vision.md` ✅ (sin cambios de dominio)
