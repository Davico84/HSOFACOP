## Why

Tres ajustes del formulario de la historia pedidos tras el uso de prueba:

1. **Sellado labial**: en el análisis facial, la pregunta "4. Sellado labial" solo registra Presenta / No presenta. La guía indica que con labios relajados hay **1 a 3 mm** entre el borde inferior del labio superior y el superior del inferior: cuando el tratante marca **Presenta**, necesita registrar esa medida, y hoy no hay dónde.
2. **Cambio de paso**: al pasar de un paso a otro, la página queda a la misma altura. Si se terminó de llenar el paso 4 abajo de todo y se pasa al 5, el 5 aparece por el final y hay que subir a mano todo el paso.
3. **Edad de la primera menstruación**: hoy se registra el año (`1900`…), pero lo que se sabe es la **edad** a la que ocurrió (13, 14, 15 años). Además el campo del año arrancaba en 1900 y marcaba error.

## What Changes

- Nuevo campo **"Separación interlabial (mm)"** en "4. Sellado labial", visible **solo con "Presenta"**: número de **0 a 20 mm con a lo sumo un decimal**, **opcional**.
- Si la respuesta cambia a "No presenta" o se borra, la medida se oculta y se **descarta al guardar** (como los demás campos condicionados).
- **Hoja impresa**: con "Presenta" y medida, junto a la pregunta se imprime la medida (p. ej. "2,5 mm").
- **Cambio de paso al inicio**: al cambiar de paso (Siguiente, Anterior, la lista de pasos o el panel en celular), la vista vuelve al inicio de la página y el título del paso nuevo recibe el foco, para que el lector de pantalla lo anuncie. Al abrir o recargar una historia no se mueve la vista.
- **Edad de la primera menstruación** en lugar del año: entero de **8 a 18 años**; con fecha de nacimiento, no mayor que la edad actual de la paciente. Si la paciente tiene fecha de nacimiento y hoy es menor de 8 años, "Sí" en "¿La 1ª menstruación ya ocurrió?" queda deshabilitado (y el servidor lo rechaza). En pantalla "Edad de la 1ª menstruación" (años) y en la hoja impresa "Edad: 13 años".
- **Migración `V17`**: el año guardado pasa a edad = año − año de nacimiento; sin fecha de nacimiento o con resultado no positivo, el dato queda vacío (la respuesta "Sí" se conserva). `schemaVersion` 10. **BREAKING (contrato)**: `Anamnesis.menarcheYear` → `menarcheAge`.
- **Contrato**: `FacialAnalysis.lipSealMm` (decimal, opcional). Cambio aditivo: las historias existentes no tienen el dato y siguen igual; sin migración de datos.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevos requisitos "Medida del sellado labial" y "Cambio de paso al inicio del paso"; modificado "Secciones clínicas de la fase 1" (edad de la primera menstruación).

## Impact

- Backend: migración `V17`, `RecordContent.CURRENT_SCHEMA_VERSION = 10`, `Anamnesis.menarcheAge`, `PatientFields` (validación de la edad); `FacialAnalysis` (campo con `@DecimalMin("0") @DecimalMax("20") @Digits(integer = 2, fraction = 1)`), `RecordNormalizer` (descarta la medida sin "Presenta"), tests.
- Contrato `contracts/openapi.json` y cliente orval.
- Frontend: `RecordForm` (vista al inicio y foco en el título al cambiar de paso); schema Zod (`decimal(0, 20, "mm")`), `Step2Facial` (`MeasureField` condicionado), `PrintFacialSection`, tests.
- Docs: `docs/domain.md` (análisis facial y edad de la primera menstruación).

### Non-goals

- Medidas en otras preguntas del análisis facial.
- Hacer obligatoria la medida.
