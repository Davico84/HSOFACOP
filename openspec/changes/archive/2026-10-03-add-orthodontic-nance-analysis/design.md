## Context

Fase 2, un análisis por change. Este cubre la pág. 7 del PDF (la 8 está en blanco). Revisado con el usuario en `docs/pdf/revision-fase2-03-nance.html` (local): ST = suma automática de las 10 piezas (vacío si falta alguna), discrepancia calculada, conclusión escrita, arcada superior redibujada en SVG (aprobada), pág. 8 omitida.

## Goals / Non-Goals

**Goals:** registrar la ficha de Nance con ST y discrepancia calculados, el dibujo de la arcada y su hoja impresa, con el mismo patrón que Moyers.

**Non-Goals:** ver proposal.

## Decisions

### D1. Subsección `models.nance`
`ModelAnalysis` gana `nance: NanceAnalysis`; `schemaVersion` 5 sin migración (el normalizador rellena la subsección vacía).

`NanceAnalysis`: `analysisDate` (no futura) · `availableUpper`, `availableLower` (SA) · `upperWidths { tooth15, tooth14, tooth13, tooth12, tooth11, tooth21, tooth22, tooth23, tooth24, tooth25 }` · `lowerWidths { tooth45 … tooth35 }` (decimal 0–99,9 mm, 1 decimal) · `conclusionUpper`, `conclusionLower` (texto corto ≤ 200) · `interpretation` (≤ 4000).

### D2. Cálculos en el frontend, no guardados
Como Moyers: `utils/nance.ts` puro, en décimas enteras. ST de una arcada = suma de sus 10 anchos, `null` si falta alguno (aviso "Faltan piezas por medir"). Discrepancia = SA − ST con signo, vacía si falta SA o ST.

### D3. Dibujo de la arcada (`ArchDiagram`)
Componente SVG de dominio (`records/components/ArchDiagram.tsx`) con la geometría aprobada: 14 piezas (17→27) sobre una semielipse, contorno oclusal por tipo de pieza (incisivo, canino, premolar, molar) con sus surcos, números FDI, y línea punteada de mesial del 16 a mesial del 26. La geometría (posiciones, ángulos y contornos) se precalcula una vez y vive como datos en `config/archGeometry.ts`, generada por el script del boceto. Colores por tokens (`fill-primary/15`, `stroke-primary`…); variante `print` en escala de grises. `role="img"` con descripción.

### D4. Formulario
Panel `AccordionSection` 3 "Análisis de Nance": fecha, SA superior/inferior, dibujo + tabla de anchos por arcada (O.D. y medida; total calculado en caja bloqueada como Moyers), tabla resultado (SA, ST, discrepancia en cajas bloqueadas; conclusión con campo de texto), interpretación.

### D5. Impresión
`PrintNanceSection` tras Moyers: título "ANÁLISIS DE NANCE · DISCREPANCIA ÓSEO DENTARIA", Nombre · Edad · Fecha, "Análisis de Nance & Carey" con las filas 1 (SA) y 2 (ST), el dibujo junto a la tabla de anchos, la tabla resultado y la interpretación. Etiquetas sombreadas y valores en blanco (como Moyers).

## Risks / Trade-offs

- [El paso 5 crece con 20 medidas más] → Panel plegable; las tablas por arcada son compactas.
- [Dibujo ilustrativo, no anatómico] → Aprobado por el usuario como referencia.

## Migration Plan

Sin migración (`schemaVersion` 5 solo añade la subsección).
