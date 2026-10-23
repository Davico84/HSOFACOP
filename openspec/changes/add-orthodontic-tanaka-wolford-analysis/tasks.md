> Rama `change/add-orthodontic-tanaka-wolford-analysis` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`. Las hojas impresas se revisan página por página antes de codearlas.

## 0. Revisión

- [x] 0.1 HTML local de revisión de las dos hojas en `docs/pdf/` (fuera del repo: guía, campos y preview con datos de ejemplo) y respuestas del usuario volcadas a spec/design

## 1. Backend

- [x] 1.1 `TanakaAnalysis` y `WolfordAnalysis` en `ModelAnalysis` con validación (`MAX_ARCH_SUM_MM` 199,9; `@Digits` 2/3 enteros, un decimal), `empty()` y `schemaVersion` 11; el normalizador rellena los bloques que faltan sin tocar los existentes
- [x] 1.2 Tests de datos: guardar y leer los dos análisis ("Datos de Tanaka-Johnston", "Datos de Wolford"); cada suma fuera de rango o con dos decimales → `400` en su campo ("Suma fuera de rango" de ambos)
- [x] 1.3 Tests de compatibilidad: una historia completa `schemaVersion` 10 (Moyers, Nance, Bolton y un ancho histórico fuera de rango) abre con todos los campos iguales, sube a 11 con los bloques nuevos vacíos, se guarda sin pérdida si es válida y rechaza solo el campo inválido si no ("Historia anterior", "Historia anterior con un ancho fuera de rango"); POST/PUT con los bloques ausentes, nulos y con sumas escritas; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el cliente orval; `tanaka` y `wolford` con la misma obligatoriedad/nulabilidad efectiva que los bloques existentes; `ContractDriftIT` en verde
- [ ] 2.2 Schema Zod (paridad exacta de rangos y mensajes por campo) con tests de rango y decimales
- [ ] 2.3 `tanaka.ts` / `wolford.ts` con tests por scenario: "Espacio previsto", "Redondeo", "Sin suma", "Discrepancias", "Falta una suma", "Piezas de cada suma", "Faltan anchos", "Ancho fuente fuera de rango", "Tanaka no usa los incisivos de Nance ni de Bolton", redondeo de negativos
- [ ] 2.4 `SuggestedMeasureField` genérico en `core/components/form` con su test: sugerida con nota, "Suma escrita por el tratante", "Usar el de …" fija nulo, "Borrar una suma escrita", nota con `aria-describedby`
- [ ] 2.5 Paneles "Fórmula de Tanaka-Johnston" (tras Moyers) y "Análisis de Wolford" (tras Bolton); `FilledStatus` con los dos bloques y función propia en `filled.ts`. Tests: "Suma tomada de Moyers", "El valor sugerido sigue a la medición", "Lo sugerido no cuenta como dato" (panel vacío, solo sugerencia, suma escrita, interpretación), "Ver una sugerencia no modifica la historia" (`isDirty`, `filledSteps` y autoguardado sin cambios)
- [ ] 2.6 Hojas impresas `PrintTanakaSection` (tras Moyers) y `PrintWolfordSection` (tras Bolton) con los valores efectivos. Tests: "Hoja de Tanaka-Johnston", "Hoja de Wolford", "Grilla de anchos en la hoja de Wolford", "Hoja con una suma vacía" (resultado "—"), "Hoja impresa de Nance" (tras Tanaka)
- [ ] 2.7 Impresión real con Edge headless + PDF: dos páginas físicas más que antes, Tanaka inmediatamente tras Moyers y Wolford tras Bolton, fórmulas y celdas vacías, y la marca "AVANCE · N de 7" con el mismo N ("Dos hojas más"); `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: Tanaka-Johnston y Wolford en el glosario y en el contenido de la historia (`schemaVersion` 11)

## Workflow follow-up

- Al archivar: `docs/vision.md` ✅ y specs sincronizadas.
