## Why

El tratante llena la historia en varios dispositivos: empieza en la PC de la clínica, sigue en el celular y vuelve a la PC. Hoy, si la historia queda abierta en la PC mientras se edita en el celular, la PC sigue mostrando los datos viejos hasta salir y volver a entrar. Si en ese momento se guarda algo en la PC, el servidor lo rechaza (`409`, la historia cambió) y recién ahí avisa: no se pierde nada, pero el aviso llega tarde y confunde.

## What Changes

- **Revisión al volver a la pestaña** del formulario de una historia existente. Cuando la pestaña vuelve a estar visible o recibe el foco, el formulario consulta la versión de la historia en el servidor:
  - **sin cambios en el servidor**: no hace nada;
  - **con cambios en el servidor y sin cambios locales sin guardar**: muestra los datos del servidor en el mismo paso, con un aviso discreto "Actualizada con cambios hechos en otro dispositivo";
  - **con cambios en el servidor y cambios locales sin guardar**: muestra enseguida el aviso existente de historia cambiada (recargar o seguir editando) y pausa el autoguardado, igual que tras un `409`. Así no se sigue escribiendo sobre una versión vieja.
- La revisión se encola con los guardados (no compite con un autoguardado en curso) y no se repite más de una vez cada 5 segundos.
- **Sin consultas periódicas**: con la pestaña oculta o sin cambiar de ventana no se consulta nada, así la base (Neon) puede suspenderse.
- Sin cambios de backend ni de contrato: usa la lectura de la historia que ya existe.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: nuevo requisito "Actualización al volver a la historia desde otro dispositivo".

## Impact

- Frontend:
  - `RecordForm` (revisión de versión y aviso);
  - un hook en `modules/records/hooks` que escucha la visibilidad y el foco de la ventana;
  - `RecordFormFeature` (recarga sin cambios locales).
- Sin cambios en backend, contrato ni base de datos.
- Docs: `docs/frontend.md` (patrón de la copia de trabajo y la revisión al volver).
