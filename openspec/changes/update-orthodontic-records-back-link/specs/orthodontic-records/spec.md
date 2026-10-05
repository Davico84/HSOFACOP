## ADDED Requirements

### Requirement: Volver al listado desde la historia
La historia clínica (edición y nueva) SHALL mostrar arriba a la izquierda, sobre el título, el enlace "Historias clínicas" con una flecha hacia atrás. El enlace SHALL llevar al listado con la búsqueda y la página que tenía la última vez que se vio en la pestaña, aunque después se haya cambiado de paso, creado la historia o abierto la vista previa; sin un listado previo SHALL llevar a `/historias`. Con cambios sin guardar SHALL pedir la misma confirmación que cualquier salida del formulario. El listado recordado SHALL borrarse al cerrar sesión.

#### Scenario: Vuelve con la búsqueda y la página
- **WHEN** el usuario busca "quispe", pasa a la página 2, abre una historia, cambia de paso y pulsa "Historias clínicas"
- **THEN** vuelve a `/historias?q=quispe&pagina=2`

#### Scenario: Después de crear una historia
- **WHEN** el usuario abre "Nueva historia" desde el listado con la búsqueda "quispe", crea la historia y pulsa "Historias clínicas"
- **THEN** vuelve a `/historias?q=quispe`

#### Scenario: Después de la vista previa
- **WHEN** el usuario abre la vista previa desde la historia, pulsa "Volver" y luego "Historias clínicas"
- **THEN** vuelve al listado con la búsqueda y la página que tenía

#### Scenario: Sin listado previo
- **WHEN** el usuario abre una historia directamente por su dirección, sin haber pasado por el listado en esa pestaña, y pulsa "Historias clínicas"
- **THEN** vuelve a `/historias`

#### Scenario: Con cambios sin guardar
- **WHEN** el usuario tiene cambios sin guardar y pulsa "Historias clínicas"
- **THEN** se pide confirmación; al quedarse sigue en el paso con sus cambios y al salir va al listado

#### Scenario: Historia no encontrada
- **WHEN** el usuario abre una historia ajena o inexistente y pulsa "Volver a las historias"
- **THEN** vuelve al listado con la búsqueda y la página recordadas (o a `/historias` si no hay)

#### Scenario: Cierre de sesión
- **WHEN** el usuario cierra sesión y otro inicia sesión en la misma pestaña
- **THEN** el enlace de este último lleva a `/historias`, sin la búsqueda anterior
