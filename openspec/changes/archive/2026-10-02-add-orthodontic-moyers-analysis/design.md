## Context

Fase 2 de la historia de ortodoncia, un análisis por change. Este cubre la pág. 6 del PDF. Revisado con el usuario en `docs/pdf/revision-fase2-02-moyers.html` (local): requerido calculado con la tabla de Moyers al 75 % (única, sin sexo; valores confirmados por el usuario), redondeo de la suma al 0,5 más cercano, predisposición de apiñamiento escrita por el odontólogo (cambio tras la primera implementación), fecha escrita por el tratante (puede ser anterior al tratamiento).

## Goals / Non-Goals

**Goals:** registrar la ficha de Moyers con requerido y diferencias calculados, la predisposición escrita por el odontólogo, y su hoja impresa.

**Non-Goals:** ver proposal.

## Decisions

### D1. Subsección `models.moyers`
`ModelAnalysis` gana `moyers: MoyersAnalysis`. `schemaVersion` pasa a 4; sin migración (el normalizador rellena la subsección vacía).

`MoyersAnalysis`: `analysisDate` (fecha, no futura; sin relación con el inicio de tratamiento) · `lowerIncisors { tooth42, tooth41, tooth31, tooth32 }` · `availableSpace { mandibleRight, mandibleLeft, maxillaRight, maxillaLeft }` (decimal 0–99,9 mm, 1 decimal, como el transversal) · `crowdingPositive` / `crowdingNeutral` / `crowdingNegative` (texto corto) · `interpretation` (≤ 4000).

### D2. Cálculos en el frontend, no guardados
Como en el transversal (D2 de `add-orthodontic-transversal-analysis`): suma, requerido y diferencias se derivan con funciones puras (`utils/moyers.ts`) de lo guardado; no se persisten.
- **Suma**: solo con los 4 incisivos; si falta alguno no hay suma ni requerido.
- **Requerido**: suma redondeada al 0,5 más cercano (media hacia arriba: 23,25 → 23,5) y búsqueda en `MOYERS_75` (`config/moyers.ts`, 19,5–29,0 mm, maxilar y mandibular). Fuera de rango → `null` + aviso "Fuera de la tabla de Moyers (19,5–29,0 mm)". El mismo valor aplica a ambos lados de la arcada.
- **Diferencia**: disponible − requerido, 1 decimal con signo; vacía si falta alguno.
- **Predisposición** (Tabla 2): no se calcula; tres textos cortos (`crowdingPositive`, `crowdingNeutral`, `crowdingNegative`, ≤ 200) que escribe el odontólogo.

Aritmética en décimas enteras para evitar errores de coma flotante en el redondeo.

### D3. Formulario
Bloque "Análisis de Moyers" en el paso 5 (sin paso nuevo). Fecha con selector, 4 medidas de incisivos con la suma en vivo, tabla 2×2 de espacio disponible con requerido y diferencia calculados en la misma tabla (entradas, requerido y diferencia alineados en la misma columna), Tabla 2 con un campo de texto por fila, interpretación.

### D4. Impresión
`PrintMoyersSection`, hoja nueva tras la del transversal: título "FICHA PARA EL ANÁLISIS DE MOYERS", Nombre (con línea) · Edad · Fecha, la ficha como tabla con bordes (incisivos y suma; mandíbula/maxilar × derecho/izquierdo; disponible/requerido/diferencia), "Tabla 2. Tabla de los resultados obtenidos en la diferencia." con lo escrito en cada fila, e INTERPRETACIÓN (3 líneas). Tipografía de la fase 1.

## Risks / Trade-offs

- [Tabla al 75 % fija en código] → Confirmada por el usuario; si cambia, se edita la constante.
- [El paso 5 se alarga] → Se separa con un subtítulo por análisis; Nance y Bolton se sumarán igual.

## Migration Plan

Sin migración de datos (`schemaVersion` 4 solo añade la subsección).
