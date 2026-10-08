## Why

El tratante llena la historia en varios dispositivos: empieza en la PC de la clínica, sigue en el celular y vuelve a la PC. Hoy, si la historia queda abierta en la PC mientras se edita en el celular, la PC sigue mostrando los datos viejos hasta salir y volver a entrar. Si en ese momento se guarda algo en la PC, el servidor lo rechaza (`409`, la historia cambió) y recién ahí avisa: no se pierde nada, pero el aviso llega tarde y confunde.

## What Changes

- **Revisión al volver a la pestaña** del formulario de una historia existente (pestaña visible, foco de la ventana o restauración de la página en iOS). Una sola consulta de la historia, que detecta también lo que no sube la versión: datos del paciente fijados al imprimir, solicitud o desbloqueo.
  - **sin nada nuevo**: no hace nada;
  - **solo cambió el bloqueo o el desbloqueo**: el paso 1 lo refleja sin tocar lo escrito;
  - **datos nuevos y sin cambios propios**: muestra lo guardado en el otro dispositivo en el mismo paso, con el aviso "Actualizada con cambios hechos en otro dispositivo";
  - **datos nuevos y cambios propios distintos**: los conserva, muestra el aviso de historia cambiada (con un texto propio para este caso) y pausa el autoguardado. Si los valores propios ya coinciden con el servidor (un guardado cuya respuesta se perdió), no avisa.
- La revisión se encola con los guardados, no se repite más de una vez cada 5 segundos y no hace un segundo pedido para recargar. Un `404` muestra "Historia no encontrada"; un `401` sigue el flujo de renovación de sesión.
- **Sin consultas periódicas**: con la pestaña oculta no se consulta nada, así la base (Neon) puede suspenderse.
- Sin cambios de backend ni de contrato: usa la lectura de la historia que ya existe.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevo requisito "Actualización al volver a la historia desde otro dispositivo".

## Impact

- Frontend:
  - `RecordForm` (revisión de versión y aviso);
  - un hook genérico en `modules/core/hooks` (`useWindowReturn`) que escucha la visibilidad, el foco y la restauración de la página;
  - `RecordFormFeature` (recarga sin cambios locales).
- Sin cambios en backend, contrato ni base de datos.
- Docs: `docs/frontend.md` (patrón de la copia de trabajo y la revisión al volver).
