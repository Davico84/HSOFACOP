> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 Records `MoyersAnalysis` / `LowerIncisors` / `AvailableSpace` en `ModelAnalysis.moyers` (`schemaVersion` 4) con Bean Validation (0–99,9 mm, 1 decimal; fecha no futura; interpretación ≤ 4000)
- [ ] 1.2 `RecordNormalizer`: subsección vacía al leer/guardar, texto recortado + tests
- [ ] 1.3 Tests: controller (400 por rango/decimales/fecha futura con su ruta), IT (guardar y leer; fecha anterior al tratamiento; historia sin `moyers` se abre y guarda)
- [ ] 1.4 Regenerar contrato; `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `pnpm generate:api`; schema Zod en paridad; valores iniciales con la subsección
- [ ] 2.2 `config/moyers.ts` (tabla 75 %) + `utils/moyers.ts` (suma, redondeo, requerido, diferencias, predisposición) con tests de los scenarios
- [ ] 2.3 Bloque "Análisis de Moyers" en el paso 5 (fecha, incisivos con suma, tabla de espacios con requerido y diferencia, predisposición, interpretación)
- [ ] 2.4 `PrintMoyersSection` tras la hoja del transversal
- [ ] 2.5 Tests Vitest (bloque Moyers, cálculos en pantalla, impresión) y E2E (11 hojas); `pnpm validate` verde; impresión verificada con Edge headless

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [ ] 3.2 Al archivar — `docs/domain.md`: análisis de Moyers en `OrthodonticRecord` y glosario
