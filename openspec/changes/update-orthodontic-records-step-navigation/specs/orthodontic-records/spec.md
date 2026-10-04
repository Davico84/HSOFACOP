## ADDED Requirements

### Requirement: Navegación entre pasos con estado y progreso
El formulario de la historia SHALL mostrar la lista de sus 8 pasos con el estado de cada uno y el progreso general. El estado de un paso SHALL ser, por prioridad: "con errores" si algún campo del paso es inválido (por la validación del formulario o por un error del servidor marcado en un campo), "con datos" si tiene algún dato registrado, y "vacío" en otro caso. Cada estado SHALL mostrarse con un ícono propio y no solo con el color, y anunciarse al lector de pantalla. El progreso SHALL indicar cuántos de los 8 pasos tienen datos. En pantallas de 1024 px o más la lista SHALL ir en una columna lateral junto al formulario; en pantallas más angostas, en un panel que se abre desde el encabezado del paso. Elegir un paso SHALL seguir guardando antes los cambios, como cualquier cambio de paso.

#### Scenario: Estado de cada paso
- **WHEN** el usuario abre una historia con datos en los pasos 1, 2 y 4 y sin datos en los demás
- **THEN** los pasos 1, 2 y 4 aparecen "con datos" y los pasos 3, 5, 6, 7 y 8 "vacíos"
- **AND** el progreso indica "3 de 8 pasos con datos"

#### Scenario: Paso con errores
- **WHEN** al guardar, el servidor marca como inválido un campo del paso 7 mientras el usuario está en el paso 2
- **THEN** el paso 7 aparece "con errores", resaltado como alerta, aunque tenga otros datos

#### Scenario: El estado se actualiza al escribir
- **WHEN** el usuario escribe el primer dato de un paso vacío
- **THEN** ese paso pasa a "con datos" y el progreso aumenta en uno, sin guardar todavía

#### Scenario: Columna lateral en escritorio
- **WHEN** el usuario abre un paso en una pantalla de 1024 px o más
- **THEN** a la izquierda del formulario se ven los 8 pasos con su número, título, página del PDF y estado, el paso actual resaltado y la barra de progreso

#### Scenario: Panel de pasos en celular
- **WHEN** el usuario, en una pantalla de menos de 1024 px, pulsa "Pasos" en el encabezado y elige otro paso
- **THEN** se abre un panel con los 8 pasos, sus estados y el progreso; al elegir el paso, el panel se cierra y se abre ese paso (guardando antes si hay cambios)

#### Scenario: Estado accesible
- **WHEN** el lector de pantalla recorre la lista de pasos
- **THEN** cada paso se anuncia con su número, su título y su estado ("con datos", "vacío" o "con errores"), y el paso actual como paso actual
