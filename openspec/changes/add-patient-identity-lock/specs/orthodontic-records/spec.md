## ADDED Requirements

### Requirement: Identidad del paciente fija tras imprimir
La primera vez que se imprime una historia, esté completa o no, el sistema SHALL fijar la identidad del paciente: nombre, tipo y número de documento y fecha de nacimiento. Desde entonces, un guardado que cambie alguno de esos datos SHALL rechazarse con `409` (`/errors/patient-locked`) y el mensaje "La identidad del paciente quedó fija al imprimir la historia. Pide al administrador que la desbloquee para corregirla.", sin guardar nada. Los demás datos y el contenido clínico SHALL poder editarse y la historia reimprimirse. En el formulario, los campos fijados SHALL mostrarse bloqueados con ese aviso. Un `ADMIN` SHALL poder desbloquear la identidad de una historia; se vuelve a fijar en la siguiente impresión. Un `USER` que intente desbloquear SHALL recibir `403`.

#### Scenario: Corregir antes de imprimir
- **WHEN** el tratante cambia el nombre del paciente de una historia que nunca se imprimió
- **THEN** se guarda normalmente

#### Scenario: Primera impresión fija la identidad
- **WHEN** el tratante imprime una historia por primera vez
- **THEN** su nombre, documento y fecha de nacimiento quedan fijos y el formulario los muestra bloqueados con el aviso

#### Scenario: Imprimir el avance fija la identidad
- **WHEN** el tratante imprime el avance de una historia con 3 de 7 pasos clínicos con datos
- **THEN** la identidad queda fija y puede seguir llenando los demás pasos y reimprimir

#### Scenario: Cambiar la identidad después de imprimir
- **WHEN** se intenta guardar otro nombre, documento o fecha de nacimiento en una historia ya impresa
- **THEN** la API responde `409` con el mensaje de identidad fija y no guarda nada

#### Scenario: Seguir trabajando después de imprimir
- **WHEN** el tratante edita el domicilio o el contenido clínico de una historia ya impresa, guarda y vuelve a imprimir
- **THEN** todo se guarda y se imprime normalmente

#### Scenario: El ADMIN desbloquea
- **WHEN** un `ADMIN` desbloquea la identidad de una historia impresa
- **THEN** el tratante puede corregir esos datos, y al imprimir de nuevo vuelven a quedar fijos

#### Scenario: USER intenta desbloquear
- **WHEN** un `USER` pide desbloquear la identidad de una historia
- **THEN** la API responde `403`

#### Scenario: Historia ajena
- **WHEN** un `USER` intenta registrar la impresión de una historia de otro tratante
- **THEN** la API responde `404`

#### Scenario: Historias impresas antes de este cambio
- **WHEN** se abre una historia impresa antes de este cambio
- **THEN** su identidad está desbloqueada hasta la próxima impresión

### Requirement: Imprimir solo con el botón Imprimir
La vista preliminar SHALL imprimirse solo con su botón "Imprimir", que registra la impresión en el servidor antes de abrir el diálogo del navegador. Si se imprime por otro medio (menú del navegador, Ctrl+P), las hojas NO SHALL salir y en su lugar SHALL imprimirse el aviso "Usa el botón Imprimir de la vista preliminar." Si el registro falla, el diálogo NO SHALL abrirse y se SHALL mostrar el error.

#### Scenario: Imprimir con el botón
- **WHEN** el usuario pulsa "Imprimir" en la vista preliminar
- **THEN** el sistema registra la impresión, luego se abre el diálogo de impresión y salen las hojas

#### Scenario: Imprimir con el menú del navegador
- **WHEN** el usuario imprime la vista preliminar con Ctrl+P sin pulsar "Imprimir"
- **THEN** sale solo el aviso "Usa el botón Imprimir de la vista preliminar."

#### Scenario: Falla el registro
- **WHEN** el registro de la impresión falla por un error de red o del servidor
- **THEN** no se abre el diálogo y se muestra el error con opción de reintentar

### Requirement: Marca de avance en impresiones incompletas
Si la historia impresa no está completa (datos en los 7 pasos clínicos; Firmas no cuenta), cada hoja SHALL llevar, en el margen superior y sin mover el contenido de la hoja, la marca "AVANCE · N de 7 pasos clínicos con datos · impreso el <fecha>". Una historia completa SHALL imprimirse sin la marca. El conteo SHALL seguir el mismo criterio que la navegación de pasos (lo que viene por defecto no cuenta) sobre la historia guardada.

#### Scenario: Avance impreso
- **WHEN** se imprime una historia con 4 de 7 pasos clínicos con datos el 5 de octubre de 2026
- **THEN** cada hoja lleva "AVANCE · 4 de 7 pasos clínicos con datos · impreso el 05/10/2026"

#### Scenario: Historia completa
- **WHEN** se imprime una historia con los 7 pasos clínicos con datos
- **THEN** las hojas salen sin la marca

#### Scenario: Firmas no cuenta para la marca
- **WHEN** una historia tiene datos en los pasos 1–6 y en Firmas
- **THEN** se imprime con la marca "AVANCE · 6 de 7 pasos clínicos con datos"

#### Scenario: La marca no altera la hoja
- **WHEN** se imprime un avance
- **THEN** las hojas conservan la cantidad, el tamaño A4, los márgenes y la posición del contenido de una impresión sin marca

### Requirement: Candado de identidad en el listado
En el listado de historias (tabla y tarjetas), cada historia con la identidad del paciente fijada SHALL mostrar un candado con el texto accesible "Identidad del paciente fija", para el tratante y para el `ADMIN`.

#### Scenario: Historia fijada en el listado
- **WHEN** se abre el listado y una de las historias ya se imprimió
- **THEN** esa historia muestra el candado y las demás no

#### Scenario: Historia desbloqueada
- **WHEN** el `ADMIN` desbloquea una historia
- **THEN** el listado deja de mostrar su candado hasta la próxima impresión

### Requirement: Registro del último desbloqueo
Al desbloquear la identidad, el sistema SHALL guardar qué `ADMIN` lo hizo y cuándo, y la historia SHALL mostrarlo junto al aviso ("Desbloqueada por <nombre> el dd/mm/aaaa") mientras esté desbloqueada y también después de volver a fijarse. Solo SHALL guardarse el último desbloqueo.

#### Scenario: Ver quién desbloqueó
- **WHEN** el `ADMIN` "Admin FACOP" desbloquea una historia el 6 de octubre de 2026
- **THEN** la historia muestra "Desbloqueada por Admin FACOP el 06/10/2026"

#### Scenario: Nuevo desbloqueo
- **WHEN** otra cuenta `ADMIN` la desbloquea de nuevo más tarde
- **THEN** se muestra solo el último desbloqueo

### Requirement: Solicitud de desbloqueo
Con la identidad fijada, el autor de la historia SHALL poder solicitar el desbloqueo desde la historia, con un motivo de hasta 200 caracteres; mientras la solicitud está pendiente, la historia SHALL mostrar "Desbloqueo solicitado el dd/mm/aaaa" y no SHALL permitir otra. El `ADMIN` SHALL poder resolverla desbloqueando (lo que la cierra) o descartándola. Solicitar sin la identidad fijada SHALL responder `409`; solicitar sobre una historia ajena SHALL responder `404`; un `USER` que intente descartar SHALL recibir `403`.

#### Scenario: Solicitar el desbloqueo
- **WHEN** el tratante solicita el desbloqueo de su historia fijada con el motivo "Error en el número de DNI"
- **THEN** la historia muestra "Desbloqueo solicitado el <fecha>" y el ADMIN ve la solicitud con el motivo

#### Scenario: Solicitud repetida
- **WHEN** el tratante intenta solicitar otra vez con una solicitud pendiente
- **THEN** la acción no está disponible y la API responde `409`

#### Scenario: El ADMIN desbloquea la solicitud
- **WHEN** el `ADMIN` desbloquea una historia con solicitud pendiente
- **THEN** la identidad queda desbloqueada y la solicitud desaparece

#### Scenario: El ADMIN descarta la solicitud
- **WHEN** el `ADMIN` descarta una solicitud
- **THEN** la identidad sigue fijada, la solicitud desaparece y el tratante puede volver a solicitar

#### Scenario: Solicitar sin identidad fijada
- **WHEN** se solicita el desbloqueo de una historia que nunca se imprimió
- **THEN** la API responde `409`

