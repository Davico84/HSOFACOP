## ADDED Requirements

### Requirement: Actualización al volver a la historia desde otro dispositivo
Cuando el usuario vuelve a una historia abierta (la pestaña vuelve a estar visible, la ventana recibe el foco o el navegador restaura la página), el formulario SHALL consultar una vez si la historia cambió en el servidor, incluidos los cambios que no suben la versión (datos del paciente fijados al imprimir, solicitud o desbloqueo). Lo que cambió en el servidor SHALL mostrarse sin reemplazar nunca cambios propios distintos: si no hay cambios propios, el formulario SHALL mostrar los datos del servidor en el mismo paso con un aviso "Actualizada con cambios hechos en otro dispositivo"; si los hay y difieren de lo guardado en el servidor, SHALL conservarlos y mostrar el aviso de historia cambiada, pausando el autoguardado. La consulta NO SHALL repetirse más de una vez cada 5 segundos, NO SHALL hacerse con la pestaña oculta ni de forma periódica, y SHALL esperar a que termine un guardado en curso.

#### Scenario: Volver sin cambios propios
- **WHEN** la historia se guardó desde el celular y el usuario vuelve a la pestaña de la PC sin cambios sin guardar
- **THEN** el formulario muestra los datos guardados desde el celular en el mismo paso
- **AND** aparece el aviso "Actualizada con cambios hechos en otro dispositivo" en una región `status`

#### Scenario: Volver con cambios propios que chocan
- **WHEN** la historia se guardó desde otro dispositivo y el usuario vuelve a la pestaña con cambios sin guardar distintos de lo guardado en el servidor
- **THEN** sus cambios siguen en el formulario
- **AND** aparece el aviso "La historia cambió en otro dispositivo mientras tenías cambios sin guardar aquí…" con "Recargar historia" y "Seguir editando"
- **AND** el autoguardado se pausa

#### Scenario: Cambios propios que ya están en el servidor
- **WHEN** al volver, la versión del servidor es mayor pero sus valores son iguales a los del formulario (p. ej. el guardado al ocultar la pestaña llegó al servidor aunque su respuesta se perdió)
- **THEN** el formulario queda sin cambios pendientes, sin aviso ni recarga

#### Scenario: Guardado fallido al ocultar y cambios remotos
- **WHEN** el guardado al ocultar la pestaña falló por la red, mientras tanto otro dispositivo guardó otros valores, y el usuario vuelve
- **THEN** sus valores se conservan, aparece el aviso de historia cambiada y no se vuelve a autoguardar

#### Scenario: Impresión o desbloqueo desde otro dispositivo
- **WHEN** desde otro dispositivo se imprimió la historia (sus datos del paciente quedan fijos) o el ADMIN la desbloqueó, y el usuario vuelve a la pestaña
- **THEN** el paso 1 refleja los datos fijos o desbloqueados y su aviso
- **AND** lo escrito en el formulario se conserva, sin aviso de historia cambiada

#### Scenario: Autoguardado pendiente durante la revisión
- **WHEN** el autoguardado de lo escrito en la PC queda en espera mientras la revisión al volver detecta cambios distintos en el servidor
- **THEN** ese autoguardado no se envía y lo escrito se conserva con el aviso de historia cambiada

#### Scenario: Escribir mientras se revisa
- **WHEN** el usuario empieza a escribir después de volver y antes de que la revisión muestre los datos del otro dispositivo
- **THEN** lo escrito no se pierde: en lugar de recargar se muestra el aviso de historia cambiada

#### Scenario: Volver sin cambios en el servidor
- **WHEN** el usuario vuelve a la pestaña y la historia no cambió en el servidor
- **THEN** el formulario no se recarga y no aparece ningún aviso

#### Scenario: Guardado propio en curso al volver
- **WHEN** el usuario vuelve a la pestaña mientras se completa el guardado de lo que escribió en este dispositivo
- **THEN** la consulta espera ese guardado y no lo confunde con un cambio de otro dispositivo

#### Scenario: Una sola consulta
- **WHEN** al volver llegan a la vez el foco, la visibilidad y la restauración de la página, se alternan ventanas varias veces en pocos segundos o se cierra un diálogo de la aplicación
- **THEN** se hace como máximo una consulta cada 5 segundos, sin un segundo pedido para recargar
- **AND** con la pestaña oculta no se consulta

#### Scenario: Historia que dejó de estar al alcance
- **WHEN** al volver, el servidor responde que la historia no existe o no está al alcance (`404`)
- **THEN** se muestra "Historia no encontrada", como al abrirla

#### Scenario: Sesión vencida al volver
- **WHEN** al volver, la consulta recibe `401`
- **THEN** si la sesión se renueva, la consulta se repite y sigue como en los demás escenarios
- **AND** si no se renueva, se cierra la sesión y la app lleva al login

#### Scenario: Volver desde la vista de impresión
- **WHEN** el usuario vuelve de la vista previa de impresión al formulario de la historia
- **THEN** el formulario muestra lo último guardado o impreso

#### Scenario: Historia todavía sin crear
- **WHEN** el usuario vuelve a la pestaña de una historia nueva que aún no se creó
- **THEN** no se consulta nada
