## Why

Tercer análisis de modelos de la fase 2 de `orthodontic-records` (uno por change): el **análisis de Nance & Carey · discrepancia óseo dentaria** (pág. 7 del PDF). Hoy se llena a mano; en el PDF la ficha y el dibujo de la arcada son una imagen de baja resolución.

## What Changes

- Panel 3 **"Análisis de Nance"** en el paso 5 "Análisis de modelos" (paneles plegables), tras Moyers.
- **Fecha** del análisis escrita por el tratante (puede ser anterior al tratamiento, no futura). Nombre y edad se toman de la historia.
- **SA · espacio disponible** (longitud de arco) superior e inferior, escrito a mano (mm, 1 decimal).
- **Ancho mesiodistal** de las 10 piezas de cada arcada, de mesial a mesial del 1er molar: 15→25 y 45→35.
- **ST · espacio requerido calculado**: total de las 10 piezas de cada arcada; si falta alguna, queda vacío y se avisa.
- **Discrepancia calculada** = SA − ST, por arcada; **conclusión** por arcada escrita por el odontólogo.
- **Dibujo de la arcada superior** (vista oclusal) redibujado en SVG: piezas 15→25 resaltadas, molares en gris, línea de mesial del 16 a mesial del 26. Colores del tema en pantalla; gris en la impresión.
- Interpretación (texto libre).
- Impresión: hoja "ANÁLISIS DE NANCE · DISCREPANCIA ÓSEO DENTARIA" después de la de Moyers (12 hojas), con las tablas del PDF reconstruidas. La pág. 8 del PDF (en blanco) no se imprime.
- Las historias guardadas siguen válidas: la subsección llega vacía (`schemaVersion` 5 sin migración).

## Non-goals

- Bolton (pág. 9): su propio change.
- Dibujo de la arcada inferior (decisión del usuario: solo la superior, como el PDF).
- Calcular la conclusión.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: se añade el análisis de Nance con sus cálculos, el dibujo de la arcada y su hoja impresa.

## Impact

- **Backend**: records `NanceAnalysis` (+ anchos por arcada) en `ModelAnalysis.nance` (`schemaVersion` 5), Bean Validation, normalización; contrato regenerado.
- **Frontend**: panel Nance en el paso 5, `ArchDiagram` (SVG), cálculos puros con test, sección de impresión.
- **Docs**: `docs/vision.md` (estado), `docs/domain.md` al archivar.
