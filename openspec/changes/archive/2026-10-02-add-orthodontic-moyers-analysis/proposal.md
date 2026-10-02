## Why

Segundo análisis de modelos de la fase 2 de `orthodontic-records` (uno por change, decisión del usuario): la **ficha para el análisis de Moyers** (pág. 6 del PDF). Hoy se llena a mano y en el PDF la ficha y su "Tabla 2" son una imagen de baja resolución; el tratante además busca el espacio requerido en una tabla impresa aparte.

## What Changes

- Bloque **"Análisis de Moyers"** en el paso 5 "Análisis de modelos", debajo del análisis transversal.
- **Fecha** del análisis escrita por el tratante; puede ser anterior al inicio del tratamiento. Nombre y edad se toman de la historia.
- Ancho mesiodistal de **42, 41, 31 y 32** (mm, 1 decimal) y **suma de anteriores** calculada.
- **Espacio disponible** por arcada y lado (mandíbula der./izq., maxilar der./izq.), escrito a mano.
- **Espacio requerido calculado** con la tabla de Moyers al **75 %** (tabla única, sin distinguir sexo): la suma se redondea al 0,5 mm más cercano; fuera de 19,5–29,0 mm no se calcula y se avisa.
- **Diferencia** = disponible − requerido, por arcada y lado.
- **Tabla 2 · Predisposición de apiñamiento**: el odontólogo escribe el resultado en cada fila (Positivo, Nulo, Negativo), guiándose por las diferencias calculadas (revisión del usuario).
- Interpretación (texto libre).
- Impresión: hoja "FICHA PARA EL ANÁLISIS DE MOYERS" después de la del análisis transversal (11 hojas), con las tablas del PDF reconstruidas como tablas.
- Las historias guardadas siguen válidas: la subsección llega vacía (`schemaVersion` 4 sin migración de datos).

## Non-goals

- Nance y Bolton (págs. 7 y 9): un change cada uno.
- Otros niveles de probabilidad de Moyers o tablas por sexo.
- Interpolar la tabla.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: se añade el análisis de Moyers con sus cálculos y su hoja impresa.

## Impact

- **Backend**: records `MoyersAnalysis` (+ incisivos y espacio disponible) en `ModelAnalysis.moyers` (`schemaVersion` 4), Bean Validation, normalización; contrato regenerado.
- **Frontend**: bloque Moyers en el paso 5, tabla de Moyers 75 % en una constante, cálculos puros con test, sección de impresión.
- **Docs**: `docs/vision.md` (estado), `docs/domain.md` al archivar.
