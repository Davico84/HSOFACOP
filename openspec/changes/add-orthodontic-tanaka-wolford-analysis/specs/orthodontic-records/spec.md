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
El sistema SHALL registrar el análisis de Wolford en el paso "Análisis de modelos", en un panel tras Bolton: suma de los anchos de las 12 piezas maxilares y de las 12 mandibulares (del primer molar al primer molar) y de las 6 maxilares y las 6 mandibulares (de canino a canino), e interpretación escrita por el tratante. Las sumas de 12 SHALL estar entre 0 y 199,9 mm y las de 6 entre 0 y 99,9 mm, con a lo sumo un decimal.

#### Scenario: Datos de Wolford
- **WHEN** el tratante deja las cuatro sumas y escribe la interpretación
- **THEN** se guardan e imprimen tal cual

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
Cada suma de Tanaka-Johnston y de Wolford SHALL tomarse sola de los anchos ya registrados, con una nota visible que diga de dónde sale: la de Tanaka, de los incisivos de Moyers; las de Wolford, de las piezas de Bolton y Nance. El tratante SHALL poder escribir otro valor; desde entonces SHALL usarse el suyo, la nota SHALL indicarlo junto al valor calculado y SHALL ofrecer volver a usarlo. Si faltan anchos para calcularla, la suma SHALL quedar vacía con una nota de qué completar.

#### Scenario: Suma tomada de Moyers
- **WHEN** Moyers tiene 42 = 6,0, 41 = 5,5, 31 = 5,4 y 32 = 6,1 mm y el tratante no escribió la suma de Tanaka
- **THEN** la suma de Tanaka muestra 23,0 mm con la nota "Tomada de los incisivos de Moyers"

#### Scenario: Suma escrita por el tratante
- **WHEN** el tratante escribe 23,5 mm en la suma de Tanaka con Moyers en 23,0 mm
- **THEN** se usa 23,5 mm, la nota dice que es un valor editado y que Moyers da 23,0 mm, y "Usar el de Moyers" vuelve a 23,0 mm

#### Scenario: El valor sugerido sigue a la medición
- **WHEN** el tratante corrige un ancho de Bolton y no había escrito la suma de 12 maxilares de Wolford
- **THEN** la suma de Wolford cambia con el ancho corregido

#### Scenario: Faltan anchos
- **WHEN** falta el ancho de alguna de las 12 piezas maxilares en Bolton y Nance
- **THEN** la suma de 12 maxilares queda vacía con la nota "Completa los anchos en Bolton y Nance o escribe la suma"

#### Scenario: Lo sugerido no cuenta como dato
- **WHEN** una historia tiene los análisis nuevos solo con sumas sugeridas y sin interpretación
- **THEN** esos análisis no hacen que el paso figure "con datos"

### Requirement: Hojas impresas de Tanaka-Johnston y Wolford
La impresión SHALL incluir cada análisis en su propia hoja, con nombre y edad del paciente: "FÓRMULA DE TANAKA-JOHNSTON" tras la hoja de Moyers, con la suma, los espacios maxilar y mandibular con su fórmula y la interpretación; y "ANÁLISIS DE WOLFORD" tras la hoja de Bolton, con las cuatro sumas, las discrepancias total y parcial con su fórmula y la interpretación. La hoja SHALL mostrar el valor usado, sea sugerido o escrito.

#### Scenario: Hoja de Tanaka-Johnston
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Moyers sale "FÓRMULA DE TANAKA-JOHNSTON" con "MAX (suma ÷ 2) + 11 = …" y "MAND (suma ÷ 2) + 10,5 = …" y la interpretación

#### Scenario: Hoja de Wolford
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Bolton sale "ANÁLISIS DE WOLFORD" con la discrepancia total y la parcial, sus fórmulas y la interpretación

### Requirement: Historias guardadas antes de Tanaka-Johnston y Wolford
Una historia guardada antes de este cambio SHALL abrirse y guardarse sin errores y sin perder ningún dato: los análisis nuevos SHALL aparecer con las sumas sugeridas y sin interpretación.

#### Scenario: Historia anterior
- **WHEN** se abre una historia guardada antes de existir estos análisis
- **THEN** todos sus datos siguen igual, Tanaka-Johnston y Wolford aparecen con las sumas sugeridas de lo ya medido y la historia se guarda sin errores
