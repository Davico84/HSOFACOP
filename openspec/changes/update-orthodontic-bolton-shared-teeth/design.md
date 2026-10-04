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

Cómo resuelve cada pieza (es el centro del cambio en el frontend):

| Pieza | `boltonWidthPath(t)` (ruta del formulario) | `boltonWidth(models, t)` (lectura) |
|---|---|---|
| 16, 26, 46, 36 | `content.models.bolton.firstMolars.toothNN` | `models.bolton.firstMolars` |
| 12, 11, 21, 22, 42, 41, 31, 32 | `content.models.bolton.incisors.toothNN` (antes: Nance) | `models.bolton.incisors` (antes: `nance.upperWidths`/`lowerWidths`) |
| 13, 14, 15, 23, 24, 25 | `content.models.nance.upperWidths.toothNN` | `models.nance.upperWidths` |
| 33, 34, 35, 43, 44, 45 | `content.models.nance.lowerWidths.toothNN` | `models.nance.lowerWidths` |

`BOLTON_INCISORS` y `SHARED_WITH_NANCE` son las listas que deciden la fila. Cualquier pieza fuera de las 24 es un error de programación (`throw`). En la grilla se sombrean solo las compartidas y el aviso usa el texto del usuario. Nance no cambia: sigue leyendo y escribiendo sus 10 piezas por arcada.

### D3. Rango de pieza 4,0–13,0 mm
- **Backend:** `ContentLimits.MIN_TOOTH_MM = "4.0"` y `MAX_TOOTH_MM = "13.0"`, aplicados a `LowerIncisors` (Moyers), `UpperArchWidths`/`LowerArchWidths` (Nance), `FirstMolarWidths` y `BoltonIncisors` (Bolton).
- **Frontend:** `toothMm = decimal(4, 13, "mm")` en Zod con los mismos campos, y `NumberInput min={4} max={13}` en esas celdas. Las flechas parten de 4,0 al estar vacío y no salen del rango.
- **Sin cambio de rango:** el espacio disponible (Moyers), el SA (Nance) y el transversal siguen con `modelMm` (0–99,9).

### D4. Migración V10
Abarca a toda historia con al menos un incisivo en `content.models.nance.upperWidths`/`lowerWidths`, tenga o no `models.bolton`. Hasta ahora la grilla de Bolton mostraba esos valores en cualquier historia, también en las anteriores a `schemaVersion` 6.
- Si faltan `models.bolton` o `bolton.incisors`, los crea (`{}`). `models` siempre existe desde V8.
- Copia cada incisivo (12, 11, 21, 22 de `upperWidths`; 42, 41, 31, 32 de `lowerWidths`) solo si Bolton aún no lo tiene y el de Nance no es `null`.
- Sube `schemaVersion` a 7 solo en las filas que toca. Las demás las completa el normalizador al leerlas.
- Idempotente: una segunda pasada no cambia nada. Usa funciones `pg_temp`, como V9. IT con casos con Bolton, sin Bolton, sin incisivos y con incisivos ya en Bolton.

### D5. Valores guardados fuera de rango (frontend)
Los valores iniciales del formulario no se validan: Zod corre al tocar el campo (`mode: "onTouched"`) y al guardar. Una historia con un ancho fuera de 4,0–13,0 se abre y lo muestra sin error. Al guardar, el error aparece en ese campo; si está en un panel cerrado, el paso 5 lo abre (comportamiento ya existente). El backend tampoco valida al leer: el normalizador no aplica Bean Validation. Lo cubre un test.

## Risks / Trade-offs

- **[El mismo incisivo puede tener un valor en Nance y otro en Bolton]** → Es la decisión clínica del usuario. Cada análisis mide los suyos.
- **[Datos guardados con anchos fuera de 4,0–13,0]** → Solo hay datos de desarrollo. Al guardar se piden corregidos.

## Migration Plan

V10 (Flyway), idempotente. Rollback: los incisivos copiados a Bolton quedan sin uso, pero no estorban.
