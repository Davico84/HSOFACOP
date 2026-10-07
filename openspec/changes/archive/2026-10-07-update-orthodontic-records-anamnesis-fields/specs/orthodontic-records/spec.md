## MODIFIED Requirements

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
