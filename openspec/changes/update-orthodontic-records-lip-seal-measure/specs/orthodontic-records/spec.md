## ADDED Requirements

### Requirement: Medida del sellado labial
En "4. Sellado labial" del análisis facial, con la respuesta "Presenta", el sistema SHALL permitir registrar la separación interlabial en milímetros, opcional, entre 0 y 20 mm con a lo sumo un decimal. Con otra respuesta o sin respuesta, la medida NO SHALL mostrarse y SHALL descartarse al guardar. La hoja impresa SHALL mostrar la medida junto a la pregunta cuando la respuesta es "Presenta" y hay medida.

#### Scenario: Registrar la medida con "Presenta"
- **WHEN** el usuario marca "Presenta" en "4. Sellado labial" y escribe 2,5 en "Separación interlabial (mm)"
- **THEN** se guardan la respuesta y la medida 2,5 mm

#### Scenario: La medida solo aparece con "Presenta"
- **WHEN** la respuesta de "4. Sellado labial" es "No presenta" o está vacía
- **THEN** el campo de la medida no se muestra
- **AND** si tenía una medida y la respuesta cambia a "No presenta" o se quita, la medida se descarta al guardar

#### Scenario: Medida fuera de rango
- **WHEN** la medida es menor que 0, mayor que 20 o tiene más de un decimal
- **THEN** el formulario muestra el error junto al campo y el servidor responde `400` con el error en ese campo sin guardar la historia

#### Scenario: Medida opcional
- **WHEN** el usuario marca "Presenta" y deja la medida vacía
- **THEN** la historia se guarda con la respuesta y sin medida

#### Scenario: Medida en la hoja impresa
- **WHEN** se imprime una historia con "Presenta" y la medida 2,5 mm
- **THEN** la línea "4. SELLADO LABIAL" muestra la opción marcada y "2,5 mm"
- **AND** sin medida, la línea queda como hoy

#### Scenario: Historias anteriores sin medida
- **WHEN** se abre una historia guardada antes de este cambio
- **THEN** se muestra y se imprime como antes, con la medida vacía

### Requirement: Cambio de paso al inicio del paso
Al cambiar de paso en el formulario de la historia (con "Siguiente", "Anterior", la lista de pasos o el panel de pasos en celular), el sistema SHALL llevar la vista al inicio de la página y SHALL dar el foco al título del paso nuevo, sin animación de desplazamiento. Al abrir o recargar una historia, o cuando el cambio de paso no ocurre (por ejemplo, por errores del paso actual), la vista NO SHALL moverse.

#### Scenario: Siguiente desde el final del paso
- **WHEN** el usuario está al final del paso 4 y pulsa "Siguiente"
- **THEN** el formulario muestra el paso 5 con la vista al inicio de la página
- **AND** el título "5. Análisis de modelos" tiene el foco

#### Scenario: Elegir un paso de la lista
- **WHEN** el usuario está abajo de un paso y elige otro en la lista de pasos (o en el panel de pasos en celular)
- **THEN** el paso elegido se muestra desde el inicio de la página

#### Scenario: El paso no cambia
- **WHEN** el usuario pulsa "Siguiente" y el paso actual tiene errores o el guardado falla
- **THEN** sigue en el mismo paso y la vista no se mueve

#### Scenario: Abrir o recargar una historia
- **WHEN** el usuario abre una historia o recarga la página en un paso
- **THEN** la vista no se desplaza por este motivo

## MODIFIED Requirements

### Requirement: Secciones clínicas de la fase 1
El formulario SHALL cubrir los campos de las págs. 1–4 y 10–13 del PDF. Donde el PDF ofrece opciones sobre líneas, SHALL usar selección única, salvo en las listas que admiten más de una (hábitos de succión del análisis funcional), con selección múltiple; donde deja líneas para escribir, texto libre. Los campos condicionados SHALL mostrarse solo cuando aplican y descartarse al guardar si su condición deja de cumplirse. Los valores numéricos SHALL respetar su unidad y rango.

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
- **THEN** la pregunta "¿La 1ª menstruación ya ocurrió?" y su edad no se muestran ni se imprimen
- **AND** si tenían valor y el sexo cambia a masculino o se quita, ambos se descartan al guardar

#### Scenario: Fecha de la primera menstruación
- **WHEN** el sexo es femenino, el usuario responde "Sí" y registra que ocurrió a los 13 años
- **THEN** se guardan la respuesta y la edad (años enteros) y se imprimen
- **AND** si la respuesta cambia a "No", la edad se oculta y se descarta al guardar

#### Scenario: Fecha de la primera menstruación inválida
- **WHEN** la edad de la primera menstruación no es un entero entre 8 y 18 años, o con fecha de nacimiento supera la edad actual de la paciente (zona horaria de la clínica)
- **THEN** el sistema responde `400` con el error en ese campo y no guarda la historia
- **AND** el formulario muestra el mensaje junto al campo; sin fecha de nacimiento solo se exige el rango de 8 a 18

#### Scenario: Historias con la fecha completa de la primera menstruación
- **WHEN** una historia guardada antes de este cambio tenía el año de la primera menstruación 2023 y la fecha de nacimiento 20/05/2010
- **THEN** pasa a registrar la edad 13 (año de la menstruación − año de nacimiento) y deja de guardar el año
- **AND** si no tenía fecha de nacimiento, o el cálculo no da una edad positiva, el dato queda vacío y la respuesta "Sí" se conserva

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
