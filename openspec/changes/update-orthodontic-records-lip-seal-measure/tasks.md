> Rama `change/update-orthodontic-records-lip-seal-measure` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope. Antes del front, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `FacialAnalysis.lipSealMm` (`BigDecimal`, 0–20, un decimal) y `RecordNormalizer` (solo con `PRESENT`)
- [ ] 1.2 Tests: normalizador (con y sin "Presenta"), validación fuera de rango (IT: `400` en `content.facial.lipSealMm`), contenido anterior sin el campo; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el cliente orval
- [ ] 2.2 Zod `lipSealMm: decimal(0, 20, "mm")`; `Step2Facial`: `MeasureField` "Separación interlabial" solo con "Presenta"; `PrintFacialSection`: medida en la línea 4
- [ ] 2.3 Tests: campo visible solo con "Presenta", rango y decimal en el schema, hoja impresa con y sin medida; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: análisis facial con la medida del sellado labial
- [ ] 3.2 Al archivar: `docs/vision.md` ✅
