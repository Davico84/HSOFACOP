## Why

Cuarto y último análisis de modelos de la fase 2 de `orthodontic-records`: el **análisis de Bolton** (pág. 9 del PDF), que mide la discrepancia de tamaño dentario entre la arcada superior y la inferior. Hoy se llena a mano sobre una ficha en inglés que en el PDF es una imagen.

## What Changes

- Panel 4 **"Análisis de Bolton"** en el paso 5 "Análisis de modelos", tras Nance. En español.
- **Fecha** del análisis escrita por el tratante (puede ser anterior al tratamiento, no futura).
- **Anchos mesiodistales de 12 piezas por arcada** (de 1er molar a 1er molar, R…L): los de 15→25 y 45→35 **se reusan de Nance** (mismo dato, editable desde cualquiera de los dos paneles); Bolton solo agrega los **1eros molares 16, 26, 46 y 36**.
- **Todo calculado**, para la **relación total** (12 piezas; media 91,3 %, rango 87,5–94,8) y la **relación anterior** (6 piezas, 13→23 / 43→33; media 77,2 %, rango 74,5–80,4):
  - sumas mandibular y maxilar, relación = suma mandibular ÷ suma maxilar × 100, y si está dentro del rango;
  - sobre la media (exceso mandibular): real e ideal mandibular (suma maxilar × 0,913 / × 0,772) y diferencia real − ideal;
  - bajo la media (exceso maxilar): real e ideal maxilar (suma mandibular ÷ 0,913 / ÷ 0,772) y diferencia real − ideal;
  - en la media exacta no se llena ningún lado.
- La fórmula se dibuja como en el PDF: suma mandibular sobre la línea de fracción y suma maxilar debajo, "= … × 100 = … %".
- Interpretación (texto libre).
- Impresión: hoja "ANÁLISIS DE BOLTON" después de la de Nance (13 hojas), en español.
- Las historias guardadas siguen válidas: la subsección llega vacía (`schemaVersion` 6 sin migración).

## Non-goals

- Otras normas o tablas de Bolton.
- Anchos independientes de los de Nance.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: se añade el análisis de Bolton con sus cálculos y su hoja impresa.

## Impact

- **Backend**: records `BoltonAnalysis` / `FirstMolarWidths` en `ModelAnalysis.bolton` (`schemaVersion` 6), Bean Validation, normalización; contrato regenerado.
- **Frontend**: panel Bolton en el paso 5 (grilla de 12 + 12 piezas que comparte campos con Nance), cálculos puros con test, `BoltonFormula` (fracción), sección de impresión.
- **Docs**: `docs/vision.md` (estado), `docs/domain.md` al archivar.
