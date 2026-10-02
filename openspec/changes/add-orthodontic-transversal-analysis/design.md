## Context

Fase 2 de la historia de ortodoncia, un análisis por change (decisión del usuario). Este cubre la pág. 5 del PDF. Revisado con el usuario en `docs/pdf/revision-fase2-01-transversal.html` (local): diferencias automáticas con el promedio y con las normas, ancho X ideal a mano, sin tolerancia, ubicado después del análisis oclusal.

## Goals / Non-Goals

**Goals:** registrar el análisis transversal con cálculos derivados y su hoja impresa; dejar la sección "análisis de modelos" lista para que Moyers, Nance y Bolton se agreguen como subsecciones.

**Non-Goals:** ver proposal.

## Decisions

### D1. Sección `models` con subsección `transversal`
`RecordContent` gana `models: ModelAnalysis { transversal: TransversalAnalysis }` (Moyers, Nance y Bolton se sumarán como `moyers`, `nance`, `bolton`). `schemaVersion` pasa a 3. Sin migración: el normalizador rellena la sección vacía (como las demás secciones).

`TransversalAnalysis`: `intercanineUpper`, `intercanineLower`, `intermolarUpper`, `intermolarLower`, `walaWidth`, `xPcWidth`, `xPrimePcWidth`, `xIdealWidth` (decimal 0–99,9, 1 decimal) · `walaToEv { canine, firstPremolar, secondPremolar, firstMolar, secondMolar }` (mismo rango) · `interpretation` (texto largo ≤ 4000).

### D2. Cálculos derivados en el frontend, no guardados
Las diferencias (AMS/AMI vs promedio por sexo; WALA–EV vs norma) se calculan con funciones puras (`utils/transversal.ts`) a partir de lo guardado y del sexo de la historia; no se persisten, así siempre son coherentes con los datos actuales. Normas y promedios viven en una constante única (`config/transversal.ts`) que usan formulario e impresión. Redondeo a 1 decimal; signo explícito (+0,6 / −0,3). **Alternativa** descartada: calcular en el backend y devolverlo en la respuesta (más contrato y sin ganancia: es presentación).

### D3. Paso 5 y renumeración
`RECORD_STEPS` pasa a 8 entradas con "Análisis de modelos" en la posición 5. Una URL `?paso=` antigua queda corrida un paso desde el 5; se acepta (la app no guarda enlaces a pasos).

### D4. Impresión
`PrintModelsSection` (hoja nueva tras el oclusal): título "ANÁLISIS DE MODELOS", subtítulo centrado "Análisis Transversal de los Modelos", Paciente/Edad/Sexo, tabla de anchos con "(promedio X mm · ±d)", la nota de referencia de promedios, fila del borde WALA, tabla WALA–EV (pieza · norma · medido · diferencia) e interpretación. Reglas de la fase 1: etiquetas 11 pt con ":", datos 10 pt sin líneas.

## Risks / Trade-offs

- [Renumerar pasos desplaza `?paso=` de enlaces viejos] → La app no guarda enlaces a pasos; impacto mínimo.
- [Promedios y normas fijos en código] → Vienen del PDF de la clínica; si cambian, se editan en una constante.

## Migration Plan

Sin migración de datos (`schemaVersion` 3 solo añade la sección; el normalizador la rellena vacía).
