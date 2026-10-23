## Context

- Paso 5 "Análisis de modelos" (`Step5Models`): paneles plegables (`AccordionSection`) Transversal, Moyers, Nance y Bolton, con campos en `content.models.*` y cálculos en `records/utils/{moyers,nance,bolton}.ts` (no se guardan). Bolton guarda incisivos y primeros molares; caninos y premolares son los de Nance (`models.nance.upperWidths/lowerWidths`).
- Contenido de la historia: JSON tipado (`RecordContent`, `schemaVersion` 10). `RecordNormalizer` rellena con `empty()` lo que falta, así una historia vieja abre con los bloques nuevos vacíos; las historias antiguas no se migran por cada campo nuevo.
- Impresión: `RecordPrintDocument` encadena hojas (`PrintModelsSection`, `PrintMoyersSection`, `PrintNanceSection`, `PrintBoltonSection`…), cada una en página nueva, con fidelidad al PDF (memorias de impresión y revisión página por página).
- Estado del paso ("con datos"): `records/utils/filled.ts` no cuenta valores por defecto.
- La guía interceptiva no trae Bolton: ubica Tanaka bajo Moyers y Wolford tras Nance. Aquí Wolford va tras Bolton porque sus sumas salen de las piezas de Bolton y Nance.

## Goals / Non-Goals

**Goals:** registrar Tanaka-Johnston y Wolford con cálculos automáticos, sumas sugeridas desde lo medido y editables, y una hoja impresa propia para cada uno, sin tocar lo existente.

**Non-Goals:** formulario interceptivo completo, cambios en Moyers/Nance/Bolton, valores de referencia para interpretar Wolford.

## Decisions

### Datos (sin migración)
```java
record TanakaAnalysis(BigDecimal incisorSum, @Size(max = LONG_TEXT) String interpretation)
record WolfordAnalysis(BigDecimal upper12Sum, BigDecimal lower12Sum,
                       BigDecimal upper6Sum, BigDecimal lower6Sum,
                       @Size(max = LONG_TEXT) String interpretation)
```
- En `ModelAnalysis` como `tanaka` y `wolford` (con `empty()`); `schemaVersion` 11. Validación: `@DecimalMin("0")`, `@Digits(integer = 2/3, fraction = 1)` y `@DecimalMax` 99,9 (incisivos, 6 piezas) o 199,9 (12 piezas, constante nueva `MAX_ARCH_SUM_MM`).
- **Nulo = seguir la sugerencia; con valor = escrito por el tratante.** No se guarda la suma sugerida: así una corrección de un ancho de Moyers o Bolton se refleja sola mientras el tratante no haya escrito la suya. Historias anteriores: los bloques llegan nulos → sumas sugeridas, interpretación vacía; ningún dato existente cambia.

### Sumas sugeridas (frontend, `records/utils/tanaka.ts` y `wolford.ts`)
- Tanaka: suma de 42, 41, 31 y 32 de `models.moyers.lowerIncisors` (la misma suma que ya muestra Moyers); vacía si falta alguno.
- Wolford: 12 maxilares = 16 y 26 (Bolton) + 11, 12, 21, 22 (Bolton) + 13–15 y 23–25 (Nance); 12 mandibulares igual con 46/36, 41/42/31/32 y 33–35/43–45; 6 = de canino a canino (13–23 y 33–43) con las mismas fuentes. Vacía si falta cualquier pieza.
- Valor efectivo = escrito ?? sugerido. Cálculos con aritmética en décimas (enteros) para no arrastrar errores de coma flotante; redondeo a un decimal, la mitad hacia arriba (`23,3 → 22,7 / 22,2`).
- Campo `SuggestedMeasureField` (genérico en `core/components/form`, sobre `MeasureField`): muestra el valor efectivo; escribir fija el valor; bajo el campo, `FieldHint` "Tomada de …" o "Valor editado · <fuente> da 23,0 mm" con el botón "Usar el de <fuente>" (pone nulo). Borrar el campo vuelve a la sugerencia (no se puede dejar vacía una suma que tiene sugerencia; se acepta).

### Paneles y estado del paso
- Panel "Fórmula de Tanaka-Johnston" tras Moyers y "Análisis de Wolford" tras Bolton, con su resultado calculado (como `MoyersSpaceTable`/`BoltonRatioBlock`) y la interpretación (`TextAreaField`).
- `filled.ts`: solo cuentan las sumas escritas (no nulas) y la interpretación; las sugeridas no marcan el paso "con datos".

### Impresión
- `PrintTanakaSection` tras `PrintMoyersSection` y `PrintWolfordSection` tras `PrintBoltonSection`, cada una en página nueva con el título de la guía, nombre y edad, las fórmulas como en la guía (`MAX (___ / 2) + 11 = ___`, `Discrepancia total = Suma 12 Max ___ − (Suma 12 Mand ___ × 1,1)`) con los valores efectivos y la interpretación en renglones. Las hojas impresas pasan de 13 a 15.
- Antes de codear las hojas: revisión página por página con el HTML local (`docs/pdf/revision-pag-NN.html`: guía, campos y preview), como en Moyers y Nance.

## Risks / Trade-offs

- **Suma sugerida que cambia sola**: si el tratante quería "congelar" la suma, debe escribirla; la nota lo deja claro.
- **No se puede dejar vacía una suma con sugerencia**: aceptado (borrar vuelve a la sugerida); el análisis sin interpretación sigue sin contar como dato.
- **Dos hojas más al imprimir**: más papel para quien imprime todo; coherente con "cada análisis en su hoja".
