## ADDED Requirements

### Requirement: Análisis de Bolton
El sistema SHALL registrar el análisis de Bolton de la pág. 9 del PDF, en español, en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), ancho mesiodistal de los primeros molares 16, 26, 46 y 36, e interpretación. Los anchos de 15 a 25 y de 45 a 35 SHALL ser los mismos del análisis de Nance (un solo dato, editable desde cualquiera de los dos análisis). Las medidas SHALL estar en milímetros, entre 0 y 99,9, con a lo sumo un decimal. El sistema SHALL calcular, en pantalla y en la impresión, la relación total (12 piezas por arcada; media 91,3 %, rango 87,5–94,8) y la relación anterior (6 piezas; media 77,2 %, rango 74,5–80,4): las sumas, la relación (suma mandibular ÷ suma maxilar × 100), si está dentro del rango y, según quede sobre o bajo la media, el real, el ideal y la diferencia de la arcada mandibular o de la maxilar. La fórmula SHALL mostrarse como fracción, con la suma mandibular sobre la línea y la maxilar debajo.

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

#### Scenario: Anchos compartidos con Nance
- **WHEN** el usuario escribe el ancho de la pieza 11 en el análisis de Nance
- **THEN** el mismo valor aparece en la grilla de Bolton, y si lo cambia en Bolton cambia también en Nance

#### Scenario: Falta una pieza
- **WHEN** falta el ancho de alguna pieza de una suma
- **THEN** esa suma, su relación y sus resultados quedan vacíos

#### Scenario: Datos fuera de rango
- **WHEN** se guarda un ancho de molar negativo, de 100 mm o más, con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de Bolton
- **THEN** el panel aparece vacío (con los anchos que ya tenga Nance) y la historia se guarda sin errores

#### Scenario: Hoja impresa de Bolton
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Nance sale "ANÁLISIS DE BOLTON" con fecha, los anchos de las 24 piezas, la relación total y la anterior con su fórmula, sus resultados y la interpretación
