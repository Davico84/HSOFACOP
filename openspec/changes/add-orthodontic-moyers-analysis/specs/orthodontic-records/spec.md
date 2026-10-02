## ADDED Requirements

### Requirement: Análisis de Moyers
El sistema SHALL registrar la ficha para el análisis de Moyers de la pág. 6 del PDF en el paso "Análisis de modelos": fecha del análisis (escrita por el tratante, puede ser anterior al inicio del tratamiento y no puede ser futura), ancho mesiodistal de 42, 41, 31 y 32, espacio disponible de mandíbula y maxilar por lado (derecho e izquierdo) e interpretación. Las medidas SHALL estar en milímetros, entre 0 y 99,9, con a lo sumo un decimal. Nombre y edad SHALL tomarse de la historia. El sistema SHALL calcular, en pantalla y en la impresión: la suma de los cuatro incisivos; el espacio requerido de cada arcada con la tabla de Moyers al 75 % a partir de la suma redondeada al 0,5 mm más cercano (igual para ambos lados); la diferencia disponible − requerido por arcada y lado; y la predisposición de apiñamiento (Positivo si la diferencia es mayor que 0, Nulo si es 0, Negativo si es menor).

#### Scenario: Suma y espacio requerido
- **WHEN** se registran 42 = 6,0, 41 = 5,5, 31 = 5,4 y 32 = 6,1 mm
- **THEN** la suma de anteriores es 23,0 mm, el requerido mandibular es 22,2 mm y el maxilar 22,6 mm en ambos lados

#### Scenario: Redondeo de la suma
- **WHEN** la suma de los incisivos es 23,3 mm
- **THEN** el requerido se busca en la fila de 23,5 mm (mandibular 22,5, maxilar 22,9)

#### Scenario: Suma fuera de la tabla
- **WHEN** la suma de los incisivos es menor que 19,5 mm o mayor que 29,0 mm, o falta alguno de los cuatro
- **THEN** no se calcula el requerido ni la diferencia, y si hay suma se avisa que está fuera de la tabla de Moyers

#### Scenario: Diferencia y predisposición de apiñamiento
- **WHEN** con requerido mandibular 22,2 y maxilar 22,6 se registra disponible mandíbula derecho 21,0, mandíbula izquierdo 22,6, maxilar derecho 23,5 y maxilar izquierdo 22,6
- **THEN** las diferencias son −1,2, +0,4, +0,9 y 0,0
- **AND** la predisposición muestra Positivo: mandíbula izquierdo y maxilar derecho; Nulo: maxilar izquierdo; Negativo: mandíbula derecho

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
- **THEN** después de la hoja del análisis transversal sale "FICHA PARA EL ANÁLISIS DE MOYERS" con nombre, edad y fecha, la ficha con incisivos, suma, disponible, requerido y diferencia, la tabla de predisposición de apiñamiento y la interpretación
