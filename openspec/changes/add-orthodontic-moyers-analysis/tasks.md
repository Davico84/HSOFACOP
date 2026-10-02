> Commits separados por scope (docs/commits.md). Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [x] 1.1 Records `MoyersAnalysis` / `LowerIncisors` / `AvailableSpace` en `ModelAnalysis.moyers` (`schemaVersion` 4) con Bean Validation (0–99,9 mm, 1 decimal; fecha no futura; interpretación ≤ 4000)
- [x] 1.2 `RecordNormalizer`: subsección vacía al leer/guardar, texto recortado + tests
- [x] 1.3 Tests: controller (400 por rango/decimales/fecha futura con su ruta), IT (guardar y leer; fecha anterior al tratamiento; historia sin `moyers` se abre y guarda)
- [x] 1.4 Regenerar contrato; `mvn verify` verde

## 2. Frontend

- [x] 2.1 `pnpm generate:api`; schema Zod en paridad; valores iniciales con la subsección
- [x] 2.2 `config/moyers.ts` (tabla 75 %) + `utils/moyers.ts` (suma, redondeo, requerido, diferencias) con tests de los scenarios
- [x] 2.3 Bloque "Análisis de Moyers" en el paso 5 (fecha, incisivos con suma, tabla de espacios con requerido y diferencia, predisposición, interpretación)
- [x] 2.4 `PrintMoyersSection` tras la hoja del transversal
- [ ] 2.6 Revisión del usuario: tabla de espacios alineada (entradas, requerido y diferencia en la misma columna); predisposición escrita por el odontólogo (backend `crowdingPositive/Neutral/Negative` ≤ 200 + contrato + campos de texto + impresión)
- [ ] 2.5 Tests Vitest (bloque Moyers, cálculos en pantalla, impresión) y E2E (11 hojas); `pnpm validate` verde; impresión verificada con Edge headless

## 3. Docs y cierre

- [x] 3.1 `docs/vision.md`: estado 🚧 del change
- [ ] 3.2 Al archivar — `docs/domain.md`: análisis de Moyers en `OrthodonticRecord` y glosario
