> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs.

## 1. Backend

- [x] 1.1 `V12__record_last_step.sql` (`last_step INTEGER NULL`, `CHECK 1..8`) y `OrthodonticRecord.lastStep`
- [x] 1.2 `UpdateRecordRequest.lastStep` opcional (`@Min(1) @Max(8)`, ausente = no cambia) y `RecordResponse.lastStep` (nullable); servicio lo guarda en `update`
- [x] 1.3 Tests: controller (400 con 0 y 9), IT (guarda y devuelve `lastStep`; ausente lo conserva; historia previa sin paso → `null`); regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [x] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [x] 3.1 Extraer de `goTo` el guardado común `persist({ lastStep, silent })` con `reset(..., { keepDirtyValues: true })`; cambio de paso envía el destino y "Guardar" el paso actual
- [x] 3.2 Hook `useAutosave` (debounce 3 s, mínimo 10 s entre autoguardados salvo al ocultar la pestaña, `visibilitychange`/`pagehide`, un guardado a la vez, reintento en `online`, pausa tras 409) e indicador de estado con `aria-live` en la cabecera; sin toasts
- [x] 3.3 Abrir en `lastStep` si la URL no trae `paso` (`replace`); enlaces del listado sin `paso=1`
- [x] 3.4 Tests Vitest de los scenarios (guarda tras el debounce con timers falsos, al ocultar la pestaña, paso inválido, escribir durante el guardado, fallo y reintento, 409, sin cambios, historia nueva, retomar paso, `?paso` explícito, sin paso guardado) y ajuste de los tests existentes; E2E: retomar en el paso tras recargar; `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [x] 4.2 `docs/frontend.md`: patrón de autoguardado (debounce, `keepDirtyValues`, un guardado a la vez, indicador)
- [ ] 4.3 Al archivar — `docs/domain.md` (`OrthodonticRecord.lastStep`) y `docs/vision.md` ✅
