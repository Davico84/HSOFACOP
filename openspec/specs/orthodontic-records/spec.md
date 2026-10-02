# orthodontic-records Specification

## Purpose
Historia clínica de ortodoncia de la clínica AEO/FACOP en formato digital: el tratante la llena en un formulario de 7 pasos que sigue el PDF de la clínica (anamnesis, análisis facial, funcional, oclusal y radiográfico, diagnóstico, planes y firmas), la guarda como borrador, la encuentra en un listado con búsqueda y la imprime en hojas A4 con la presentación del PDF. Un `USER` (tratante) alcanza solo sus historias; un `ADMIN` (supervisor), todas. Fase 1: los análisis de modelos y las notas de evolución digitalizadas llegan en changes posteriores.
## Requirements
### Requirement: Crear una historia clínica de ortodoncia
El sistema SHALL permitir a cualquier usuario autenticado (`USER` o `ADMIN`) crear una historia clínica de ortodoncia indicando como mínimo el nombre del paciente. La historia SHALL quedar asociada a su autor, y el odontólogo tratante SHALL proponerse con el nombre completo del autor (editable). Al crearla, el sistema SHALL asignarle un número correlativo **por autor** con formato `AEO-` seguido del correlativo con al menos 3 cifras (`AEO-001`, `AEO-002`, …, `AEO-1000`); el número NO SHALL poder editarse ni repetirse para el mismo autor.

#### Scenario: Creación con el mínimo de datos
- **WHEN** un usuario autenticado crea una historia con el nombre del paciente "Ana Quispe"
- **THEN** el sistema guarda la historia, responde `201` con su identificador y número, y la abre en el primer paso del formulario
- **AND** el autor de la historia es ese usuario y el odontólogo tratante propuesto es su nombre completo

#### Scenario: Primer número de un usuario
- **WHEN** un usuario sin historias crea su primera historia
- **THEN** su número es `AEO-001`

#### Scenario: Correlativo independiente por usuario
- **WHEN** el usuario A ya tiene `AEO-001` y `AEO-002`, y el usuario B no tiene ninguna
- **THEN** la siguiente historia de A es `AEO-003` y la primera de B es `AEO-001`

#### Scenario: Creaciones simultáneas del mismo usuario
- **WHEN** el mismo usuario crea dos historias a la vez (dos pestañas)
- **THEN** ambas se crean con números distintos y consecutivos, sin error

#### Scenario: Más de 999 historias
- **WHEN** un usuario con `AEO-999` crea otra historia
- **THEN** su número es `AEO-1000`

#### Scenario: El número no se edita
- **WHEN** una petición de guardado incluye un número distinto al asignado
- **THEN** el sistema conserva el número asignado e ignora el enviado

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

#### Scenario: Saltar a un paso desde el indicador
- **WHEN** el usuario pulsa el paso 7 en el indicador de pasos estando en el paso 1 con cambios
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

#### Scenario: Preguntas Sí/No de la anamnesis
- **WHEN** el usuario responde "Sí" en Higiene oral y "No" en Hábitos de succión de la anamnesis
- **THEN** se guardan como selección única y se imprimen "☒ Sí ☐ No" y "☐ Sí ☒ No"

#### Scenario: Pregunta solo para niñas
- **WHEN** el sexo del paciente es masculino o no está indicado
- **THEN** la pregunta "¿La 1ª menstruación ya ocurrió?" no se muestra ni se imprime
- **AND** si tenía respuesta y el sexo cambia a masculino, la respuesta se descarta al guardar

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
- **WHEN** el usuario marca Steiner, McNamara y Wits en el análisis radiográfico
- **THEN** se guardan los tres, el formulario indica "3 de 3" y la impresión lista las cuatro opciones con las elegidas marcadas
- **AND** con menos de 3 marcados la historia se guarda igual (es un borrador) y el formulario muestra "n de 3"

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
- **WHEN** el usuario busca un número de documento o un número de historia existentes (p. ej. "aeo-001")
- **THEN** el resultado incluye la historia correspondiente

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
El sistema SHALL registrar la ficha para el análisis de Moyers de la pág. 6 del PDF en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), ancho mesiodistal de 42, 41, 31 y 32, espacio disponible de mandíbula y maxilar por lado (derecho e izquierdo), predisposición de apiñamiento dental (un texto por fila: Positivo, Nulo y Negativo, escrito por el odontólogo) e interpretación. Las medidas SHALL estar en milímetros, entre 0 y 99,9, con a lo sumo un decimal. Nombre y edad SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión: la suma de los cuatro incisivos; el espacio requerido de cada arcada con la tabla de Moyers al 75 % a partir de la suma redondeada al 0,5 mm más cercano (igual para ambos lados); y la diferencia disponible − requerido por arcada y lado. La predisposición de apiñamiento SHALL NOT calcularse.

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
- **WHEN** se guarda una medida negativa, de 100 mm o más, con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de Moyers
- **THEN** el bloque aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa de Moyers
- **WHEN** se imprime una historia
- **THEN** después de la hoja del análisis transversal sale "FICHA PARA EL ANÁLISIS DE MOYERS" con nombre, edad y fecha, la ficha con incisivos, suma, disponible, requerido y diferencia, la tabla de predisposición de apiñamiento con lo escrito y la interpretación

