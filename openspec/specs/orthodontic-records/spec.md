# orthodontic-records Specification

## Purpose
Historia clínica de ortodoncia de la clínica AEO/FACOP en formato digital: el tratante la llena en un formulario de 8 pasos que sigue el PDF de la clínica (anamnesis, análisis facial, funcional, oclusal, análisis de modelos —transversal, Moyers, Nance y Bolton—, radiográfico, diagnóstico y planes, firmas), la guarda como borrador, la encuentra en un listado con búsqueda y la imprime en hojas A4 con la presentación del PDF. Un `USER` (tratante) alcanza solo sus historias; un `ADMIN` (supervisor), todas. Las notas de evolución no se registran en el sistema: se imprime su hoja en blanco para llenarla a mano.
## Requirements
### Requirement: Crear una historia clínica de ortodoncia
El sistema SHALL permitir a cualquier usuario autenticado (`USER` o `ADMIN`) crear una historia clínica de ortodoncia indicando como mínimo el nombre del paciente y el número de historia que asignan los docentes, con formato `AOC-` seguido de exactamente cuatro dígitos (`AOC-0001` a `AOC-9999`). La historia SHALL quedar asociada a su autor, y el odontólogo tratante SHALL proponerse con el nombre completo del autor (editable). El número SHALL ser único entre todas las historias del sistema, de cualquier autor y cohorte (los docentes no reinician la numeración); al corregirse, el número anterior SHALL quedar libre, porque pudo ingresarse por error y pertenecer a otra historia. Quien puede editar la historia (su autor o un `ADMIN`) SHALL poder corregir el número desde el primer paso, también después de imprimirla. El número NO SHALL confundirse con el identificador técnico interno, que no cambia.

#### Scenario: Creación con el mínimo de datos
- **WHEN** un usuario autenticado crea una historia con el nombre del paciente "Ana Quispe" y el número "AOC-0015"
- **THEN** el sistema guarda la historia, responde `201` con su identificador y número, y la abre en el primer paso del formulario
- **AND** el autor de la historia es ese usuario y el odontólogo tratante propuesto es su nombre completo

#### Scenario: Número obligatorio
- **WHEN** un usuario intenta crear o guardar una historia sin número (vacío o solo espacios)
- **THEN** el sistema responde `400` con el error en el campo del número y no guarda nada
- **AND** el formulario muestra el mensaje junto al campo

#### Scenario: Formato del número
- **WHEN** un usuario intenta crear o guardar una historia con "AOC-15", "AOC-00001" o "AEO-0015"
- **THEN** el sistema responde `400` con el error en el campo del número ("Usa el formato AOC-0001") y no guarda nada

#### Scenario: Número ya usado
- **WHEN** un usuario intenta crear o guardar una historia con un número que ya tiene otra historia, de cualquier autor
- **THEN** el sistema responde `409` (`/errors/record-number-taken`) con "El número AOC-0015 ya está registrado en otra historia. Verifica el número con la coordinación." y no guarda nada
- **AND** el formulario muestra el mensaje junto al número, conserva lo escrito y el autoguardado no se pausa

#### Scenario: Mismo número a la vez
- **WHEN** dos usuarios crean o guardan a la vez historias con el mismo número
- **THEN** solo una lo conserva y la otra recibe `409` (`/errors/record-number-taken`)

#### Scenario: El autor corrige el número después de imprimir
- **WHEN** el autor cambia el número de una historia ya impresa a otro número válido y libre
- **THEN** el sistema guarda el nuevo número sin cambiar el identificador técnico ni el autor
- **AND** los datos del paciente fijados al imprimir siguen fijos

#### Scenario: Un número corregido queda libre
- **WHEN** una historia tenía por error "AOC-0015", se corrige a "AOC-0051" y luego otro alumno guarda su historia con "AOC-0015"
- **THEN** el sistema guarda "AOC-0015" en la historia del otro alumno

#### Scenario: El ADMIN corrige el número
- **WHEN** un `ADMIN` cambia el número de una historia de otro autor a un número válido y libre
- **THEN** el sistema guarda el nuevo número

#### Scenario: Falta el nombre del paciente
- **WHEN** un usuario intenta crear una historia sin nombre de paciente (vacío o solo espacios)
- **THEN** el sistema responde `400` con el error en el campo del nombre y no crea la historia
- **AND** el formulario muestra el mensaje junto al campo

#### Scenario: Sin sesión
- **WHEN** una petición sin sesión válida intenta crear una historia
- **THEN** el sistema responde `401` y no crea nada

### Requirement: Datos del paciente con edad calculada
La historia SHALL registrar los datos del paciente de la página 1 del PDF: nombre, documento de identidad, sexo, lugar y fecha de nacimiento, domicilio, celular, fecha de inicio de tratamiento y odontólogo tratante. El documento SHALL indicar su tipo y un número con el formato de ese tipo: DNI (8 dígitos), Carné de extranjería (9 dígitos) o Pasaporte (6 a 12 dígitos); en todos los tipos solo se aceptan dígitos. La edad NO SHALL teclearse: el sistema SHALL calcularla en años cumplidos a la fecha de inicio de tratamiento o, si no la hay, a la fecha actual. Las fechas SHALL ser coherentes.

#### Scenario: Documento válido según su tipo
- **WHEN** se guarda DNI `74125896`, Carné de extranjería `001234567` o Pasaporte `12345678`
- **THEN** el documento se guarda y se imprime con su tipo ("DNI 74125896", "CE 001234567", "Pasaporte 12345678")

#### Scenario: Documento con formato incorrecto
- **WHEN** se guarda DNI `7412589` (7 dígitos), Carné de extranjería con letras o Pasaporte con letras o de 5 dígitos
- **THEN** el sistema responde `400` con el error en el número del documento y no guarda

#### Scenario: Número de documento sin tipo
- **WHEN** se guarda un número de documento sin indicar su tipo (o un tipo sin número)
- **THEN** el sistema responde `400` con el error en el campo que falta

#### Scenario: Edad calculada a la fecha de inicio
- **WHEN** el paciente nació el 2012-05-20 y el tratamiento inicia el 2026-05-19
- **THEN** la historia muestra e imprime "Edad: 13 años"

#### Scenario: Edad sin fecha de inicio
- **WHEN** la historia tiene fecha de nacimiento pero no fecha de inicio de tratamiento
- **THEN** la edad se calcula a la fecha actual

#### Scenario: Sin fecha de nacimiento
- **WHEN** la historia no tiene fecha de nacimiento
- **THEN** la edad se muestra vacía (línea en blanco al imprimir), sin error

#### Scenario: Fecha de nacimiento futura
- **WHEN** se guarda una fecha de nacimiento posterior a hoy
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Inicio de tratamiento anterior al nacimiento
- **WHEN** se guarda una fecha de inicio de tratamiento anterior a la fecha de nacimiento
- **THEN** el sistema responde `400` con el error en la fecha de inicio y no guarda

### Requirement: Formulario por pasos con guardado de borrador
El sistema SHALL presentar la historia como un formulario de 8 pasos en el orden del PDF (Paciente y anamnesis · Análisis facial · Análisis funcional · Análisis oclusal y extra · Análisis de modelos · Análisis radiográfico · Diagnóstico y planes · Firmas). Salvo el nombre del paciente, ningún campo SHALL ser obligatorio: la historia es un borrador que se completa en varias sesiones. Al pasar a otro paso, si hay cambios, el sistema SHALL guardarlos antes de cambiar; si el guardado falla, SHALL quedarse en el paso actual mostrando el error.

#### Scenario: Avanzar guarda los cambios
- **WHEN** el usuario edita campos del paso 2 y pulsa "Siguiente"
- **THEN** el sistema guarda la historia y muestra el paso 3
- **AND** al reabrir la historia más tarde, los valores del paso 2 siguen ahí

#### Scenario: Saltar a un paso desde la lista de pasos
- **WHEN** el usuario pulsa el paso 7 en la lista de pasos estando en el paso 1 con cambios
- **THEN** el sistema guarda y abre el paso 7 (los pasos intermedios pueden quedar vacíos)

#### Scenario: Sin cambios no se guarda
- **WHEN** el usuario cambia de paso sin haber modificado nada
- **THEN** el sistema cambia de paso sin enviar ninguna petición de guardado

#### Scenario: Error de validación al guardar
- **WHEN** un campo supera su longitud máxima o un número está fuera de rango y el usuario intenta cambiar de paso
- **THEN** el sistema no cambia de paso y muestra el error junto al campo

#### Scenario: Fallo de red al guardar
- **WHEN** el guardado falla por un error del servidor o de red
- **THEN** el sistema se queda en el paso actual, conserva lo escrito y muestra un aviso con opción de reintentar

#### Scenario: Salir con cambios sin guardar
- **WHEN** el usuario intenta salir de la historia (otra sección, cerrar o recargar la pestaña) con cambios sin guardar
- **THEN** el sistema pide confirmación antes de abandonar y, si confirma, descarta los cambios

#### Scenario: Análisis de modelos después del análisis oclusal
- **WHEN** el usuario termina el análisis oclusal (paso 4) y pulsa "Siguiente"
- **THEN** se abre el paso 5 "Análisis de modelos", y el análisis radiográfico pasa a ser el paso 6

### Requirement: Secciones clínicas de la fase 1
El formulario SHALL cubrir los campos de las páginas 1–4 y 10–13 del PDF. Donde el PDF ofrece opciones sobre líneas ("Mesofacial ___ Dolicofacial ___"), el sistema SHALL usar selección única, salvo en las listas donde puede marcarse más de una (hábitos de succión del análisis funcional), que SHALL ser selección múltiple; donde el PDF deja líneas para escribir, SHALL ofrecer texto libre. Los campos condicionados SHALL mostrarse solo cuando aplican, y SHALL descartarse al guardar si su condición deja de cumplirse. Los valores numéricos SHALL respetar su unidad y rango.

#### Scenario: Selección única
- **WHEN** el usuario marca "Dolicofacial" en Tipo facial y luego "Braquifacial"
- **THEN** queda seleccionado solo "Braquifacial"

#### Scenario: Selección múltiple
- **WHEN** el usuario marca "Dedos" y "Onicofagia" en Hábitos de succión (análisis funcional)
- **THEN** ambos quedan guardados y la opción "No" se desmarca

#### Scenario: Hábitos de succión con "No" por defecto
- **WHEN** el usuario abre el análisis funcional de una historia nueva, o en la anamnesis respondió "No" a Hábitos de succión
- **THEN** la lista de hábitos muestra "No" marcado; con "No" en la anamnesis no se pueden marcar hábitos
- **AND** marcar "No" desmarca cualquier hábito marcado

#### Scenario: Interposición lingual lateral con lado
- **WHEN** el usuario elige Actividad lingual "Interp. lateral"
- **THEN** aparece el lado (derecho, izquierdo o ambos) y se imprime junto a la opción
- **AND** si cambia a "Normal" o "Interp. anterior", el lado se descarta al guardar

#### Scenario: Piezas con desgaste en selector FDI
- **WHEN** el usuario elige bruxismo "Sí, con presencia de desgastes" y marca las piezas 26, 13 y 55 en el selector
- **THEN** se guardan solo códigos FDI válidos (permanentes 11–48, temporales 51–85) y se imprimen ordenados: "13, 26, 55"
- **AND** un código fuera de esos rangos responde `400`

#### Scenario: Selección con imagen de la guía facial
- **WHEN** el usuario está en el paso de Análisis facial
- **THEN** las preguntas con ilustración en la Guía de análisis facial muestran cada opción con su imagen (o la imagen de referencia junto a las opciones) y el valor normativo de la guía como ayuda
- **AND** pulsar la imagen de una opción la selecciona igual que pulsar su etiqueta

#### Scenario: Tercios y simetrías con observaciones
- **WHEN** el usuario marca "No presenta" en Proporción de los tercios faciales y escribe "Tercio inferior aumentado"
- **THEN** se guardan la opción y el texto; la impresión muestra "☐ Presenta" y "☒ No presenta" en renglones separados y el texto debajo
- **AND** Simetría facial en reposo y en apertura bucal funcionan igual (presenta / no presenta + texto)

#### Scenario: Historias guardadas con el formato anterior del análisis facial
- **WHEN** una historia guardada antes del cambio tenía "No presenta, tercio aumentado" con los tercios superior e inferior, o un lado asimétrico marcado
- **THEN** al actualizar el sistema queda "No presenta" con el texto "Tercio aumentado: superior, inferior" (o "Lado asimétrico: izquierdo"), sin perder información

#### Scenario: AFAI aumentada y disminuida son excluyentes
- **WHEN** el usuario elige Patrón II, marca "Con aumento de AFAI" y luego "Con AFAI disminuida"
- **THEN** queda marcada solo "Con AFAI disminuida"; "Retrusión mandibular" y "Protrusión maxilar" sí pueden marcarse juntas
- **AND** al cambiar a otro patrón, las características del Patrón II se descartan al guardar

#### Scenario: Análisis facial en una sola hoja
- **WHEN** se imprime una historia con el análisis facial completo
- **THEN** la sección ocupa una sola hoja A4, en blanco y negro, con casillas y sin las imágenes de la guía

#### Scenario: Higiene oral por categorías
- **WHEN** el usuario selecciona "Regular" en Higiene oral
- **THEN** queda seleccionada solo una de "Excelente", "Buena", "Regular" y "Deficiente", se guarda y se imprimen las cuatro opciones con "Regular" marcada
- **AND** sin selección la historia se guarda igual (es un borrador) sin asignar una categoría por defecto

#### Scenario: Hábitos de succión Sí/No en la anamnesis
- **WHEN** el usuario responde "No" en Hábitos de succión de la anamnesis
- **THEN** se guarda como selección única y se imprime "☐ Sí ☒ No"

#### Scenario: Pregunta solo para niñas
- **WHEN** el sexo del paciente es masculino o no está indicado
- **THEN** la pregunta "¿La 1ª menstruación ya ocurrió?" y su fecha no se muestran ni se imprimen
- **AND** si tenían valor y el sexo cambia a masculino o se quita, ambos se descartan al guardar

#### Scenario: Fecha de la primera menstruación
- **WHEN** el sexo es femenino, el usuario responde "Sí" y registra la fecha 15/03/2023
- **THEN** se guardan la respuesta y la fecha (sin hora) y se imprimen
- **AND** si la respuesta cambia a "No", la fecha se oculta y se descarta al guardar

#### Scenario: Fecha de la primera menstruación inválida
- **WHEN** la fecha de la primera menstruación es posterior al día de hoy (zona horaria de la clínica) o anterior a la fecha de nacimiento
- **THEN** el sistema responde `400` con el error en ese campo y no guarda la historia
- **AND** el formulario muestra el mensaje junto al campo; sin fecha de nacimiento solo se exige que no sea futura

#### Scenario: Campos condicionados por la opción elegida
- **WHEN** el usuario elige "Mordida cruzada posterior unilateral" o "Sí, con presencia de desgastes" (bruxismo)
- **THEN** aparece el lado o el selector de piezas, respectivamente
- **AND** si después cambia a otra opción, ese dato se descarta al guardar

#### Scenario: Valores numéricos con unidad y rango
- **WHEN** el usuario indica mordida profunda 40 (%), mordida abierta 3 (mm) y overjet 5 (mm)
- **THEN** se guardan con su unidad
- **AND** un porcentaje fuera de 0–100 o milímetros fuera de 0–30 responde `400` con el error en ese campo

#### Scenario: Curva de Spee alterada con texto
- **WHEN** el usuario elige Curva de Spee "Alterada"
- **THEN** aparece un texto libre para describirla; con "Normal" no se pide texto y el que hubiera se descarta al guardar

#### Scenario: Anteroposterior normal excluye overjet y mordida cruzada anterior
- **WHEN** el usuario marca Anteroposterior "Normal" teniendo overjet o piezas de mordida cruzada anterior cargados
- **THEN** esos campos se ocultan y se descartan al guardar

#### Scenario: Línea media estructurada
- **WHEN** el usuario indica línea media inferior "desviada a la izquierda" 2 mm y superior "centrada"
- **THEN** se guarda e imprime "superior centrada · inferior desviada a la izquierda 2 mm"
- **AND** una desviación menor a 0,5 mm o sin valor responde `400` con el error en ese campo

#### Scenario: Relación de caninos y molares con clase y detalle
- **WHEN** el usuario marca caninos lado derecho "Clase II" con detalle "½ cúspide"
- **THEN** se imprime "Clase II ½ cúspide" en la columna del lado derecho

#### Scenario: Relación de caninos en RC según MI y MIH
- **WHEN** el usuario marca "MI ≠ RC" (máxima intercuspidación) y no "MIH ≠ RC" (mordida habitual)
- **THEN** se pide e imprime solo la relación de caninos en RC correspondiente a MI; la de MIH no aparece y su dato se descarta al guardar

#### Scenario: Análisis cefalométricos realizados
- **WHEN** el usuario marca Steiner, Ricketts y Jarabak en Diagnóstico cefalométrico del análisis radiográfico
- **THEN** se guardan los tres, el formulario indica "3 de 3" y la impresión lista las seis opciones (Steiner, Ricketts, McNamara, Wits, Tweed y Jarabak) con las elegidas marcadas
- **AND** con menos de 3 marcados la historia se guarda igual (es un borrador) y el formulario muestra "n de 3"

#### Scenario: Más de tres análisis cefalométricos
- **WHEN** el usuario marca cinco de los seis análisis
- **THEN** se guardan los cinco, el formulario indica que alcanzó el mínimo ("3 de 3") y la impresión los marca a todos

#### Scenario: Lista de problemas y metas ítem por ítem
- **WHEN** el usuario agrega los problemas "Overjet aumentado" y "Mordida profunda" y luego sube el segundo al primer lugar
- **THEN** se guardan en ese orden y se imprimen numerados "1. Mordida profunda" y "2. Overjet aumentado"
- **AND** un ítem vacío no se guarda; más de 30 ítems o un ítem de más de 500 caracteres responde `400`

#### Scenario: Dos planes de tratamiento
- **WHEN** el usuario escribe el Plan 1 y deja vacío el Plan 2
- **THEN** se imprimen ambos títulos: el Plan 1 con su texto y el Plan 2 sin texto ni líneas

#### Scenario: Apoderado firma por el paciente menor de edad
- **WHEN** la edad calculada del paciente es menor de 18 años
- **THEN** el paso de firmas pide nombre y parentesco del apoderado y la impresión muestra "FIRMA DEL APODERADO" con nombre, parentesco y línea de firma
- **AND** con 18 años o más, o sin fecha de nacimiento, pide el nombre del paciente (propuesto) e imprime "FIRMA DEL PACIENTE"; los datos del firmante que no aplica se descartan al guardar

#### Scenario: Fecha y supervisores a mano
- **WHEN** se imprime la página de firmas
- **THEN** "FECHA:" sale con su línea vacía para llenarla a mano y los nombres de supervisores salen como se escribieron (o en blanco, sin línea), cada uno con su línea de firma

#### Scenario: Deseleccionar una opción
- **WHEN** el usuario quita la selección de un campo de selección única
- **THEN** el campo queda vacío y se imprime con todas sus opciones sin marcar

### Requirement: Acceso por autor y administrador
Un `USER` SHALL ver, editar e imprimir solo las historias de las que es autor; un `ADMIN` SHALL ver, editar e imprimir todas. Para un `USER`, una historia de otro autor SHALL comportarse como inexistente. Ningún rol SHALL poder borrar historias en esta fase.

#### Scenario: Autor accede a su historia
- **WHEN** un `USER` abre una historia que creó
- **THEN** el sistema la muestra y le permite editarla e imprimirla

#### Scenario: USER intenta abrir una historia ajena
- **WHEN** un `USER` pide (leer o guardar) una historia creada por otro usuario
- **THEN** el sistema responde `404` sin revelar que existe ni su contenido
- **AND** la pantalla muestra "Historia no encontrada" con enlace al listado

#### Scenario: ADMIN accede a cualquier historia
- **WHEN** un `ADMIN` abre o guarda una historia creada por un `USER`
- **THEN** el sistema lo permite y la historia conserva a su autor original

#### Scenario: Historia inexistente
- **WHEN** se pide una historia con un identificador que no existe
- **THEN** el sistema responde `404`

### Requirement: Listado y búsqueda de historias
El sistema SHALL ofrecer la sección "Historias clínicas" con un listado paginado, ordenado por última modificación (más reciente primero), con número, paciente, documento, odontólogo tratante, fecha de inicio y última modificación. SHALL permitir buscar por nombre del paciente, número de documento o número de historia, sin distinguir mayúsculas ni tildes. Un `USER` SHALL ver solo sus historias; un `ADMIN`, todas, con una columna de autor.

#### Scenario: USER ve solo las suyas
- **WHEN** un `USER` abre "Historias clínicas" y existen historias suyas y de otros
- **THEN** el listado muestra solo las suyas

#### Scenario: ADMIN ve todas con su autor
- **WHEN** un `ADMIN` abre "Historias clínicas"
- **THEN** el listado muestra las historias de todos los usuarios con la columna "Autor"

#### Scenario: Búsqueda sin tildes ni mayúsculas
- **WHEN** el usuario busca "quispe" y existe la paciente "Ana QUÍSPE"
- **THEN** la historia aparece en el resultado

#### Scenario: Búsqueda por documento o número
- **WHEN** el usuario busca un número de documento o un número de historia existentes (p. ej. "aoc-0015")
- **THEN** el resultado incluye la historia correspondiente

#### Scenario: Búsqueda por el número corregido
- **WHEN** el número de una historia se corrige de "AOC-0015" a "AOC-0051"
- **THEN** buscar "aoc-0051" la encuentra y buscar "aoc-0015" ya no

#### Scenario: Búsqueda y página en la dirección
- **WHEN** el usuario busca "quispe" y pasa a la página 2 del listado
- **THEN** la dirección queda `/historias?q=quispe&pagina=2` y recargar o volver de otra pantalla conserva la búsqueda y la página

#### Scenario: Sin resultados
- **WHEN** la búsqueda no coincide con ninguna historia
- **THEN** el listado muestra un estado vacío "No hay historias que coincidan" con opción de limpiar la búsqueda

#### Scenario: Sin historias todavía
- **WHEN** el usuario no tiene ninguna historia
- **THEN** el listado muestra un estado vacío con el botón "Nueva historia"

### Requirement: Edición concurrente sin pérdida de cambios
El sistema SHALL detectar que una historia cambió desde que el usuario la cargó (otra pestaña, otro usuario) y NO SHALL sobrescribir esos cambios en silencio.

#### Scenario: Guardado sobre una versión desactualizada
- **WHEN** dos sesiones abren la misma historia, la primera guarda y luego guarda la segunda
- **THEN** el sistema responde `409` a la segunda sin modificar la historia
- **AND** el formulario avisa que la historia cambió y ofrece recargarla (descartando lo propio) o seguir editando para copiar lo escrito

### Requirement: Impresión con presentación del PDF
El sistema SHALL ofrecer una vista de impresión A4 de la historia que reproduce los títulos, el orden y los logos ARO/FACOP del PDF original, para imprimir o guardar como PDF desde el navegador. Los datos escritos en el sistema SHALL imprimirse como texto, sin las líneas del PDF (eran para llenar a mano); los campos de opciones SHALL listar todas las opciones con la elegida marcada; un campo de texto vacío NO SHALL imprimir líneas en blanco; cada sección SHALL empezar en página nueva como en el PDF; solo la fecha y las firmas (que se llenan sobre el papel) y los datos del paciente de la hoja 1 (PACIENTE a Celular, que conservan la forma del PDF) SHALL llevar su línea. La interfaz de la aplicación (menú, cabecera, botones) NO SHALL imprimirse.

#### Scenario: Imprimir una historia completa
- **WHEN** el usuario pulsa "Vista previa" en una historia
- **THEN** se abre en la misma pestaña la vista preliminar con las hojas A4 tal como saldrán, sin abrir el diálogo de impresión
- **AND** el diálogo de impresión del navegador se abre solo al pulsar "Imprimir" en esa vista
- **AND** "Volver" regresa a donde se abrió: el listado con su búsqueda y página, o el paso del formulario
- **AND** cada página lleva el logo ARO/FACOP y la cabecera "HISTORIA CLÍNICA ORTODONCIA Nro. <número>"

#### Scenario: Opciones de una pregunta en la hoja impresa
- **WHEN** una pregunta termina en ":" (p. ej. "3. PROPORCIÓN DE LOS TERCIOS FACIALES:")
- **THEN** sus opciones se imprimen en el renglón siguiente, juntas si caben en un renglón ("☐ Presenta ☒ No presenta")
- **AND** si no caben (p. ej. "5. RELACIÓN ANTEROPOSTERIOR DE LABIOS:"), una opción por renglón, sin partir la lista a la mitad

#### Scenario: Textos de la anamnesis sin respuesta
- **WHEN** se imprime una historia con algún texto de la anamnesis vacío (queja principal, gustos, historia médica, accidentes, estructura familiar, tratamiento general o herencia)
- **THEN** ese texto se imprime como "No refiere" en lugar de renglones en blanco
- **AND** en el formulario esos campos muestran "No refiere" como ayuda mientras están vacíos

#### Scenario: Opciones marcadas
- **WHEN** se imprime una historia con Tipo facial "Mesofacial"
- **THEN** la línea muestra "☒ Mesofacial ☐ Dolicofacial ☐ Braquifacial"

#### Scenario: Historia a medio llenar
- **WHEN** se imprime una historia con campos vacíos
- **THEN** esos campos salen sin texto ni líneas (salvo los textos de la anamnesis, que salen "No refiere") y las opciones sin marcar, sin textos como "null" o "undefined"

#### Scenario: Datos escritos sin líneas de llenado a mano
- **WHEN** se imprime una historia con diagnóstico general y lista de problemas escritos
- **THEN** esos datos salen como texto sin subrayado ni renglones debajo
- **AND** conservan su línea solo "FECHA:", las líneas "Firma" y los datos del paciente de la hoja 1 (PACIENTE, Edad, Domicilio, Fecha de inicio, Documento, Lugar y fecha de nacimiento, Celular)

#### Scenario: Textos largos
- **WHEN** un campo de texto libre ocupa más de lo que el PDF reserva
- **THEN** el texto se imprime completo continuando en la página siguiente, sin cortarse ni solaparse

#### Scenario: Hoja de notas de evolución para llenar a mano
- **WHEN** se imprime una historia
- **THEN** después de la hoja de firmas sale la hoja "Notas de evolución" en blanco, como la pág. 14 del PDF: "Tratante encargado:" y una tabla Fecha / Trabajo realizado / Firma de docente con 37 renglones vacíos para llenar a mano

#### Scenario: Sin acceso a la historia
- **WHEN** un `USER` abre la vista de impresión de una historia ajena
- **THEN** ve "Historia no encontrada" y no se imprime contenido

### Requirement: Análisis transversal de los modelos
El sistema SHALL registrar el análisis transversal de los modelos de la pág. 5 del PDF: AIS, AII, AMS y AMI; ancho del borde WALA, ancho X Pc, ancho X´ Pc y ancho X ideal; distancias WALA–EV de canino, 1er y 2do premolar, 1er y 2do molar inferiores; e interpretación. Las medidas SHALL estar en milímetros, entre 0 y 99,9, con a lo sumo un decimal. Paciente, edad y sexo SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión, la diferencia del AMS y del AMI con el promedio intermolar según el sexo del paciente (maxilar: 54,0 mm hombres / 52,4 mm mujeres; mandibular: 47,2 / 46,1 mm) y la diferencia de cada distancia WALA–EV con su norma (canino 0,6; 1er premolar 0,8; 2do premolar 1,3; 1er molar 2,0; 2do molar 2,2 mm).

#### Scenario: Diferencia con el promedio según el sexo
- **WHEN** la paciente es de sexo femenino y se registra AMS 50,1 mm y AMI 45,8 mm
- **THEN** se muestra e imprime "promedio 52,4 mm · −2,3" para el AMS y "promedio 46,1 mm · −0,3" para el AMI

#### Scenario: Sin sexo indicado
- **WHEN** el paciente no tiene sexo indicado
- **THEN** no se calcula la diferencia del AMS ni del AMI y se muestran los dos promedios como referencia

#### Scenario: Diferencia de las distancias WALA–EV
- **WHEN** se registra la distancia WALA–EV del 1er molar inferior en 2,6 mm
- **THEN** se muestra e imprime la norma 2,0 mm y la diferencia "+0,6"
- **AND** una distancia sin valor no muestra diferencia

#### Scenario: Ancho X ideal escrito a mano
- **WHEN** el usuario escribe el ancho X ideal
- **THEN** se guarda tal cual, sin calcularse a partir de otras medidas

#### Scenario: Medidas fuera de rango
- **WHEN** se guarda una medida negativa, de 100 mm o más, o con dos decimales
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de modelos
- **THEN** el paso 5 aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa del análisis transversal
- **WHEN** se imprime una historia
- **THEN** después de la hoja del análisis oclusal sale "ANÁLISIS DE MODELOS · Análisis Transversal de los Modelos" con paciente, edad y sexo, las medidas, las diferencias calculadas, el texto de referencia de los promedios y la interpretación

### Requirement: Análisis de Moyers
El sistema SHALL registrar la ficha para el análisis de Moyers de la pág. 6 del PDF en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), ancho mesiodistal de 42, 41, 31 y 32, espacio disponible de mandíbula y maxilar por lado (derecho e izquierdo), predisposición de apiñamiento dental (un texto por fila: Positivo, Nulo y Negativo, escrito por el odontólogo) e interpretación. Las medidas SHALL estar en milímetros con a lo sumo un decimal: los anchos de 42, 41, 31 y 32 entre 4,0 y 13,0 (el ancho real de una pieza) y los espacios disponibles entre 0 y 99,9. Nombre y edad SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión: la suma de los cuatro incisivos; el espacio requerido de cada arcada con la tabla de Moyers al 75 % a partir de la suma redondeada al 0,5 mm más cercano (igual para ambos lados); y la diferencia disponible − requerido por arcada y lado. La predisposición de apiñamiento SHALL NOT calcularse.

#### Scenario: Suma y espacio requerido
- **WHEN** se registran 42 = 6,0, 41 = 5,5, 31 = 5,4 y 32 = 6,1 mm
- **THEN** la suma de anteriores es 23,0 mm, el requerido mandibular es 22,2 mm y el maxilar 22,6 mm en ambos lados

#### Scenario: Redondeo de la suma
- **WHEN** la suma de los incisivos es 23,3 mm
- **THEN** el requerido se busca en la fila de 23,5 mm (mandibular 22,5, maxilar 22,9)

#### Scenario: Suma fuera de la tabla
- **WHEN** la suma de los incisivos es menor que 19,5 mm o mayor que 29,0 mm, o falta alguno de los cuatro
- **THEN** no se calcula el requerido ni la diferencia, y si hay suma se avisa que está fuera de la tabla de Moyers

#### Scenario: Diferencia disponible − requerido
- **WHEN** con requerido mandibular 22,2 y maxilar 22,6 se registra disponible mandíbula derecho 21,0, mandíbula izquierdo 22,6, maxilar derecho 23,5 y maxilar izquierdo 22,6
- **THEN** las diferencias son −1,2, +0,4, +0,9 y 0,0

#### Scenario: Predisposición de apiñamiento escrita por el odontólogo
- **WHEN** el odontólogo escribe en la fila Negativo "Mandíbula derecho" y deja vacías Positivo y Nulo
- **THEN** se guarda e imprime tal cual en la Tabla 2, sin completarse a partir de las diferencias

#### Scenario: Fecha anterior al tratamiento
- **WHEN** la fecha del análisis es anterior a la fecha de inicio de tratamiento
- **THEN** la historia se guarda sin errores

#### Scenario: Datos fuera de rango
- **WHEN** se guarda un ancho de incisivo menor que 4,0 mm o mayor que 13,0 mm, un espacio disponible negativo o de 100 mm o más, una medida con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de Moyers
- **THEN** el bloque aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa de Moyers
- **WHEN** se imprime una historia
- **THEN** después de la hoja del análisis transversal sale "FICHA PARA EL ANÁLISIS DE MOYERS" con nombre, edad y fecha, la ficha con incisivos, suma, disponible, requerido y diferencia, la tabla de predisposición de apiñamiento con lo escrito y la interpretación

#### Scenario: Flechas de un ancho de pieza
- **WHEN** el campo del ancho de una pieza está vacío y el usuario pulsa la flecha de subir
- **THEN** el valor pasa a 4,0 mm, y las flechas no lo llevan por debajo de 4,0 ni por encima de 13,0

### Requirement: Análisis de Nance
El sistema SHALL registrar la ficha del análisis de Nance & Carey (discrepancia óseo dentaria) de la pág. 7 del PDF en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), espacio disponible (SA) superior e inferior, ancho mesiodistal de las piezas 15 a 25 y 45 a 35, conclusión superior e inferior (escritas por el odontólogo) e interpretación. Las medidas SHALL estar en milímetros con a lo sumo un decimal: los anchos de las piezas entre 4,0 y 13,0 y el SA entre 0 y 99,9. Nombre y edad SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión, el espacio requerido (ST) de cada arcada como la suma de sus 10 piezas y la discrepancia SA − ST, y SHALL mostrar un dibujo de la arcada superior que indica las piezas que se miden. La conclusión SHALL NOT calcularse.

#### Scenario: Espacio requerido y discrepancia
- **WHEN** se registran las 10 piezas superiores con un total de 73,9 mm y SA superior 70,5 mm
- **THEN** el ST superior es 73,9 mm y la discrepancia superior es −3,4 mm

#### Scenario: Falta una pieza
- **WHEN** falta el ancho de alguna de las 10 piezas de una arcada
- **THEN** el ST y la discrepancia de esa arcada quedan vacíos y se avisa que faltan piezas por medir

#### Scenario: Conclusión escrita por el odontólogo
- **WHEN** el odontólogo escribe la conclusión superior "Falta de espacio leve" y deja vacía la inferior
- **THEN** se guarda e imprime tal cual, sin completarse a partir de la discrepancia

#### Scenario: Datos fuera de rango
- **WHEN** se guarda un ancho de pieza menor que 4,0 mm o mayor que 13,0 mm, un SA negativo o de 100 mm o más, una medida con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Flechas de un ancho de pieza
- **WHEN** el campo del ancho de una pieza está vacío y el usuario pulsa la flecha de subir
- **THEN** el valor pasa a 4,0 mm, y las flechas no lo llevan por debajo de 4,0 ni por encima de 13,0

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de Nance
- **THEN** el panel aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa de Nance
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Moyers sale "ANÁLISIS DE NANCE · DISCREPANCIA ÓSEO DENTARIA" con nombre, edad y fecha, SA y ST por arcada, el dibujo de la arcada, los anchos de cada pieza con su total, la tabla con discrepancia y conclusión, y la interpretación
- **AND** la pág. 8 del PDF (en blanco) no se imprime

### Requirement: Análisis de Bolton
El sistema SHALL registrar el análisis de Bolton de la pág. 9 del PDF, en español, en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), ancho mesiodistal de los incisivos 12, 11, 21, 22, 42, 41, 31 y 32 y de los primeros molares 16, 26, 46 y 36, e interpretación. Los anchos de los caninos y premolares (13, 14, 15, 23, 24, 25, 33, 34, 35, 43, 44 y 45) SHALL ser los mismos del análisis de Nance (un solo dato, editable desde cualquiera de los dos análisis); los incisivos y los primeros molares SHALL ser propios de Bolton. Los anchos SHALL estar entre 4,0 y 13,0 mm, con a lo sumo un decimal. El sistema SHALL calcular, en pantalla y en la impresión, la relación total (12 piezas por arcada; media 91,3 %, rango 87,5–94,8) y la relación anterior (6 piezas; media 77,2 %, rango 74,5–80,4): las sumas, la relación (suma mandibular ÷ suma maxilar × 100), si está dentro del rango y, según quede sobre o bajo la media, el real, el ideal y la diferencia de la arcada mandibular o de la maxilar. La fórmula SHALL mostrarse como fracción, con la suma mandibular sobre la línea y la maxilar debajo.

#### Scenario: Relación total con exceso mandibular
- **WHEN** la suma de los 12 superiores es 94,2 mm y la de los 12 inferiores 87,5 mm
- **THEN** la relación total es 92,9 %, dentro del rango, y del lado "sobre 91,3 %" se muestra real mandibular 87,5, ideal mandibular 86,0 y diferencia +1,5 mm
- **AND** el lado "bajo 91,3 %" queda vacío

#### Scenario: Relación anterior con exceso maxilar
- **WHEN** la suma de los 6 superiores anteriores es 48,0 mm y la de los 6 inferiores 36,0 mm
- **THEN** la relación anterior es 75,0 %, dentro del rango, y del lado "bajo 77,2 %" se muestra real maxilar 48,0, ideal maxilar 46,6 y diferencia +1,4 mm

#### Scenario: Fuera del rango
- **WHEN** la relación total es 96,0 %
- **THEN** se indica que está fuera del rango 87,5–94,8

#### Scenario: Caninos y premolares compartidos con Nance
- **WHEN** el usuario escribe el ancho de la pieza 13 en el análisis de Nance
- **THEN** el mismo valor aparece en la grilla de Bolton, y si lo cambia en Bolton cambia también en Nance

#### Scenario: Incisivos propios de Bolton
- **WHEN** el usuario escribe el ancho de la pieza 11 en el análisis de Nance
- **THEN** la pieza 11 de Bolton no cambia

#### Scenario: Incisivos de Bolton no afectan a Nance
- **WHEN** el usuario escribe el ancho de la pieza 11 en el análisis de Bolton
- **THEN** la pieza 11 de Nance no cambia, ni su total (ST)

#### Scenario: Aviso de las piezas sombreadas
- **WHEN** el usuario abre el análisis de Bolton
- **THEN** solo los caninos y premolares aparecen sombreados y el aviso dice que se comparten con Nance y que los incisivos y los primeros molares corresponden exclusivamente a Bolton

#### Scenario: Falta una pieza
- **WHEN** falta el ancho de alguna pieza de una suma
- **THEN** esa suma, su relación y sus resultados quedan vacíos

#### Scenario: Datos fuera de rango
- **WHEN** se guarda un ancho menor que 4,0 mm o mayor que 13,0 mm, con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Flechas de un ancho de pieza
- **WHEN** el campo del ancho de una pieza está vacío y el usuario pulsa la flecha de subir
- **THEN** el valor pasa a 4,0 mm, y las flechas no lo llevan por debajo de 4,0 ni por encima de 13,0

#### Scenario: Ancho guardado fuera de rango
- **WHEN** se abre una historia que tiene guardado un ancho fuera de 4,0–13,0 mm (de antes de este cambio)
- **THEN** la historia se abre y muestra el valor sin error
- **AND** al intentar guardar, el error aparece junto a ese campo y no se guarda hasta corregirlo

#### Scenario: Historias con incisivos en Nance guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de este cambio que tenía incisivos registrados en Nance
- **THEN** Bolton muestra esos mismos valores como incisivos propios (los copió la migración), y Nance conserva los suyos

#### Scenario: Historias sin incisivos en Nance guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de este cambio sin incisivos en Nance
- **THEN** los incisivos de Bolton aparecen vacíos y la historia se guarda sin errores

#### Scenario: Hoja impresa de Bolton
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Nance sale "ANÁLISIS DE BOLTON" con fecha, los anchos de las 24 piezas, la relación total y la anterior con su fórmula, sus resultados y la interpretación

### Requirement: Uso en celular y tablet
El módulo de historia clínica (listado, formulario de 8 pasos y vista previa) SHALL poder usarse desde 375 px de ancho sin desplazamiento horizontal de la página. Las acciones de cada historia y del formulario SHALL quedar visibles sin desplazarse de lado. Las tablas que no caben en el ancho SHALL desplazarse dentro de su propia caja, con un indicador visual de que hay más contenido. La hoja impresa SHALL NOT cambiar.

#### Scenario: Sin desplazamiento horizontal de página
- **WHEN** el usuario abre el listado, cualquiera de los 8 pasos (con todos los paneles del paso 5 abiertos) o la vista previa en una pantalla de 375 px o de 768 px de ancho
- **THEN** la página no se desplaza horizontalmente

#### Scenario: Listado en tarjetas
- **WHEN** el usuario abre el listado en una pantalla de menos de 1024 px de ancho
- **THEN** cada historia aparece como una tarjeta con número, paciente, documento, tratante, inicio y fecha de modificación
- **AND** los botones "Editar" y "Vista previa" de cada historia están visibles sin desplazarse

#### Scenario: Listado en tabla en escritorio
- **WHEN** el usuario abre el listado en una pantalla de 1024 px o más
- **THEN** las historias aparecen en la tabla, como hasta ahora

#### Scenario: Paso actual visible
- **WHEN** el usuario abre un paso en una pantalla de celular
- **THEN** el encabezado muestra "Paso N de 8" con su título y el botón "Pasos" para abrir la lista

#### Scenario: Vista previa escalada
- **WHEN** el usuario abre la vista previa en una pantalla más angosta que una hoja A4
- **THEN** las hojas se reducen para caber en el ancho y el botón "Imprimir" queda visible
- **AND** al imprimir, las hojas salen en tamaño A4 real, iguales que antes

#### Scenario: Tablas anchas del paso 5
- **WHEN** una grilla de piezas (Nance o Bolton) o una tabla de espacios no cabe en el ancho
- **THEN** se desplaza dentro de su caja con la columna de etiquetas fija, y un degradado en el borde indica que hay más contenido hasta llegar al final

#### Scenario: Puntos 1 y 2 de Nance en celular
- **WHEN** el usuario abre el análisis de Nance en una pantalla de celular
- **THEN** cada punto (SA y ST) se muestra como un bloque con su etiqueta completa y los campos "Superior" e "Inferior" visibles, sin columnas cortadas

#### Scenario: Barra de acciones compacta
- **WHEN** el usuario está en un paso del formulario en una pantalla de celular
- **THEN** "Anterior", "Guardar" y "Siguiente" caben en una sola fila, y "Anterior" y "Siguiente" conservan su nombre para el lector de pantalla

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

#### Scenario: Pasos deshabilitados en historia nueva
- **WHEN** el usuario está creando una historia que todavía no se guardó
- **THEN** los pasos de la lista (en la columna lateral o en el panel) están deshabilitados hasta crearla

#### Scenario: Navegación deshabilitada durante el guardado
- **WHEN** se está guardando la historia
- **THEN** los pasos de la lista están deshabilitados hasta que termine

#### Scenario: Error de validación al cambiar de paso desde el panel
- **WHEN** en una pantalla de celular el usuario elige otro paso en el panel y el paso actual tiene un campo inválido
- **THEN** el panel se cierra, no cambia de paso, el foco va al campo inválido y un aviso pide corregir los campos marcados

### Requirement: Límite de historias por tratante
Al crear una historia clínica, si el autor es un `USER` con cupo y ya creó tantas historias como su cupo, el sistema SHALL rechazar la creación con `409` y el mensaje "Alcanzaste el máximo de N historias clínicas. Comunícate con el administrador para solicitar más.", sin crear nada. La verificación SHALL hacerse de forma que dos creaciones simultáneas no superen el cupo. Editar, imprimir y buscar las historias existentes SHALL seguir igual. Un `ADMIN` no tiene cupo. En el listado, el tratante con cupo SHALL ver cuántas historias usó de su cupo ("N de M historias"), y, si llegó al tope, "Nueva historia" SHALL estar deshabilitado con el aviso visible.

#### Scenario: Crear dentro del cupo
- **WHEN** un `USER` con cupo 5 y 4 historias crea una historia
- **THEN** se crea normalmente y el listado muestra "5 de 5 historias"

#### Scenario: Crear con el cupo lleno
- **WHEN** un `USER` con cupo 5 y 5 historias intenta crear otra
- **THEN** la API responde `409` (`/errors/record-quota-reached`) con "Alcanzaste el máximo de 5 historias clínicas. Comunícate con el administrador para solicitar más." y no crea la historia

#### Scenario: Tratante nuevo con el cupo inicial
- **WHEN** un tratante recién registrado (cupo inicial 1) crea su primera historia e intenta crear otra
- **THEN** la primera se crea, el listado muestra "1 de 1 historias" y la segunda recibe `409` con "Alcanzaste el máximo de 1 historia clínica. Comunícate con el administrador para solicitar más."

#### Scenario: Botón deshabilitado al llegar al tope
- **WHEN** un `USER` con el cupo lleno abre el listado de historias
- **THEN** "Nueva historia" está deshabilitado y se ve el aviso "Alcanzaste el máximo de 5 historias clínicas. Comunícate con el administrador para solicitar más."

#### Scenario: Cupo cero sin historias
- **WHEN** un `USER` con cupo 0 y ninguna historia abre el listado
- **THEN** el estado vacío muestra "Nueva historia" deshabilitado con el aviso de que alcanzó el máximo

#### Scenario: Abrir el formulario nuevo con el cupo lleno
- **WHEN** un `USER` con el cupo lleno abre directamente la pantalla de nueva historia
- **THEN** ve el aviso desde el inicio y "Crear historia" está deshabilitado
- **AND** si el servidor rechaza una creación por cupo, el formulario muestra el aviso y no navega

#### Scenario: Editar con el cupo lleno
- **WHEN** un `USER` con el cupo lleno edita, guarda o imprime una de sus historias
- **THEN** todo funciona como siempre

#### Scenario: Cuenta sin cupo
- **WHEN** un `USER` sin cupo (cuenta anterior a este cambio, cupo quitado por el ADMIN o cupo inicial vacío) crea historias
- **THEN** puede crear todas las que quiera y el listado no muestra "N de M"

#### Scenario: Creaciones simultáneas
- **WHEN** un `USER` con cupo 5 y 4 historias envía dos creaciones al mismo tiempo
- **THEN** se crea una sola y la otra recibe `409`

#### Scenario: El ADMIN no tiene cupo
- **WHEN** un `ADMIN` crea historias
- **THEN** nunca se le aplica un límite

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

### Requirement: Autoguardado del paso en curso
En una historia ya creada, el sistema SHALL guardar automáticamente los cambios pendientes unos segundos después de que el usuario deja de editar (como máximo un autoguardado cada 10 segundos) y, de inmediato, cuando la pestaña deja de estar visible (cambio de app, pantalla bloqueada). Antes de autoguardar SHALL validar el paso actual; si tiene errores NO SHALL guardar y SHALL indicarlo. Un indicador junto al título SHALL mostrar el estado ("Guardando…", "Guardado", "Sin guardar: corrige los campos marcados", "No se pudo guardar" con opción de reintentar). Lo que el usuario escribe mientras un guardado está en curso NO SHALL perderse ni reemplazarse por la respuesta del servidor. El autoguardado NO SHALL mostrar notificaciones emergentes. Una historia nueva NO SHALL autoguardarse antes de crearse con "Crear historia".

#### Scenario: Guarda al dejar de escribir
- **WHEN** el usuario escribe en un campo de una historia ya creada y deja de editar unos segundos
- **THEN** el sistema guarda la historia sin que pulse nada y el indicador muestra "Guardado"
- **AND** al reabrir la historia en otro dispositivo el valor está ahí

#### Scenario: Pausas cortas seguidas
- **WHEN** el usuario edita con pausas de pocos segundos durante un minuto
- **THEN** el sistema autoguarda como máximo una vez cada 10 segundos y no pierde ningún cambio

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

### Requirement: Pasos con datos guardados con la historia
Al crear y al guardar una historia, el cliente SHALL enviar qué pasos tienen datos (`filledSteps`, un conjunto de 1–8 sin repetidos, el mismo criterio que la navegación de pasos: lo que viene por defecto no cuenta), y el servidor SHALL guardarlo con la historia y devolverlo. Al guardar, si no se envía, el valor guardado no cambia. Como el nombre del paciente es obligatorio, el servidor SHALL incluir siempre el paso 1 en lo que guarda (al crear, aunque el cliente no envíe el dato o envíe una lista vacía). La respuesta SHALL devolver los pasos tal como quedaron guardados. Una historia nunca guardada con este dato SHALL quedar "sin calcular". El servidor SHALL rechazar pasos fuera de 1–8 o repetidos con `400`.

#### Scenario: Guardar con los pasos llenos
- **WHEN** el usuario guarda una historia con datos en los pasos 1, 2 y 5
- **THEN** la historia queda con los pasos 1, 2 y 5 con datos

#### Scenario: Crear una historia
- **WHEN** el usuario crea una historia con el nombre del paciente, se envíe o no `filledSteps` (o se envíe vacío)
- **THEN** la historia nace con el paso 1 con datos, no "sin calcular"

#### Scenario: Historia anterior a este cambio
- **WHEN** se consulta una historia que no se volvió a guardar desde este cambio
- **THEN** sus pasos con datos figuran como sin calcular

#### Scenario: Paso inválido
- **WHEN** se guarda una historia con `filledSteps` que incluye 9, o `[1, 1, 2]`
- **THEN** la API responde `400` con el error en `filledSteps` y no guarda

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
- **AND** la vista se desplaza hasta el aviso aunque el usuario estuviera más abajo en el formulario
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

