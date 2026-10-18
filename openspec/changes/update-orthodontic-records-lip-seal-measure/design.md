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

### Cambio de paso al inicio
- La página se desplaza con la ventana (no hay contenedor con scroll propio; la cabecera no es fija).
- En `RecordForm`, un efecto que depende de `step` y **omite el primer render** (ref con el paso anterior): al cambiar de paso, `window.scrollTo({ top: 0, behavior: "auto" })` (sin animación: es un cambio de página, no un recorrido) y foco en el título del paso (`<h2 tabIndex={-1}>`, `focus({ preventScroll: true })`, `outline-none`).
- No choca con los errores: cuando el paso tiene errores o el guardado falla, el paso no cambia y el efecto no corre. El remontaje por una actualización desde otro dispositivo monta en el mismo paso: es un primer render y tampoco corre.
- El aviso de historia cambiada mantiene su propio desplazamiento (aparece sin cambio de paso).

### Edad de la primera menstruación
- **Campo**: `Anamnesis.menarcheAge: Integer` reemplaza a `menarcheYear` (BREAKING para el contrato; único cliente, el frontend).
- **Validación** (backend `PatientFields` y Zod iguales): entero de 8 a 18 ("Usa una edad entre 8 y 18 años."); con fecha de nacimiento, no mayor que la edad actual (años cumplidos a hoy, reloj de la app): "La edad de la primera menstruación no puede superar la edad actual de la paciente."
- **Formulario**: `MeasureField` "Edad de la 1ª menstruación" con unidad "años", `step` 1, `min` 8, `max` 18: el campo arranca vacío y las flechas se mueven dentro del rango (se acaba el 1900).
- **Impresión**: "Edad:" con "13 años".
- **Migración `V17`** (transaccional, preflight primero como V16):
  1. preflight: si algún `anamnesis.menarcheYear` presente no es `null` ni JSON number entero, aborta con los ids;
  2. con fecha de nacimiento y año: `menarcheAge = menarcheYear − extract(year from birth_date)` si el resultado es > 0; si no, sin edad;
  3. se quita siempre `menarcheYear`;
  4. `schemaVersion` = `GREATEST(…, 10)` y `RecordContent.CURRENT_SCHEMA_VERSION = 10`.
  El resultado puede caer fuera de 8–18 (dato viejo raro): se conserva y el formulario lo marcará al guardar, en vez de perderlo.

## Risks / Trade-offs

- Contrato con un campo nuevo: frontend y backend se despliegan casi juntos; un frontend nuevo contra un backend viejo enviaría un campo desconocido. Se despliegan en el mismo merge (backend con auto-deploy, ~10 min); uso real aún en prueba.
