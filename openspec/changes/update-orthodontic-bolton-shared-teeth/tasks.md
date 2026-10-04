> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `BoltonIncisors` en `BoltonAnalysis.incisors` (`schemaVersion` 7); `RecordNormalizer` rellena la subsección vacía
- [ ] 1.2 `ContentLimits.MIN_TOOTH_MM` / `MAX_TOOTH_MM` (4,0–13,0) en `LowerIncisors`, `UpperArchWidths`, `LowerArchWidths`, `FirstMolarWidths` y `BoltonIncisors`
- [ ] 1.3 Migración V10: copia a `bolton.incisors` los incisivos de Nance en historias con Bolton (idempotente) + IT
- [ ] 1.4 Tests: controller (400 por ancho < 4,0 / > 13,0 con su ruta; espacio disponible y SA siguen en 0–99,9), normalizador, IT (incisivos de Bolton guardados aparte); regenerar contrato; `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `pnpm generate:api`; Zod: `toothMm` (4–13) en los anchos de pieza y `bolton.incisors`; valores iniciales
- [ ] 2.2 `config/bolton.ts`: compartidas con Nance solo caninos y premolares; incisivos y molares propios (`boltonWidthPath` / `boltonWidth`) + tests
- [ ] 2.3 Grilla de Bolton: sombreado solo en compartidas y aviso corregido; `NumberInput min={4} max={13}` en todos los anchos de pieza (Moyers, Nance, Bolton)
- [ ] 2.4 Tests Vitest (compartidas sí / incisivos no, aviso, flechas desde 4,0, error de rango) y E2E; `pnpm validate` verde; impresión verificada

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [ ] 3.2 Al archivar — `docs/domain.md`: Bolton comparte con Nance solo caninos y premolares; rango de pieza 4,0–13,0 mm
