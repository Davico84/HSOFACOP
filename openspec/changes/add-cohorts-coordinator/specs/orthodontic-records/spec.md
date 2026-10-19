## MODIFIED Requirements

### Requirement: Acceso por autor y administrador
Un `USER` SHALL ver, editar e imprimir solo las historias de las que es autor; un `ADMIN` SHALL ver, editar e imprimir todas; un `COORDINATOR` SHALL solo ver, sin editar ni imprimir, las historias de los alumnos de sus turmas (capacidad `cohorts`). Para un `USER` o un `COORDINATOR`, una historia fuera de su alcance SHALL comportarse como inexistente. Ningún rol SHALL poder borrar historias en esta fase.

#### Scenario: Autor accede a su historia
- **WHEN** un `USER` abre una historia que creó
- **THEN** el sistema la muestra y le permite editarla e imprimirla

#### Scenario: USER intenta abrir una historia ajena
- **WHEN** un `USER` pide (leer o guardar) una historia creada por otro usuario
- **THEN** el sistema responde `404` sin revelar que existe ni su contenido
- **AND** la pantalla muestra "Historia no encontrada" con enlace al listado

#### Scenario: ADMIN accede a cualquier historia
- **WHEN** un `ADMIN` abre o guarda una historia creada por un `USER`
- **THEN** el sistema lo permite y la historia conserva a su autor original

#### Scenario: Historia inexistente
- **WHEN** se pide una historia con un identificador que no existe
- **THEN** el sistema responde `404`

#### Scenario: COORDINATOR abre una historia de su turma
- **WHEN** un `COORDINATOR` lee una historia de un alumno de sus turmas
- **THEN** el sistema la devuelve, y guardarla o imprimirla responde `403`
