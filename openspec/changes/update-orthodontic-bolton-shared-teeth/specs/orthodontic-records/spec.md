## MODIFIED Requirements

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
- **THEN** la pieza 11 de Bolton no cambia, y la de Bolton se registra por separado

#### Scenario: Aviso de las piezas sombreadas
- **WHEN** el usuario abre el análisis de Bolton
- **THEN** solo los caninos y premolares aparecen sombreados y el aviso dice que se comparten con Nance y que los incisivos y los primeros molares corresponden exclusivamente a Bolton

#### Scenario: Falta una pieza
- **WHEN** falta el ancho de alguna pieza de una suma
- **THEN** esa suma, su relación y sus resultados quedan vacíos

#### Scenario: Datos fuera de rango
- **WHEN** se guarda un ancho menor que 4,0 mm o mayor que 13,0 mm, con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada con Bolton antes de que tuviera incisivos propios
- **THEN** Bolton muestra en sus incisivos los valores que esa historia tenía en Nance, y la historia se guarda sin errores

#### Scenario: Hoja impresa de Bolton
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Nance sale "ANÁLISIS DE BOLTON" con fecha, los anchos de las 24 piezas, la relación total y la anterior con su fórmula, sus resultados y la interpretación
