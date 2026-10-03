## Context

Último análisis de la fase 2 (pág. 9 del PDF). Revisado con el usuario en `docs/pdf/revision-fase2-04-bolton.html` (local): en español ("Relación total" o global y "Relación anterior"), con fecha, anchos de 15→25 y 45→35 reusados de Nance, todo calculado y la fórmula dibujada como fracción como en el PDF.

## Goals / Non-Goals

**Goals:** registrar Bolton con los cálculos completos sin volver a digitar los anchos de Nance, con su hoja impresa.

**Non-Goals:** ver proposal.

## Decisions

### D1. Subsección `models.bolton`
`ModelAnalysis` gana `bolton: BoltonAnalysis`; `schemaVersion` 6 sin migración (el normalizador la rellena vacía).

`BoltonAnalysis`: `analysisDate` (no futura) · `firstMolars { tooth16, tooth26, tooth46, tooth36 }` (decimal 0–99,9 mm, 1 decimal) · `interpretation` (≤ 4000). **Los anchos de 15→25 y 45→35 no se duplican**: se leen de `models.nance.upperWidths` / `lowerWidths`.

### D2. Anchos compartidos con Nance
La grilla de Bolton usa los mismos campos del formulario que Nance para las 20 piezas comunes (`content.models.nance.upperWidths.tooth15`…); editar una celda en un panel cambia el otro. Las celdas comunes se distinguen visualmente ("de Nance") y los molares son propios de Bolton. Un error de validación en una pieza común abre ambos paneles (ya lo hace el paso 5 por subsección con errores; las piezas comunes cuelgan de `nance`).

### D3. Cálculos (frontend, no guardados) — `utils/bolton.ts`
En décimas enteras, como Moyers y Nance:
- `total`: 12 inferiores (46→36) y 12 superiores (16→26); `anterior`: 43→33 y 13→23. Una suma es `null` si falta alguna pieza.
- `ratio = round1(mandibular ÷ maxilar × 100)`; `inRange` contra el rango.
- `ratio > media` → exceso mandibular: `idealMand = round1(maxilar × media/100)`, `diff = mandibular − idealMand`.
- `ratio < media` → exceso maxilar: `idealMax = round1(mandibular ÷ (media/100))`, `diff = maxilar − idealMax`.
- `ratio = media` → ningún lado.
Constantes en `config/bolton.ts`: total (12 piezas, media 91,3, rango 87,5–94,8), anterior (6 piezas, 77,2, 74,5–80,4).

### D4. Fórmula como en el PDF (`BoltonFormula`)
Componente de dominio: "Suma mandibular N" con su valor sobre una línea horizontal, "Suma maxilar N" debajo, y a la derecha "= {cociente} × 100 = {relación} %". Se usa en pantalla (tokens del tema) e impresión (negro).

### D5. Formulario e impresión
Panel `AccordionSection` 4: fecha, grilla R…L (superior arriba, inferior abajo) con `NumberInput compact`, y por cada relación: título con media y rango, fórmula, estado del rango (`SectionStatus`), y dos columnas (sobre / bajo la media) con real, ideal y diferencia en `ComputedValue`; la columna que no aplica, atenuada. `PrintBoltonSection` tras Nance con la misma estructura y tablas sombreadas.

## Risks / Trade-offs

- [Mismo dato editable en dos paneles] → Decisión del usuario para evitar doble digitación; se marca "de Nance".
- [Redondeo] → Relación e ideal a 1 decimal; la diferencia sale de los valores redondeados mostrados, para que cuadre a la vista.

## Migration Plan

Sin migración (`schemaVersion` 6 solo añade la subsección).
