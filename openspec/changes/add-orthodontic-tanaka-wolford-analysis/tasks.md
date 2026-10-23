> Rama `change/add-orthodontic-tanaka-wolford-analysis` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`. Las hojas impresas se revisan página por página antes de codearlas.

## 0. Revisión

- [ ] 0.1 HTML local de revisión de las dos hojas (guía, campos y preview con datos de ejemplo) y respuestas del usuario volcadas a spec/design

## 1. Backend

- [ ] 1.1 `TanakaAnalysis` y `WolfordAnalysis` en `ModelAnalysis` con validación de rangos (`MAX_ARCH_SUM_MM` 199,9), `empty()` y `schemaVersion` 11; el normalizador rellena los bloques que faltan
- [ ] 1.2 Tests: guardar y leer los dos análisis; rangos y decimales (`400` por campo); historia guardada con `schemaVersion` 10 abre y guarda sin perder datos; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el cliente orval; `ContractDriftIT` en verde
- [ ] 2.2 Schema Zod (paridad de rangos) y utilidades `tanaka.ts` / `wolford.ts` (sumas sugeridas desde Moyers/Bolton/Nance, valor efectivo, cálculos en décimas con redondeo) con tests de los scenarios de cálculo
- [ ] 2.3 `SuggestedMeasureField` en `core/components/form` (valor efectivo, nota de la fuente, "Usar el de …") con su test
- [ ] 2.4 Paneles "Fórmula de Tanaka-Johnston" (tras Moyers) y "Análisis de Wolford" (tras Bolton) en el paso 5; `filled.ts` no cuenta las sumas sugeridas
- [ ] 2.5 Hojas impresas `PrintTanakaSection` (tras Moyers) y `PrintWolfordSection` (tras Bolton) con los valores efectivos
- [ ] 2.6 Tests (uno por scenario de la UI): suma tomada, editada y "Usar el de …", sigue a la medición, faltan anchos, no cuenta como dato, hojas impresas y su orden; impresión real verificada con Edge headless; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: Tanaka-Johnston y Wolford en el glosario y en el contenido de la historia (`schemaVersion` 11)

## Workflow follow-up

- Al archivar: `docs/vision.md` ✅ y specs sincronizadas.
