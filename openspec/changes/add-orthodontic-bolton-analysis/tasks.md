> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [x] 1.1 Records `BoltonAnalysis` / `FirstMolarWidths` en `ModelAnalysis.bolton` (`schemaVersion` 6) con Bean Validation (0–99,9 mm, 1 decimal; fecha no futura; interpretación ≤ 4000)
- [x] 1.2 `RecordNormalizer`: subsección vacía al leer/guardar, texto recortado + tests
- [x] 1.3 Tests: controller (400 por rango/decimales/fecha futura con su ruta), IT (guardar y leer; historia sin `bolton` se abre y guarda)
- [x] 1.4 Regenerar contrato; `mvn verify` verde

## 2. Frontend

- [x] 2.1 `pnpm generate:api`; schema Zod en paridad; valores iniciales con la subsección
- [x] 2.2 `config/bolton.ts` (relaciones, piezas, medias, rangos) + `utils/bolton.ts` (sumas, relación, rango, real/ideal/diferencia) con tests de los scenarios
- [x] 2.3 `BoltonFormula` (fracción como en el PDF) y grilla de anchos que comparte los campos de Nance
- [x] 2.4 Panel 4 "Análisis de Bolton" en el paso 5 (fecha, grilla, relación total y anterior, interpretación)
- [x] 2.5 `PrintBoltonSection` tras Nance
- [ ] 2.6 Tests Vitest (panel, anchos compartidos, cálculos, impresión) y E2E (13 hojas); `pnpm validate` verde; impresión verificada con Edge headless

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [ ] 3.2 Al archivar — `docs/domain.md`: análisis de Bolton en `OrthodonticRecord` y glosario
