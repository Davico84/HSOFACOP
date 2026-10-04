## Why

El indicador de los 8 pasos es una tira de botones arriba del formulario. Cumple, pero no dice nada del avance: no se sabe qué pasos tienen datos, cuáles están vacíos ni dónde hay errores. En celular solo caben los números. El usuario eligió una navegación más clara, con el estado de cada paso y el progreso general.

## What Changes

- **Escritorio (≥ 1024 px): columna lateral fija** con los 8 pasos a la izquierda del formulario. Cada paso muestra número, título, página del PDF y estado; el actual va resaltado.
- **Celular y tablet (< 1024 px):** encabezado con "Paso N de 8 · título", barra de progreso y un botón **"Pasos"** que abre la lista en un panel lateral (`sheet` de shadcn), con los mismos estados. Elegir un paso cierra el panel.
- **Estado de cada paso**, por prioridad:
  1. **⚠ con errores** (rojo): algún campo del paso es inválido, por validación del formulario o por un `400` del servidor marcado en un campo.
  2. **✔ con datos**: el paso tiene algún dato registrado.
  3. **○ vacío**.

  El estado lleva ícono y texto para el lector de pantalla; no depende solo del color.
- **Barra de progreso general:** "N de 8 pasos con datos" (`progress` de shadcn), en la columna lateral y en el encabezado de celular.
- Cambiar de paso sigue guardando antes, como hoy; mientras se guarda o en una historia nueva sin crear, los pasos siguen deshabilitados.
- Se agregan `sheet` y `progress` a `core/ui`.

## Non-goals

- Cambiar el contenido, el orden o la validación de los pasos.
- Marcar un paso como "completo" (requeriría definir campos obligatorios por paso; la historia es un borrador).

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: el formulario muestra la lista de pasos con su estado (con datos, vacío, con errores) y el progreso general; en escritorio como columna lateral y en celular en un panel.

## Impact

- **Frontend** (solo): `core/ui/sheet` y `core/ui/progress` (shadcn); `RecordStepNav` reemplaza a `RecordStepper`; `RecordForm` en dos columnas desde `lg`; estado por paso a partir de `RECORD_STEPS.fields` y de los errores del formulario.
- **E2E**: el de regresión responsive se ajusta a la nueva navegación.
- **Backend / contrato**: sin cambios.
