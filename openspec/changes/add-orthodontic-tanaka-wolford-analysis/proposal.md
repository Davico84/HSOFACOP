## Why

La guía del módulo de ortodoncia interceptiva (`docs/HISTORIA CLINICA PARA MODULO ORTODONCIA INTERCEPTIVA Temp26.docx`) pide dos análisis de modelos que la historia aún no tiene: la **fórmula de Tanaka-Johnston** (predicción del espacio para caninos y premolares a partir de los incisivos inferiores) y el **análisis de Wolford** (discrepancia de tamaño dentario total y parcial). Hoy el alumno los haría a mano en papel aparte, aunque los anchos que usan ya están medidos en Moyers y Bolton.

## What Changes

- **Tanaka-Johnston** (paso 5 "Análisis de modelos", panel nuevo tras Moyers): suma de los cuatro incisivos inferiores, maxilar = suma ÷ 2 + 11 y mandibular = suma ÷ 2 + 10,5, calculados, e interpretación escrita.
- **Wolford** (panel nuevo tras Bolton): suma de 12 y de 6 piezas maxilares y mandibulares; discrepancia total = suma 12 max − suma 12 mand × 1,1 y parcial = suma 6 max − suma 6 mand × 1,3, calculadas, e interpretación escrita.
- **Sumas sugeridas y editables**: cada suma se toma sola de lo ya medido (Tanaka de los incisivos de Moyers; Wolford de las piezas de Bolton y Nance) con una nota que dice de dónde sale. El tratante puede escribir otro valor; entonces la nota lo indica y ofrece volver al valor calculado.
- **Impresión**: cada análisis en su propia hoja, como Moyers y Nance: "FÓRMULA DE TANAKA-JOHNSTON" tras la hoja de Moyers y "ANÁLISIS DE WOLFORD" tras la de Bolton.
- **Historias existentes**: no pierden nada; los análisis nuevos aparecen con las sumas sugeridas y sin interpretación (`schemaVersion` 11, sin migración de datos).

### Non-goals

- Reemplazar el formulario actual por el de la guía interceptiva completa (solo se suman estos dos análisis).
- Cambiar Moyers, Nance o Bolton, o sus cálculos.
- Tablas de referencia o rangos normales para interpretar Wolford (la interpretación la escribe el tratante).

## Capabilities

### New Capabilities
- (ninguna)

### Modified Capabilities
- `orthodontic-records`: dos análisis nuevos en el paso "Análisis de modelos" (datos, cálculos, sumas sugeridas e impresión).

## Impact

- Backend: `RecordContent` con `models.tanaka` y `models.wolford` (validación de rangos), `schemaVersion` 11; tests.
- Contrato `contracts/openapi.json` y cliente orval.
- Frontend: dos paneles en el paso 5 con sus cálculos y sumas sugeridas (schema Zod en paridad), dos hojas impresas nuevas.
- Docs: `docs/domain.md` (glosario y contenido), `docs/vision.md`.
