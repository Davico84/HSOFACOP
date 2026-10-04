## Why

Revisión clínica del análisis de Bolton: hoy Bolton comparte con Nance las 20 piezas de 15→25 y 45→35, incisivos incluidos, y el aviso dice que solo los primeros molares son propios de Bolton. El usuario pide que Bolton comparta con Nance **solo caninos y premolares**: los incisivos y los primeros molares son de Bolton. Además, los anchos mesiodistales aceptan hoy de 0 a 99,9 mm (y las flechas parten de 0,1), valores que ningún diente real mide.

Nance no cambia: sigue la ficha del PDF (Nance & Carey, de mesial a mesial del 1er molar, 10 piezas por arcada).

## What Changes

- **Bolton comparte con Nance solo caninos y premolares**: 13, 14, 15, 23, 24, 25 y 33, 34, 35, 43, 44, 45 (mismo dato, editable desde cualquiera de los dos análisis).
- **Incisivos propios de Bolton**: 12, 11, 21, 22 y 42, 41, 31, 32 se registran en Bolton, junto a los primeros molares 16, 26, 46 y 36. Nance conserva sus propios incisivos.
- **Aviso corregido** bajo la grilla: "Las piezas sombreadas (caninos y premolares) se comparten con el análisis de Nance: si cambias una aquí, cambiará allá. Los incisivos y los primeros molares corresponden exclusivamente al cálculo de Bolton."
- **Rango real del ancho de una pieza: 4,0–13,0 mm** (1 decimal, paso 0,1) en todos los anchos mesiodistales: incisivos de Moyers, anchos de Nance y de Bolton. En pantalla y en el backend; las flechas parten de 4,0 y no salen del rango. Los espacios disponibles (Moyers), el SA (Nance) y las medidas del transversal siguen en 0–99,9.
- Historias con Bolton ya guardado: una migración copia a Bolton los incisivos que tenían en Nance, para que no se pierda lo que se veía en la grilla de Bolton.

## Non-goals

- Cambiar el análisis de Nance (piezas, cálculos o ficha).
- Validar en el backend que la suma o la relación tengan sentido clínico.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: Bolton comparte con Nance solo caninos y premolares y registra sus propios incisivos; los anchos de pieza pasan a 4,0–13,0 mm en Moyers, Nance y Bolton.

## Impact

- **Backend**: `BoltonAnalysis` gana `incisors` (`schemaVersion` 7); límites `MIN_TOOTH_MM`/`MAX_TOOTH_MM` en los anchos de pieza; migración V10 (copia incisivos de Nance a Bolton); contrato regenerado.
- **Frontend**: `config/bolton.ts` (piezas compartidas y propias), grilla y aviso de Bolton, schema Zod con el rango de pieza, `NumberInput` con `min`/`max` en los anchos de pieza.
- **Docs**: `docs/domain.md` al archivar.
