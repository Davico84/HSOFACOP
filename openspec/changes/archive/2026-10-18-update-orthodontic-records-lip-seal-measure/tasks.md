> Rama `change/update-orthodontic-records-lip-seal-measure` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope. Antes del front, skill `frontend-guard`.

## 1. Backend

- [x] 1.1 `FacialAnalysis.lipSealMm` (`BigDecimal`, 0–20, un decimal) y `RecordNormalizer` (solo con `PRESENT`)
- [x] 1.2 Tests: normalizador (con y sin "Presenta"), validación fuera de rango (IT: `400` en `content.facial.lipSealMm`), contenido anterior sin el campo; `mvn verify` en verde

- [x] 1.3 `V17` (preflight, año → edad con `birth_date`, quitar `menarcheYear`, `schemaVersion` 10), `CURRENT_SCHEMA_VERSION = 10`, `Anamnesis.menarcheAge`, `PatientFields` (8–18 y no mayor que la edad actual), normalizador; tests: migración (con y sin nacimiento, resultado no positivo, año inválido → aborta), validación de la edad, ITs

- [x] 1.4 `PatientFields`: "Sí" con sexo femenino y edad actual menor de 8 → error en `content.anamnesis.menarche`; tests

## 2. Contrato y frontend

- [x] 2.1 Regenerar `contracts/openapi.json` y el cliente orval
- [x] 2.2 Zod `lipSealMm: decimal(0, 20, "mm")`; `Step2Facial`: `MeasureField` "Separación interlabial" solo con "Presenta"; `PrintFacialSection`: medida en la línea 4
- [x] 2.3 `RecordForm`: al cambiar de paso, vista al inicio sin animación y foco en el título del paso (no en el primer render ni si el paso no cambia)
- [x] 2.5 Edad de la 1ª menstruación: Zod (8–18, no mayor que la edad actual), `Step1Patient` (`MeasureField` en años), `PrintPatientSection` ("Edad: N años"); tests
- [x] 2.6 `ChoiceField.disabledValues`; `Step1Patient`: "Sí" deshabilitado con aviso si la paciente tiene menos de 8 años; Zod con el mismo error; tests
- [x] 2.4 Tests: campo visible solo con "Presenta", rango y decimal en el schema, hoja impresa con y sin medida; cambio de paso con `scrollTo` al inicio y foco en el título, sin desplazamiento al abrir ni con errores; `pnpm validate` en verde

## 3. Docs

- [x] 3.1 `docs/domain.md`: análisis facial con la medida del sellado labial; `menarcheAge` y `schemaVersion` 10
- [x] 3.2 Al archivar: `docs/vision.md` ✅
