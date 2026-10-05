## ADDED Requirements

### Requirement: Autoguardado del paso en curso
En una historia ya creada, el sistema SHALL guardar automáticamente los cambios pendientes unos segundos después de que el usuario deja de editar y, de inmediato, cuando la pestaña deja de estar visible (cambio de app, pantalla bloqueada). Antes de autoguardar SHALL validar el paso actual; si tiene errores NO SHALL guardar y SHALL indicarlo. Un indicador junto al título SHALL mostrar el estado ("Guardando…", "Guardado", "Sin guardar: corrige los campos marcados", "No se pudo guardar" con opción de reintentar). Lo que el usuario escribe mientras un guardado está en curso NO SHALL perderse ni reemplazarse por la respuesta del servidor. El autoguardado NO SHALL mostrar notificaciones emergentes. Una historia nueva NO SHALL autoguardarse antes de crearse con "Crear historia".

#### Scenario: Guarda al dejar de escribir
- **WHEN** el usuario escribe en un campo de una historia ya creada y deja de editar unos segundos
- **THEN** el sistema guarda la historia sin que pulse nada y el indicador muestra "Guardado"
- **AND** al reabrir la historia en otro dispositivo el valor está ahí

#### Scenario: Guarda al ocultar la pestaña
- **WHEN** el usuario tiene cambios pendientes y cambia de app o bloquea la pantalla
- **THEN** el sistema guarda de inmediato, sin esperar

#### Scenario: Paso con errores
- **WHEN** el paso actual tiene un campo inválido (p. ej. un ancho de pieza fuera de 4,0–13,0 mm)
- **THEN** el sistema no guarda, marca el campo y el indicador muestra "Sin guardar: corrige los campos marcados"

#### Scenario: Escribe durante el guardado
- **WHEN** el usuario sigue escribiendo mientras un autoguardado está en curso
- **THEN** al terminar ese guardado lo escrito después se conserva en pantalla, sigue como cambio pendiente y se guarda en el siguiente autoguardado

#### Scenario: Fallo de red
- **WHEN** el autoguardado falla por un error del servidor o de red
- **THEN** el indicador muestra "No se pudo guardar" con "Reintentar", lo escrito se conserva y se vuelve a intentar al editar de nuevo o al recuperar la conexión

#### Scenario: Edición desde otro dispositivo
- **WHEN** la historia se guardó desde otro dispositivo y el autoguardado envía una versión anterior
- **THEN** el sistema responde `409`, muestra el aviso de historia desactualizada con la opción de recargar y no vuelve a autoguardar hasta recargar

#### Scenario: Sin cambios no se guarda
- **WHEN** el usuario abre un paso y no modifica nada
- **THEN** el sistema no envía ninguna petición de guardado

#### Scenario: Historia nueva
- **WHEN** el usuario llena el paso 1 de una historia nueva sin pulsar "Crear historia"
- **THEN** el sistema no la crea ni la guarda automáticamente

### Requirement: Retomar en el último paso trabajado
El sistema SHALL guardar con la historia el último paso en que el usuario guardó cambios (el paso al que se dirige al cambiar de paso, o el paso actual al autoguardar o pulsar "Guardar") y SHALL abrir la historia en ese paso cuando se abre sin indicar uno (desde el listado, en tabla o tarjetas, en cualquier dispositivo). Un paso indicado en la dirección (`?paso=N`) SHALL tener prioridad. Una historia sin paso guardado SHALL abrirse en el paso 1. El servidor SHALL rechazar un paso fuera de 1–8 con `400`.

#### Scenario: Retoma en otro dispositivo
- **WHEN** el usuario guarda cambios en el paso 6 desde la tablet y luego abre la historia desde el listado en la PC
- **THEN** la historia se abre en el paso 6

#### Scenario: Paso explícito en la dirección
- **WHEN** el usuario abre `/historias/10?paso=3` y el último paso guardado es el 6
- **THEN** se abre el paso 3

#### Scenario: Historia sin paso guardado
- **WHEN** se abre desde el listado una historia guardada antes de este cambio
- **THEN** se abre en el paso 1

#### Scenario: Recorrer pasos sin cambios
- **WHEN** el usuario solo pasa por los pasos 7 y 8 sin modificar nada y sale
- **THEN** el último paso guardado no cambia

#### Scenario: Paso inválido
- **WHEN** se guarda una historia con `lastStep` 0 o 9
- **THEN** la API responde `400` con el error en `lastStep` y no guarda
