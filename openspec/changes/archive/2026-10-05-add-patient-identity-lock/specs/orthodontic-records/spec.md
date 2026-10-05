## ADDED Requirements

### Requirement: Datos del paciente fijos tras imprimir
La primera impresión registrada de una historia, esté completa o no, SHALL fijar sus datos de identidad del paciente: nombre, tipo y número de documento, fecha de nacimiento, sexo y lugar de nacimiento. Desde entonces, un guardado que los cambie SHALL rechazarse con `409` (`/errors/patient-locked`) y el mensaje "Los datos del paciente quedaron fijos al imprimir la historia. Solicita el desbloqueo para corregirlos.", sin guardar nada. La comparación SHALL hacerse en forma canónica (sin distinguir mayúsculas, tildes, formas Unicode equivalentes ni espacios sobrantes; documento por tipo y dígitos): un cambio que solo corrige la escritura SHALL guardarse. Domicilio, teléfono, fecha de inicio de tratamiento y el contenido clínico SHALL seguir editables y la historia reimprimible. En el formulario, los datos fijos SHALL mostrarse de solo lectura con un aviso que indica qué datos están fijos y desde cuándo, y los guardados SHALL seguir enviándolos sin cambios. La regla SHALL aplicarse igual a historias de autor `ADMIN`.

#### Scenario: Corregir antes de imprimir
- **WHEN** el tratante cambia el nombre del paciente de una historia que nunca se imprimió
- **THEN** se guarda normalmente

#### Scenario: Primera impresión fija los datos
- **WHEN** el tratante imprime una historia por primera vez
- **THEN** nombre, documento, fecha de nacimiento, sexo y lugar de nacimiento quedan fijos y el formulario los muestra de solo lectura con el aviso

#### Scenario: Imprimir un avance también fija
- **WHEN** el tratante imprime el avance de una historia con 3 de 7 pasos clínicos con datos
- **THEN** los datos quedan fijos y puede seguir llenando los demás pasos y reimprimir

#### Scenario: Cambiar un dato fijo
- **WHEN** se intenta guardar otro nombre, documento, fecha de nacimiento, sexo o lugar de nacimiento en una historia ya impresa
- **THEN** la API responde `409` con el mensaje de datos fijos y la historia queda exactamente como estaba

#### Scenario: Corregir solo la escritura
- **WHEN** en una historia fijada se guarda "ANA  QUÍSPE" o "ana quispe" donde decía "Ana Quispe", o el mismo DNI
- **THEN** se guarda (es la misma identidad)

#### Scenario: Datos que sí cambian
- **WHEN** el tratante cambia el domicilio, el teléfono, la fecha de inicio o el contenido clínico de una historia ya impresa, guarda y reimprime
- **THEN** todo se guarda y se imprime normalmente

#### Scenario: Autoguardado con datos fijos
- **WHEN** el autoguardado guarda un cambio en otro paso de una historia fijada
- **THEN** el cuerpo enviado conserva los datos fijos sin cambios y el guardado funciona

#### Scenario: Guardado de otra pestaña después de imprimir
- **WHEN** otra pestaña, abierta antes de la primera impresión, guarda un cambio en el nombre del paciente
- **THEN** la API responde `409` de datos fijos y no guarda nada

#### Scenario: Impresión y guardado simultáneos
- **WHEN** se imprime una historia al mismo tiempo que se guarda con otro nombre de paciente
- **THEN** o el guardado entra antes y se imprime y fija ese nombre, o la impresión fija el nombre anterior y el guardado recibe `409`; nunca queda fijo un nombre distinto del impreso

#### Scenario: Historia de autor ADMIN
- **WHEN** un `ADMIN` imprime una historia propia y luego intenta cambiar el nombre
- **THEN** recibe el mismo `409` de datos fijos

#### Scenario: Historias impresas antes de este cambio
- **WHEN** se abre una historia impresa antes de este cambio
- **THEN** sus datos están desbloqueados hasta la próxima impresión registrada

### Requirement: Impresión registrada en el servidor
La vista preliminar SHALL imprimir las hojas solo con su botón "Imprimir", que primero registra la impresión en el servidor (`POST /api/orthodontic-records/{id}/print`). El registro SHALL responder la fecha de impresión (zona horaria de la app) y los pasos clínicos con datos de la historia guardada, calculados en el servidor. Las hojas SHALL estar ocultas al imprimir por defecto y mostrarse solo durante la impresión iniciada por el botón tras un registro exitoso; si se imprime de otra forma (Ctrl+P, menú del navegador), o se cancela o termina esa impresión, SHALL salir solo el aviso "Usa el botón Imprimir de la vista preliminar." Si el registro falla, el diálogo NO SHALL abrirse y se SHALL mostrar el error con opción de reintentar. Registrar la impresión NO SHALL cambiar la versión de la historia (un formulario abierto no queda desactualizado); registrar una ya registrada SHALL ser idempotente. Imprimir y guardar SHALL serializarse, de modo que un guardado nunca cambie datos fijados por una impresión simultánea. Registrar la impresión de una historia ajena SHALL responder `404` a un `USER`.

#### Scenario: Imprimir con el botón
- **WHEN** el usuario pulsa "Imprimir" en la vista preliminar
- **THEN** el servidor registra la impresión, se abre el diálogo y salen las hojas

#### Scenario: Imprimir con el menú del navegador
- **WHEN** el usuario imprime la vista preliminar con Ctrl+P sin pulsar "Imprimir"
- **THEN** sale solo el aviso "Usa el botón Imprimir de la vista preliminar."

#### Scenario: Ctrl+P después de una impresión con el botón
- **WHEN** el usuario imprime con el botón, cierra o cancela el diálogo y luego pulsa Ctrl+P
- **THEN** sale solo el aviso

#### Scenario: Falla el registro
- **WHEN** el registro de la impresión falla por un error de red o del servidor
- **THEN** no se abre el diálogo y se muestra el error con "Reintentar"

#### Scenario: Reimpresión
- **WHEN** se imprime de nuevo una historia ya fijada
- **THEN** se registra sin cambiar la versión de la historia ni la fecha en que quedó fija

#### Scenario: Historia ajena
- **WHEN** un `USER` intenta registrar la impresión de una historia de otro tratante
- **THEN** la API responde `404`

### Requirement: Marca de avance en impresiones incompletas
Si la historia impresa no tiene datos en los 7 pasos clínicos (Firmas no cuenta), cada hoja SHALL llevar, en el margen superior y sin mover el contenido, la marca "AVANCE · N de 7 pasos clínicos con datos · impreso el dd/mm/aaaa", con N y la fecha que devuelve el registro de la impresión. Una historia completa SHALL imprimirse sin la marca. Si la historia guardada no tiene pasos calculados (anterior a las métricas), el registro SHALL calcularlos con los pasos que envía la vista sobre la historia guardada, con el mismo criterio que la navegación de pasos.

#### Scenario: Avance impreso
- **WHEN** se imprime una historia con 4 de 7 pasos clínicos con datos el 5 de octubre de 2026
- **THEN** cada hoja lleva "AVANCE · 4 de 7 pasos clínicos con datos · impreso el 05/10/2026"

#### Scenario: Historia completa
- **WHEN** se imprime una historia con los 7 pasos clínicos con datos
- **THEN** las hojas salen sin la marca

#### Scenario: Firmas no cuenta para la marca
- **WHEN** una historia tiene datos en los pasos 1–6 y en Firmas
- **THEN** se imprime con "AVANCE · 6 de 7 pasos clínicos con datos"

#### Scenario: Historia sin pasos calculados
- **WHEN** se imprime una historia guardada antes de registrar los pasos con datos
- **THEN** el registro calcula y guarda sus pasos y la marca muestra el conteo correcto

#### Scenario: La marca no altera la hoja
- **WHEN** se imprime un avance
- **THEN** las hojas conservan la cantidad, el tamaño A4, los márgenes y la posición del contenido de una impresión sin marca

### Requirement: Desbloqueo con registro de eventos
Un `ADMIN` SHALL poder desbloquear los datos fijos de una historia; se vuelven a fijar en la siguiente impresión. Cada desbloqueo y cada descarte de solicitud SHALL registrarse como evento (historia, ADMIN, fecha, acción y motivo de la solicitud si la había), sin borrarse nunca. La historia SHALL mostrar el último desbloqueo ("Desbloqueada por <nombre> el dd/mm/aaaa"). Desbloquear una historia sin datos fijos SHALL responder `409` (`/errors/patient-not-locked`). Un `USER` que intente desbloquear SHALL recibir `403`.

#### Scenario: El ADMIN desbloquea
- **WHEN** el `ADMIN` "Admin FACOP" desbloquea una historia impresa el 6 de octubre de 2026
- **THEN** el tratante puede corregir los datos, la historia muestra "Desbloqueada por Admin FACOP el 06/10/2026" y al imprimir de nuevo vuelven a quedar fijos

#### Scenario: Desbloquear sin solicitud
- **WHEN** el `ADMIN` desbloquea una historia sin solicitud pendiente
- **THEN** se desbloquea y se registra el evento sin motivo

#### Scenario: Eventos acumulados
- **WHEN** una historia se desbloquea dos veces por distintos ADMIN
- **THEN** quedan registrados ambos eventos y la historia muestra el último

#### Scenario: Desbloquear sin datos fijos
- **WHEN** el `ADMIN` intenta desbloquear una historia que no está fijada
- **THEN** la API responde `409` y no registra nada

#### Scenario: USER intenta desbloquear
- **WHEN** un `USER` pide desbloquear una historia
- **THEN** la API responde `403`

### Requirement: Solicitud de desbloqueo
Con los datos fijos, el autor SHALL poder solicitar el desbloqueo desde la historia con un motivo (1–200 caracteres); mientras esté pendiente, la historia SHALL mostrar "Desbloqueo solicitado el dd/mm/aaaa" y no SHALL admitir otra. El `ADMIN` SHALL resolverla desbloqueando (la cierra) o descartándola. Solicitar sin datos fijos SHALL responder `409` (`/errors/patient-not-locked`); con una solicitud pendiente, `409` (`/errors/unlock-already-requested`); sobre una historia ajena, `404`. Un `USER` que intente descartar SHALL recibir `403`. Dos solicitudes simultáneas SHALL dejar una sola.

#### Scenario: Solicitar el desbloqueo
- **WHEN** el tratante solicita el desbloqueo de su historia fijada con el motivo "Error en el número de DNI"
- **THEN** la historia muestra "Desbloqueo solicitado el <fecha>" y el ADMIN ve la solicitud con el motivo

#### Scenario: Solicitud repetida
- **WHEN** el tratante intenta solicitar otra vez con una solicitud pendiente
- **THEN** la acción no está disponible y la API responde `409`

#### Scenario: Solicitudes simultáneas
- **WHEN** llegan dos solicitudes de la misma historia al mismo tiempo
- **THEN** se guarda una y la otra recibe `409`

#### Scenario: El ADMIN desbloquea con solicitud
- **WHEN** el `ADMIN` desbloquea una historia con solicitud pendiente
- **THEN** los datos se desbloquean, la solicitud desaparece y el evento guarda su motivo

#### Scenario: El ADMIN descarta
- **WHEN** el `ADMIN` descarta una solicitud
- **THEN** los datos siguen fijos, la solicitud desaparece, se registra el evento y el tratante puede volver a solicitar

#### Scenario: Solicitar sin datos fijos
- **WHEN** se solicita el desbloqueo de una historia que nunca se imprimió
- **THEN** la API responde `409`

#### Scenario: USER intenta descartar
- **WHEN** un `USER` intenta descartar una solicitud
- **THEN** la API responde `403`

### Requirement: Candado en el listado
En el listado de historias (tabla y tarjetas), cada historia con los datos del paciente fijos SHALL mostrar un candado con el texto accesible "Datos del paciente fijos", para el tratante y para el `ADMIN`.

#### Scenario: Historia fijada en el listado
- **WHEN** se abre el listado y una de las historias ya se imprimió
- **THEN** esa historia muestra el candado y las demás no

#### Scenario: Historia desbloqueada
- **WHEN** el `ADMIN` desbloquea una historia
- **THEN** el listado deja de mostrar su candado hasta la próxima impresión
