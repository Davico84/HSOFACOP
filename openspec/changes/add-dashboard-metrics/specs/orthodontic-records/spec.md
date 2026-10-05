## ADDED Requirements

### Requirement: Pasos con datos guardados con la historia
Al crear y al guardar una historia, el cliente SHALL enviar qué pasos tienen datos (`filledSteps`, un conjunto de 1–8 sin repetidos, el mismo criterio que la navegación de pasos: lo que viene por defecto no cuenta), y el servidor SHALL guardarlo con la historia y devolverlo. Al guardar, si no se envía, el valor guardado no cambia. Una historia nunca guardada con este dato SHALL quedar "sin calcular". El servidor SHALL rechazar pasos fuera de 1–8 o repetidos con `400`.

#### Scenario: Guardar con los pasos llenos
- **WHEN** el usuario guarda una historia con datos en los pasos 1, 2 y 5
- **THEN** la historia queda con los pasos 1, 2 y 5 con datos

#### Scenario: Crear una historia
- **WHEN** el usuario crea una historia con el nombre del paciente
- **THEN** la historia nace con el paso 1 con datos, no "sin calcular"

#### Scenario: Historia anterior a este cambio
- **WHEN** se consulta una historia que no se volvió a guardar desde este cambio
- **THEN** sus pasos con datos figuran como sin calcular

#### Scenario: Paso inválido
- **WHEN** se guarda una historia con `filledSteps` que incluye 9, o `[1, 1, 2]`
- **THEN** la API responde `400` con el error en `filledSteps` y no guarda
