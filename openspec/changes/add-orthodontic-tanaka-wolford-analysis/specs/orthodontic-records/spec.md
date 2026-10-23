## ADDED Requirements

### Requirement: Fórmula de Tanaka-Johnston
El sistema SHALL registrar la fórmula de Tanaka-Johnston en el paso "Análisis de modelos", en un panel tras Moyers: la suma de los anchos de los cuatro incisivos inferiores (42, 41, 31 y 32) e interpretación escrita por el tratante. La suma SHALL estar entre 0 y 99,9 mm con a lo sumo un decimal.

#### Scenario: Datos de Tanaka-Johnston
- **WHEN** el tratante deja la suma en 23,0 mm y escribe la interpretación
- **THEN** se guardan e imprimen tal cual

#### Scenario: Suma fuera de rango
- **WHEN** se guarda una suma negativa, de 100 mm o más o con dos decimales
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

### Requirement: Cálculos de Tanaka-Johnston
El sistema SHALL calcular, en pantalla y en la impresión, el espacio previsto para canino y premolares de cada arcada: maxilar = suma ÷ 2 + 11 y mandibular = suma ÷ 2 + 10,5, redondeados a un decimal (la mitad hacia arriba). Sin suma NO SHALL calcularse nada.

#### Scenario: Espacio previsto
- **WHEN** la suma de los incisivos es 23,0 mm
- **THEN** el maxilar es 22,5 mm y el mandibular 22,0 mm

#### Scenario: Redondeo
- **WHEN** la suma es 23,3 mm
- **THEN** el maxilar es 22,7 mm y el mandibular 22,2 mm

#### Scenario: Sin suma
- **WHEN** la suma está vacía
- **THEN** maxilar y mandibular quedan vacíos

### Requirement: Análisis de Wolford
El sistema SHALL registrar el análisis de Wolford en el paso "Análisis de modelos", en un panel tras Bolton: suma de los anchos de 12 piezas maxilares (16 a 26), 12 mandibulares (46 a 36), 6 maxilares (13 a 23) y 6 mandibulares (43 a 33), e interpretación escrita por el tratante. Las sumas de 12 SHALL estar entre 0 y 199,9 mm y las de 6 entre 0 y 99,9 mm, con a lo sumo un decimal.

#### Scenario: Datos de Wolford
- **WHEN** el tratante deja las cuatro sumas y escribe la interpretación
- **THEN** se guardan e imprimen tal cual

#### Scenario: Piezas de cada suma
- **WHEN** se calcula la suma sugerida de Wolford
- **THEN** la de 12 maxilares suma 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25 y 26; la de 12 mandibulares 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35 y 36; la de 6 maxilares 13, 12, 11, 21, 22 y 23; y la de 6 mandibulares 43, 42, 41, 31, 32 y 33

#### Scenario: Suma fuera de rango
- **WHEN** se guarda una suma negativa, una de 12 piezas de 200 mm o más, una de 6 piezas de 100 mm o más o una con dos decimales
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

### Requirement: Cálculos de Wolford
El sistema SHALL calcular, en pantalla y en la impresión: discrepancia total = suma 12 maxilares − (suma 12 mandibulares × 1,1) y discrepancia parcial = suma 6 maxilares − (suma 6 mandibulares × 1,3), redondeadas a un decimal (la mitad hacia arriba), con su signo. Si falta una de las dos sumas de una discrepancia, esa discrepancia NO SHALL calcularse.

#### Scenario: Discrepancias
- **WHEN** la suma 12 maxilar es 96,0, la 12 mandibular 88,0, la 6 maxilar 46,0 y la 6 mandibular 35,0 mm
- **THEN** la discrepancia total es −0,8 mm y la parcial +0,5 mm

#### Scenario: Falta una suma
- **WHEN** la suma 6 mandibular está vacía
- **THEN** la discrepancia parcial queda vacía y la total se calcula si tiene sus dos sumas

### Requirement: Sumas sugeridas a partir de lo ya medido
Cada suma de Tanaka-Johnston y de Wolford SHALL tomarse sola de los anchos ya registrados, con una nota visible que diga de dónde sale: la de Tanaka, solo de los incisivos de Moyers; las de Wolford, de incisivos y primeros molares de Bolton y caninos y premolares de Nance. Si falta un ancho o alguno está fuera de 4,0–13,0 mm, la suma SHALL quedar vacía con una nota de qué corregir.

#### Scenario: Suma tomada de Moyers
- **WHEN** Moyers tiene 42 = 6,0, 41 = 5,5, 31 = 5,4 y 32 = 6,1 mm y el tratante no escribió la suma de Tanaka
- **THEN** la suma de Tanaka muestra 23,0 mm con la nota "Tomada de los incisivos de Moyers"

#### Scenario: El valor sugerido sigue a la medición
- **WHEN** el tratante corrige un ancho de Bolton y no había escrito la suma de 12 maxilares de Wolford
- **THEN** la suma de Wolford cambia con el ancho corregido

#### Scenario: Faltan anchos
- **WHEN** falta el ancho de alguna de las 12 piezas maxilares en Bolton y Nance
- **THEN** la suma de 12 maxilares queda vacía con la nota "Completa los anchos en Bolton y Nance o escribe la suma"

#### Scenario: Ancho fuente fuera de rango
- **WHEN** una historia anterior tiene guardado un ancho de Bolton fuera de 4,0–13,0 mm
- **THEN** la suma que lo usa queda vacía con la nota "Corrige los anchos fuera de rango o escribe la suma" y el ancho guardado no cambia

#### Scenario: Tanaka no usa los incisivos de Nance ni de Bolton
- **WHEN** los incisivos inferiores de Moyers están vacíos y los de Nance y Bolton tienen valores
- **THEN** la suma de Tanaka queda vacía con la nota de completar los incisivos de Moyers

### Requirement: Sumas escritas por el tratante
El tratante SHALL poder escribir otro valor en una suma sugerida; desde entonces SHALL usarse el suyo, con una nota que lo indica junto al valor calculado y la opción de volver a él. Mostrar una sugerencia NO SHALL modificar la historia.

#### Scenario: Suma escrita por el tratante
- **WHEN** el tratante escribe 23,5 mm en la suma de Tanaka con Moyers en 23,0 mm
- **THEN** se usa 23,5 mm, la nota dice que es un valor editado y que Moyers da 23,0 mm, y "Usar el de Moyers" vuelve a 23,0 mm

#### Scenario: Borrar una suma escrita
- **WHEN** todos los anchos fuente están completos y el tratante borra la suma que había escrito
- **THEN** la suma vuelve a la sugerida, no queda vacía y no cuenta como dato

#### Scenario: Ver una sugerencia no modifica la historia
- **WHEN** se abre una historia y solo se muestran sumas sugeridas
- **THEN** la historia no queda con cambios sin guardar ni dispara un autoguardado

#### Scenario: Lo sugerido no cuenta como dato
- **WHEN** una historia tiene los análisis nuevos solo con sumas sugeridas y sin interpretación
- **THEN** esos análisis no hacen que el paso figure "con datos"

### Requirement: Hojas impresas de Tanaka-Johnston y Wolford
La impresión SHALL incluir cada análisis en su propia hoja, con nombre y edad: "FÓRMULA DE TANAKA-JOHNSTON" tras la hoja de Moyers (suma, espacios maxilar y mandibular con su fórmula e interpretación) y "ANÁLISIS DE WOLFORD" tras la de Bolton (cuatro sumas, discrepancias total y parcial con su fórmula e interpretación), con el valor usado, sugerido o escrito. Sin una suma, la fila y su fórmula SHALL imprimirse con el resultado "—".

#### Scenario: Hoja de Tanaka-Johnston
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Moyers sale "FÓRMULA DE TANAKA-JOHNSTON" con "MAX (suma ÷ 2) + 11 = …" y "MAND (suma ÷ 2) + 10,5 = …" y la interpretación

#### Scenario: Hoja de Wolford
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Bolton sale "ANÁLISIS DE WOLFORD" con la discrepancia total y la parcial, sus fórmulas y la interpretación

#### Scenario: Grilla de anchos en la hoja de Wolford
- **WHEN** se imprime una historia
- **THEN** la hoja de Wolford incluye la grilla "Ancho mesiodistal de las 12 piezas" con los números de pieza 16 a 26 y 46 a 36 y los anchos registrados en Bolton y Nance (casilla vacía si falta el ancho), sin pedirlos de nuevo en el formulario

#### Scenario: Hoja con una suma vacía
- **WHEN** se imprime una historia sin la suma de 6 mandibulares
- **THEN** la fila de la discrepancia parcial sale con su fórmula, la suma de 6 maxilares y el resultado "—", sin signo

#### Scenario: Dos hojas más
- **WHEN** se imprime la misma historia antes y después de este cambio
- **THEN** la impresión tiene dos páginas más, en ese orden, y la marca "AVANCE · N de 7" mantiene el mismo N

### Requirement: Historias guardadas antes de Tanaka-Johnston y Wolford
Una historia guardada antes de este cambio SHALL abrirse sin perder ni corregir ningún dato existente, incluidos los anchos guardados fuera de rango, y guardarse sin errores si es válida; los análisis nuevos SHALL aparecer con las sumas sugeridas y sin interpretación.

#### Scenario: Historia anterior
- **WHEN** se abre una historia guardada antes de existir estos análisis
- **THEN** todos sus datos siguen igual, Tanaka-Johnston y Wolford aparecen con las sumas sugeridas de lo ya medido y la historia se guarda sin errores

#### Scenario: Historia anterior con un ancho fuera de rango
- **WHEN** se abre una historia anterior con un ancho de Bolton fuera de 4,0–13,0 mm
- **THEN** se abre mostrando ese valor tal cual y, al guardar, el error aparece solo junto a ese campo y no se guarda hasta corregirlo

## MODIFIED Requirements

### Requirement: Análisis de Nance
El sistema SHALL registrar la ficha del análisis de Nance & Carey (discrepancia óseo dentaria) de la pág. 7 del PDF en el paso "Análisis de modelos": fecha del análisis, espacio disponible (SA) superior e inferior, ancho mesiodistal de las piezas 15 a 25 y 45 a 35, conclusión superior e inferior (escritas por el odontólogo, que SHALL NOT calcularse) e interpretación. Nombre y edad SHALL tomarse de la historia.

#### Scenario: Conclusión escrita por el odontólogo
- **WHEN** el odontólogo escribe la conclusión superior "Falta de espacio leve" y deja vacía la inferior
- **THEN** se guarda e imprime tal cual, sin completarse a partir de la discrepancia

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de Nance
- **THEN** el panel aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa de Nance
- **WHEN** se imprime una historia
- **THEN** después de la hoja de la fórmula de Tanaka-Johnston (que sigue a la de Moyers) sale "ANÁLISIS DE NANCE · DISCREPANCIA ÓSEO DENTARIA" con nombre, edad y fecha, SA y ST por arcada, el dibujo de la arcada, los anchos de cada pieza con su total, la tabla con discrepancia y conclusión, y la interpretación
- **AND** la pág. 8 del PDF (en blanco) no se imprime
