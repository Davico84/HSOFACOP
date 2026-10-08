## ADDED Requirements

### Requirement: Actualización al volver a la historia desde otro dispositivo
Cuando el usuario vuelve a una historia abierta (la pestaña vuelve a estar visible o la ventana recibe el foco), el formulario SHALL consultar si la historia cambió en el servidor desde su última versión conocida. Si no hay cambios locales sin guardar, SHALL mostrar los datos del servidor en el mismo paso, con un aviso "Actualizada con cambios hechos en otro dispositivo" anunciado a lectores de pantalla. Si hay cambios locales sin guardar, NO SHALL reemplazarlos y SHALL mostrar el aviso de historia cambiada (recargar o seguir editando), pausando el autoguardado. La consulta NO SHALL repetirse más de una vez cada 5 segundos, NO SHALL hacerse con la pestaña oculta ni de forma periódica, y SHALL esperar a que termine un guardado en curso.

#### Scenario: Volver sin cambios locales
- **WHEN** la historia se guardó desde el celular y el usuario vuelve a la pestaña de la PC sin cambios sin guardar
- **THEN** el formulario muestra los datos guardados desde el celular en el mismo paso
- **AND** aparece el aviso "Actualizada con cambios hechos en otro dispositivo" en una región `status`

#### Scenario: Volver con cambios locales sin guardar
- **WHEN** la historia se guardó desde otro dispositivo y el usuario vuelve a la pestaña con cambios sin guardar
- **THEN** sus cambios siguen en el formulario
- **AND** aparece el aviso de historia cambiada con "Recargar historia" y "Seguir editando"
- **AND** el autoguardado se pausa

#### Scenario: Volver sin cambios en el servidor
- **WHEN** el usuario vuelve a la pestaña y la historia no cambió en el servidor
- **THEN** el formulario no se recarga y no aparece ningún aviso

#### Scenario: Guardado propio en curso al volver
- **WHEN** el usuario vuelve a la pestaña mientras se completa el guardado de lo que escribió en este dispositivo
- **THEN** la consulta espera ese guardado y no lo confunde con un cambio de otro dispositivo

#### Scenario: Sin consultas de más
- **WHEN** la pestaña recibe el foco y vuelve a estar visible a la vez, o el usuario alterna ventanas varias veces en pocos segundos
- **THEN** se hace como máximo una consulta cada 5 segundos
- **AND** con la pestaña oculta no se consulta

#### Scenario: Historia todavía sin crear
- **WHEN** el usuario vuelve a la pestaña de una historia nueva que aún no se creó
- **THEN** no se consulta nada
