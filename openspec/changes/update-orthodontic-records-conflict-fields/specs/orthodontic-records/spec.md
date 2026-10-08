## ADDED Requirements

### Requirement: Detalle de lo que cambió en el aviso de historia cambiada
Cuando el formulario avisa que la historia cambió (al volver desde otro dispositivo o tras un `409` al guardar), el aviso SHALL mostrarse siempre con "Recargar historia" y "Seguir editando". Si el sistema obtiene la versión actual de la historia, el aviso SHALL listar los campos cuyo valor en el formulario difiere del de esa versión, con su nombre, su paso, si la diferencia viene solo de este dispositivo, solo del otro o de ambos, y el valor actual en el servidor, para que el usuario sepa qué copiar antes de recargar; si no la obtiene, SHALL mostrarse sin la lista. El sistema NO SHALL modificar el formulario ni la historia al mostrar la lista.

#### Scenario: Campo cambiado en los dos dispositivos
- **WHEN** el usuario cambió el domicilio aquí, en otro dispositivo se guardó otro domicilio, y aparece el aviso de historia cambiada
- **THEN** el aviso lista "Domicilio" del paso 1 marcado "En ambos" con el domicilio guardado en el servidor
- **AND** el formulario conserva el domicilio escrito aquí

#### Scenario: Campo cambiado solo aquí
- **WHEN** el usuario cambió un campo que en el otro dispositivo no se tocó, y aparece el aviso
- **THEN** el aviso lo lista marcado "Solo aquí: se pierde al recargar", con el valor del servidor

#### Scenario: Campo cambiado solo en el otro dispositivo
- **WHEN** en el otro dispositivo se cambió un campo que el usuario no tocó aquí, y aparece el aviso
- **THEN** el aviso lo lista marcado "En otro dispositivo", con el valor que traerá al recargar

#### Scenario: Valores legibles
- **WHEN** un campo listado es una opción, una lista de opciones, una lista de piezas dentales, una lista de textos, una fecha o está vacío en el servidor
- **THEN** el aviso muestra el texto de la opción (p. ej. "Femenino", no `FEMALE`), los textos de las opciones separados por comas, las piezas como "Pieza 11, Pieza 12", los textos de la lista, la fecha como dd/mm/aaaa o "Vacío"

#### Scenario: Listas como una sola entrada
- **WHEN** una lista (p. ej. la lista de problemas) difiere de la versión anterior aquí y en el otro dispositivo, aunque sea en elementos distintos
- **THEN** el aviso la muestra como una sola entrada marcada "En ambos", con la lista completa del servidor

#### Scenario: Tablas de medidas
- **WHEN** difieren una o varias celdas de una tabla de medidas (p. ej. el análisis de Nance)
- **THEN** el aviso lista la tabla una sola vez, por su nombre y sin valores, con "Ir al paso"

#### Scenario: Ir al campo
- **WHEN** el usuario pulsa "Ir al campo" en un campo listado de otro paso
- **THEN** el formulario abre ese paso y le da el foco al campo
- **AND** lo escrito en el formulario no cambia

#### Scenario: Ir a un campo dentro de un panel plegado
- **WHEN** el usuario pulsa "Ir al campo" en un campo del paso 5 cuyo panel está cerrado
- **THEN** el formulario abre el paso 5, abre ese panel y le da el foco al campo

#### Scenario: Aviso tras un guardado rechazado
- **WHEN** un guardado responde `409` porque la historia cambió en otra pestaña u otro usuario
- **THEN** el aviso aparece enseguida
- **AND** el sistema consulta la historia una sola vez por aviso y agrega la lista de diferencias con esa versión, sin mover el foco ni la vista

#### Scenario: No se pudo consultar la historia tras el rechazo
- **WHEN** tras un `409` la consulta de la historia falla
- **THEN** el aviso queda con "Recargar historia" y "Seguir editando", sin la lista
