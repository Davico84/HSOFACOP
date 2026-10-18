## Context

- `FacialAnalysis.lipSeal` es `Presence` (`PRESENT` / `ABSENT`), en `content.facial` (JSONB). El paso 2 lo muestra con `ChoiceField`, imagen de referencia y la ayuda "Con labios relajados hay 1 a 3 mm…".
- Las medidas del formulario usan `BigDecimal` con `@DecimalMin`/`@DecimalMax`/`@Digits(integer = 2, fraction = 1)` en el backend, `decimal(min, max, "mm")` en Zod y `MeasureField` en pantalla.
- Los campos condicionados se descartan en `RecordNormalizer` cuando su condición no se cumple (p. ej. la menarquia).

## Decisions

- **Campo**: `FacialAnalysis.lipSealMm: BigDecimal`, justo después de `lipSeal`. Validación `@DecimalMin("0") @DecimalMax("20") @Digits(integer = 2, fraction = 1)`; mensajes iguales a los de las demás medidas.
- **Condición**: `RecordNormalizer` guarda `lipSealMm` solo si `lipSeal == PRESENT`; si no, `null`.
- **Sin migración ni `schemaVersion` nuevo**: el campo es opcional y aditivo; el contenido existente no lo tiene y se lee como `null`. `CURRENT_SCHEMA_VERSION` sigue en 9.
- **Formulario**: `MeasureField` "Separación interlabial" con unidad "mm", `step` 0,1, `min` 0, `max` 20, debajo de la pregunta y solo con "Presenta" (`useWatch`). Zod: `decimal(0, 20, "mm")`.
- **Impresión**: con "Presenta" y medida, en la línea "4. SELLADO LABIAL:" a continuación de las opciones se imprime la medida con coma decimal ("2,5 mm"), con el mismo formateo de números del resto de la hoja.
- Alternativa descartada: guardar la medida aunque la respuesta sea "No presenta". El usuario indicó que la medida se registra solo con "Presenta".

## Risks / Trade-offs

- Contrato con un campo nuevo: frontend y backend se despliegan casi juntos; un frontend nuevo contra un backend viejo enviaría un campo desconocido. Se despliegan en el mismo merge (backend con auto-deploy, ~10 min); uso real aún en prueba.
