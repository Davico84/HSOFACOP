## Context

Bolton (`add-orthodontic-bolton-analysis`) reusó de Nance las 20 piezas comunes. Revisión clínica del usuario: Bolton debe compartir con Nance solo caninos y premolares; los incisivos y los primeros molares son de Bolton. Nance se queda como está, porque sigue la ficha del PDF (Nance & Carey). Además, el ancho de una pieza real va de 4,0 a 13,0 mm.

## Goals / Non-Goals

**Goals:** corregir qué piezas comparte Bolton, guardar sus incisivos y acotar los anchos de pieza a valores reales, sin perder lo ya registrado.

**Non-Goals:** ver proposal.

## Decisions

### D1. Incisivos de Bolton
`BoltonAnalysis` gana `incisors: BoltonIncisors { tooth12, tooth11, tooth21, tooth22, tooth42, tooth41, tooth31, tooth32 }`. `firstMolars` no cambia. `schemaVersion` pasa a 7.
**Alternativa descartada:** un solo `ownWidths` con molares e incisivos, que obligaría a migrar `firstMolars`.

### D2. Qué piezas comparte Bolton (`config/bolton.ts`)
- **Compartidas con Nance:** `SHARED_WITH_NANCE = [15, 14, 13, 23, 24, 25, 45, 44, 43, 33, 34, 35]`. Leen y escriben `content.models.nance.{upper|lower}Widths.toothNN`.
- **Propias de Bolton:** primeros molares en `bolton.firstMolars` e incisivos en `bolton.incisors`.

`boltonWidthPath` y `boltonWidth` resuelven cada pieza según esa clasificación. En la grilla solo se sombrean las compartidas, y el aviso usa el texto del usuario.

### D3. Rango de pieza 4,0–13,0 mm
- **Backend:** `ContentLimits.MIN_TOOTH_MM = "4.0"` y `MAX_TOOTH_MM = "13.0"`, aplicados a `LowerIncisors` (Moyers), `UpperArchWidths`/`LowerArchWidths` (Nance), `FirstMolarWidths` y `BoltonIncisors` (Bolton).
- **Frontend:** `toothMm = decimal(4, 13, "mm")` en Zod con los mismos campos, y `NumberInput min={4} max={13}` en esas celdas. Las flechas parten de 4,0 al estar vacío y no salen del rango.
- **Sin cambio de rango:** el espacio disponible (Moyers), el SA (Nance) y el transversal siguen con `modelMm` (0–99,9).

### D4. Migración V10
Para cada historia con `content.models.bolton`, copia a `bolton.incisors` los incisivos que tenga en `nance.upperWidths`/`lowerWidths`, si el incisivo de Bolton no existe aún. El SQL es idempotente y con `pg_temp`, como V9. Sube `schemaVersion` a 7 solo en las que toca.
Un valor copiado fuera de 4,0–13,0 no rompe la lectura. Al guardar, la validación lo marca en su campo y el usuario lo corrige.

## Risks / Trade-offs

- **[El mismo incisivo puede tener un valor en Nance y otro en Bolton]** → Es la decisión clínica del usuario. Cada análisis mide los suyos.
- **[Datos guardados con anchos fuera de 4,0–13,0]** → Solo hay datos de desarrollo. Al guardar se piden corregidos.

## Migration Plan

V10 (Flyway), idempotente. Rollback: los incisivos copiados a Bolton quedan sin uso, pero no estorban.
