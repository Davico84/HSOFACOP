## ADDED Requirements

### Requirement: Detalle de lo que cambió en el aviso de historia cambiada
Cuando el formulario avisa que la historia cambió (al volver desde otro dispositivo o tras un `409` al guardar), el sistema SHALL listar en el aviso los campos cuyo valor en el formulario difiere del valor actual en el servidor, indicando su nombre, su paso, si la diferencia viene solo de este dispositivo, solo del otro o de ambos, y el valor actual en el servidor, para que el usuario sepa qué copiar antes de recargar. El sistema NO SHALL modificar el formulario ni la historia al mostrar la lista.

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
- **WHEN** un campo listado es una opción, una lista de opciones o está vacío en el servidor
- **THEN** el aviso muestra el texto de la opción (p. ej. "Femenino", no `FEMALE`), las opciones separadas por comas o "Vacío"

#### Scenario: Tablas de medidas
- **WHEN** difieren una o varias celdas de una tabla de medidas (p. ej. el análisis de Nance)
- **THEN** el aviso lista la tabla una sola vez, por su nombre y sin valores, con "Ir al paso"

#### Scenario: Ir al campo
- **WHEN** el usuario pulsa "Ir al campo" en un campo listado de otro paso
- **THEN** el formulario abre ese paso y le da el foco al campo
- **AND** lo escrito en el formulario no cambia

#### Scenario: Aviso tras un guardado rechazado
- **WHEN** un guardado responde `409` porque la historia cambió en otra pestaña u otro usuario
- **THEN** el sistema consulta la historia una sola vez y el aviso lista las diferencias con esa versión

#### Scenario: No se pudo consultar la historia tras el rechazo
- **WHEN** tras un `409` la consulta de la historia falla
- **THEN** el aviso aparece igual, con "Recargar historia" y "Seguir editando", sin la lista
