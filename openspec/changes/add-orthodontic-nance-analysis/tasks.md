> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 Records `NanceAnalysis` / `UpperArchWidths` / `LowerArchWidths` en `ModelAnalysis.nance` (`schemaVersion` 5) con Bean Validation (0–99,9 mm, 1 decimal; fecha no futura; conclusiones ≤ 200; interpretación ≤ 4000)
- [ ] 1.2 `RecordNormalizer`: subsección vacía al leer/guardar, textos recortados + tests
- [ ] 1.3 Tests: controller (400 por rango/decimales/fecha futura con su ruta), IT (guardar y leer; historia sin `nance` se abre y guarda)
- [ ] 1.4 Regenerar contrato; `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `pnpm generate:api`; schema Zod en paridad; valores iniciales con la subsección
- [ ] 2.2 `config/nance.ts` (piezas por arcada) + `utils/nance.ts` (ST, discrepancia) con tests de los scenarios
- [ ] 2.3 `ArchDiagram` (SVG con la geometría aprobada en `config/archGeometry.ts`; tema en pantalla, grises al imprimir)
- [ ] 2.4 Panel 3 "Análisis de Nance" en el paso 5 (fecha, SA, dibujo + anchos con total, resultado con discrepancia y conclusión, interpretación)
- [ ] 2.5 `PrintNanceSection` tras Moyers
- [ ] 2.6 Tests Vitest (panel, cálculos, impresión) y E2E (12 hojas); `pnpm validate` verde; impresión verificada con Edge headless

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [ ] 3.2 Al archivar — `docs/domain.md`: análisis de Nance en `OrthodonticRecord` y glosario
