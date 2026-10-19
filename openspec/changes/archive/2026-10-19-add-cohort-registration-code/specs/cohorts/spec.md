## ADDED Requirements

### Requirement: Código de inscripción de la turma
Cada turma SHALL tener un código de inscripción único, generado por el sistema al crearla: 8 caracteres de letras mayúsculas y dígitos sin los que se confunden (0, O, 1, I), mostrado en dos grupos de 4 (`K7QM-4TXR`). Solo el `ADMIN` SHALL verlo; la coordinación no. El `ADMIN` SHALL poder generar uno nuevo, y desde entonces el anterior NO SHALL servir para registrarse.

#### Scenario: Código al crear la turma
- **WHEN** un `ADMIN` crea la turma "Turma 3"
- **THEN** la turma aparece en su lista con un código de 8 caracteres distinto del de las demás turmas

#### Scenario: Generar un código nuevo
- **WHEN** un `ADMIN` genera un código nuevo para la "Turma 1"
- **THEN** la turma muestra el código nuevo y registrarse con el anterior se rechaza como código no válido

#### Scenario: La coordinación no ve el código
- **WHEN** la coordinación de la "Turma 1" pide la lista de sus turmas
- **THEN** recibe id y nombre, sin código ni estado de inscripción

#### Scenario: Otro rol intenta generar un código
- **WHEN** un `USER` o un `COORDINATOR` intenta generar el código de una turma
- **THEN** el sistema responde `403` y el código no cambia

### Requirement: Turma abierta o cerrada a la inscripción
Una turma SHALL nacer abierta a la inscripción. El `ADMIN` SHALL poder cerrarla y reabrirla. Cerrada, su código NO SHALL aceptar registros; sus alumnos, su coordinación y la asignación manual de alumnos desde "Usuarios" NO SHALL cambiar.

#### Scenario: Cerrar la inscripción
- **WHEN** un `ADMIN` cierra la "Turma 1"
- **THEN** la turma figura como cerrada y registrarse con su código se rechaza con el mensaje "La turma ya no acepta inscripciones."

#### Scenario: Cerrada no cambia lo existente
- **WHEN** la "Turma 1" está cerrada
- **THEN** sus alumnos siguen en ella, su coordinación sigue viéndolos y el `ADMIN` puede asignarle alumnos desde "Usuarios"

#### Scenario: Reabrir la inscripción
- **WHEN** un `ADMIN` reabre la "Turma 1"
- **THEN** registrarse con su código vuelve a funcionar

### Requirement: Inscripción en la turma al registrarse
Un visitante que se registra con el código de una turma abierta SHALL quedar como alumno de esa turma desde el alta, sin intervención del `ADMIN`. El código SHALL aceptarse sin distinguir mayúsculas, espacios ni guiones. Un código inexistente SHALL rechazarse con `400` y el mensaje "El código de turma no es válido." junto al campo, sin crear la cuenta.

#### Scenario: Registro con código válido
- **WHEN** un visitante se registra con el código " k7qm 4txr " de la "Turma 1" abierta
- **THEN** la cuenta nace como alumno de la "Turma 1" y la coordinación de esa turma lo ve en su Inicio

#### Scenario: Código inexistente
- **WHEN** un visitante se registra con un código que no es de ninguna turma
- **THEN** el formulario muestra "El código de turma no es válido." junto al campo y no se crea la cuenta

#### Scenario: Código de una turma cerrada
- **WHEN** un visitante se registra con el código de una turma cerrada
- **THEN** el formulario muestra "La turma ya no acepta inscripciones." junto al campo y no se crea la cuenta

### Requirement: Gestión del código y la inscripción en Turmas
El diálogo "Turmas" de "Usuarios" SHALL mostrar a cada turma con su código y su estado ("Inscripción abierta" o "Cerrada"), con acciones para copiar el código, generar uno nuevo tras una confirmación y abrir o cerrar la inscripción.

#### Scenario: Copiar el código
- **WHEN** el `ADMIN` pulsa "Copiar código" en la "Turma 1"
- **THEN** el código queda en el portapapeles y se avisa "Código copiado"

#### Scenario: Generar un código nuevo con confirmación
- **WHEN** el `ADMIN` pide un código nuevo para la "Turma 1"
- **THEN** se le advierte que el código actual dejará de servir y solo al confirmar se genera el nuevo

#### Scenario: Cerrar desde Turmas
- **WHEN** el `ADMIN` cierra la inscripción de la "Turma 2"
- **THEN** la turma muestra "Cerrada" y la acción pasa a "Abrir inscripción"
