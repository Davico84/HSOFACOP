> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [x] 1.1 Records `ModelAnalysis` / `TransversalAnalysis` / `WalaToEv` en `RecordContent` (`schemaVersion` 3) con Bean Validation (0–99,9 mm, 1 decimal; interpretación ≤ 4000)
- [x] 1.2 `RecordNormalizer`: sección vacía al leer/guardar, texto recortado + tests
- [x] 1.3 Tests: controller (400 por rango/decimales con su ruta), IT (guardar y leer el análisis; historia sin `models` se abre y guarda)
- [x] 1.4 Regenerar contrato; `mvn verify` verde

## 2. Frontend

- [x] 2.1 `pnpm generate:api`; schema Zod en paridad; valores iniciales con la sección
- [x] 2.2 `config/transversal.ts` (normas y promedios) + `utils/transversal.ts` (diferencias) con tests de los scenarios
- [x] 2.3 Paso 5 "Análisis de modelos", `RECORD_STEPS` con 8 pasos y renumeración de los siguientes
- [x] 2.4 `PrintModelsSection` tras el análisis oclusal
- [x] 2.5 Tests Vitest (paso 5, diferencias en pantalla, impresión) y E2E (10 hojas); `pnpm validate` verde; impresión verificada con Edge headless

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [x] 3.2 Al archivar — `docs/domain.md`: análisis transversal en `OrthodonticRecord`
