## ADDED Requirements

### Requirement: Análisis de Nance
El sistema SHALL registrar la ficha del análisis de Nance & Carey (discrepancia óseo dentaria) de la pág. 7 del PDF en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), espacio disponible (SA) superior e inferior, ancho mesiodistal de las piezas 15 a 25 y 45 a 35, conclusión superior e inferior (escritas por el odontólogo) e interpretación. Las medidas SHALL estar en milímetros, entre 0 y 99,9, con a lo sumo un decimal. Nombre y edad SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión, el espacio requerido (ST) de cada arcada como la suma de sus 10 piezas y la discrepancia SA − ST, y SHALL mostrar un dibujo de la arcada superior que indica las piezas que se miden. La conclusión SHALL NOT calcularse.

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
- **WHEN** se guarda una medida negativa, de 100 mm o más, con dos decimales, o una fecha futura
- **THEN** el sistema responde `400` con el error en ese campo y no guarda

#### Scenario: Historias guardadas antes del cambio
- **WHEN** se abre una historia guardada antes de existir el análisis de Nance
- **THEN** el panel aparece vacío y la historia se guarda sin errores

#### Scenario: Hoja impresa de Nance
- **WHEN** se imprime una historia
- **THEN** después de la hoja de Moyers sale "ANÁLISIS DE NANCE · DISCREPANCIA ÓSEO DENTARIA" con nombre, edad y fecha, SA y ST por arcada, el dibujo de la arcada, los anchos de cada pieza con su total, la tabla con discrepancia y conclusión, y la interpretación
- **AND** la pág. 8 del PDF (en blanco) no se imprime
