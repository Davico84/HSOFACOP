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
- En `ModelAnalysis` como `tanaka` y `wolford` (con `empty()`), con la misma obligatoriedad en el contrato que los bloques existentes; `schemaVersion` 11. Sin migración de base de datos ni del JSON: solo normalización al leer y versión 11 al guardar.
- Validación backend: `MAX_ARCH_SUM_MM = "199.9"`; `@DecimalMin("0")` en todas; `@DecimalMax(MAX_MODEL_MM)` + `@Digits(integer = 2, fraction = 1)` en la suma de Tanaka y en las de 6 piezas; `@DecimalMax(MAX_ARCH_SUM_MM)` + `@Digits(integer = 3, fraction = 1)` en las de 12. Frontend: `MAX_ARCH_SUM_MM = 199.9` y los mismos límites en Zod (nullish), con mensajes por campo "Mínimo 0 mm.", "Máximo 99,9 mm.", "Máximo 199,9 mm." y "Máximo un decimal." en la ruta exacta.
- **Compatibilidad**: al leer una historia `schemaVersion` 10, `RecordNormalizer` conserva todos los campos existentes sin corregir ni descartar nada, añade `tanaka` y `wolford` vacíos y devuelve versión 11. Un ancho histórico fuera de rango se muestra tal cual; al guardar, la validación marca solo ese campo y no se guarda hasta corregirlo (comportamiento vigente de Bolton).
- **Nulo = seguir la sugerencia; con valor = escrito por el tratante.** No se guarda la suma sugerida: así una corrección de un ancho de Moyers o Bolton se refleja sola mientras el tratante no haya escrito la suya. Historias anteriores: los bloques llegan nulos → sumas sugeridas, interpretación vacía; ningún dato existente cambia.

### Sumas sugeridas (frontend, `records/utils/tanaka.ts` y `wolford.ts`)
- Tanaka lee **solo** `models.moyers.lowerIncisors` (42, 41, 31, 32): es la fuente clínica vigente de la suma de incisivos inferiores de Moyers; no lee los duplicados de Nance ni los incisivos propios de Bolton.
- Wolford sigue la convención de piezas de Bolton (`UPPER_BOLTON_TEETH`, `LOWER_BOLTON_TEETH` y sus anteriores): 12 maxilares 16,15,14,13,12,11,21,22,23,24,25,26; 12 mandibulares 46,45,44,43,42,41,31,32,33,34,35,36; 6 maxilares 13,12,11,21,22,23; 6 mandibulares 43,42,41,31,32,33. Incisivos y primeros molares salen de `models.bolton`, caninos y premolares de `models.nance` (piezas compartidas).
- Una pieza fuente sirve solo si es numérica, finita y está en 4,0–13,0 mm. Si alguna requerida falta → sugerencia nula con "Completa los anchos en … o escribe la suma"; si alguna está fuera de rango → nula con "Corrige los anchos fuera de rango o escribe la suma". El valor guardado nunca se modifica al abrir.
- Valor efectivo = escrito ?? sugerido. Cálculos en décimas (enteros) para no arrastrar errores de coma flotante; redondeo a un decimal con la mitad hacia arriba en magnitud (`23,3 → 22,7 / 22,2`; −0,85 → −0,9), sin `Math.round` directo sobre negativos. Constantes internas 10.5 / 1.1 / 1.3; en pantalla e impresión "10,5", "1,1" y "1,3".
- **Suma vacía**: no existe un "vacío a propósito" cuando hay sugerencia: nulo siempre significa usar la sugerencia. Para que una suma quede vacía deben faltar (o estar fuera de rango) anchos fuente. Borrar el campo pone nulo y vuelve a la sugerencia.
- **La sugerencia se deriva al pintar y nunca se escribe en react-hook-form.** Solo el teclado del tratante o "Usar el de …" llaman a `setValue`, y "Usar el de …" fija nulo, no el número. Con solo sugerencias, `isDirty`, `filledSteps` y el autoguardado no cambian.
- `SuggestedMeasureField` (genérico en `core/components/form`, sobre `MeasureField`): recibe `suggestedValue`, `sourceLabel` ("Moyers"), `sourceDescription` (la nota) y `onUseSuggested` además de las props de `MeasureField`; no importa nada de `records` ni conoce piezas. `tanaka.ts` / `wolford.ts` arman los textos. La nota va enlazada con `aria-describedby`; "Usar el de <fuente>" es un `type="button"` con nombre accesible completo ("Usar la suma calculada de Moyers").

### Paneles y estado del paso
- Panel "Fórmula de Tanaka-Johnston" tras Moyers y "Análisis de Wolford" tras Bolton, con su resultado calculado (como `MoyersSpaceTable`/`BoltonRatioBlock`) y la interpretación (`TextAreaField`).
- `FilledStatus.name` se amplía con `content.models.tanaka` y `content.models.wolford`. `filled.ts` usa para estos bloques una función propia que cuenta solo sumas escritas (no nulas) e interpretación, ignorando los valores efectivos derivados; las sugeridas no marcan el paso "con datos".

### Impresión
- `PrintTanakaSection` tras `PrintMoyersSection` y `PrintWolfordSection` tras `PrintBoltonSection`, cada una en página nueva con el título de la guía, nombre y edad, las fórmulas como en la guía (`MAX (___ / 2) + 11 = ___`, `Discrepancia total = Suma 12 Max ___ − (Suma 12 Mand ___ × 1,1)`) con los valores efectivos y la interpretación en renglones. Sin una suma, la fila y la fórmula se imprimen con las sumas disponibles y el resultado "—", sin signo.
- Decisiones de la revisión (0.1, HTML `docs/pdf/revision-fase3-0N-*.html`): Tanaka sin comparación con Moyers; título "FÓRMULA DE TANAKA-JOHNSTON"; interpretación en 3 renglones en ambas hojas; la hoja no indica si la suma fue sugerida o escrita; sin ayuda fija para interpretar Wolford. La hoja de Wolford incluye la grilla de la guía "Ancho mesiodistal de las 12 piezas" (dos filas: 16 → 26 y 46 → 36, con números de pieza) llena con los anchos de Bolton y Nance, solo lectura (casilla vacía si falta).
- La impresión gana exactamente dos páginas físicas; se mide con Edge headless antes y después (no se declara un total fijo).
- Antes de codear las hojas: revisión página por página con un HTML local generado en `docs/pdf/` (fuera del repo, como los PDF; guía, campos y preview), como en Moyers y Nance.

## Risks / Trade-offs

- **Suma sugerida que cambia sola**: si el tratante quería "congelar" la suma, debe escribirla; la nota lo deja claro.
- **No se puede dejar vacía una suma con sugerencia**: aceptado (borrar vuelve a la sugerida); el análisis sin interpretación sigue sin contar como dato.
- **Dos hojas más al imprimir**: más papel para quien imprime todo; coherente con "cada análisis en su hoja".
