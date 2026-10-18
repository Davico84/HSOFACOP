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
