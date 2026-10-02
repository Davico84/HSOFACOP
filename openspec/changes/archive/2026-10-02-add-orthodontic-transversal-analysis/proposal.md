## Why

La historia clínica de ortodoncia (fase 1, `orthodontic-records`) no cubre todavía el **análisis de modelos** del PDF de la clínica (págs. 5–9). Hoy se sigue llenando a mano, y en el PDF parte de esas páginas son imágenes de baja resolución. Se digitaliza uno a uno (decisión del usuario); este change cubre el primero: **Análisis transversal de los modelos** (pág. 5).

## What Changes

- Nuevo paso del formulario **"Análisis de modelos"**, ubicado **después del análisis oclusal** como en el PDF: pasa a ser el **paso 5** y radiográfico, diagnóstico y firmas pasan a 6, 7 y 8 (el formulario tiene 8 pasos).
- Medidas en mm (1 decimal): AIS, AII, AMS, AMI; ancho borde WALA, ancho X Pc, ancho X´ Pc y ancho X ideal (escritos a mano); distancias WALA–EV de canino, 1er y 2do premolar, 1er y 2do molar inferiores; interpretación (texto libre).
- **Cálculos automáticos** (pantalla e impresión): diferencia del AMS y AMI con el promedio intermolar **según el sexo del paciente** (maxilar 54,0 / 52,4 mm; mandibular 47,2 / 46,1 mm), y diferencia de cada distancia WALA–EV con su norma (0,6 / 0,8 / 1,3 / 2,0 / 2,2 mm). Sin tolerancia: solo se muestra la diferencia.
- Paciente, edad y sexo del encabezado se toman de la historia (no se reescriben).
- Impresión: hoja "ANÁLISIS DE MODELOS · Análisis Transversal de los Modelos" después del análisis oclusal, con la tipografía y reglas de la fase 1. El encabezado, que en el PDF es imagen, se reconstruye como texto.
- Las historias guardadas siguen válidas: la sección nueva llega vacía (`schemaVersion` 3 sin migración de datos).

## Non-goals

- Moyers, Nance y Bolton (págs. 6, 7 y 9): un change cada uno, a continuación.
- Fórmula del "ancho X ideal" (se escribe a mano por decisión del usuario).
- Marcar valores fuera de rango con una tolerancia.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: el formulario pasa de 7 a 8 pasos (análisis de modelos tras el oclusal) y se añade el análisis transversal de los modelos con sus cálculos y su hoja impresa.

## Impact

- **Backend**: records `ModelAnalysis` / `TransversalAnalysis` dentro de `RecordContent` (`schemaVersion` 3), Bean Validation (0–99,9 mm, 1 decimal), normalización; contrato regenerado.
- **Frontend**: paso 5 nuevo (los pasos 5–7 se renumeran a 6–8), cálculos puros con test, sección de impresión.
- **Docs**: `docs/vision.md` (estado), `docs/domain.md` al archivar.
