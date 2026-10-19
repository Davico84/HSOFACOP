## Purpose

Agrupa a los alumnos en turmas y da a la coordinación de una institución acceso de solo lectura al avance y a las historias de los alumnos de sus turmas, sin poder modificarlas ni ver a los alumnos de otras turmas o sin turma.

## ADDED Requirements

### Requirement: Turmas gestionadas por el ADMIN
Un `ADMIN` SHALL poder crear turmas con un nombre (1 a 80 caracteres, único sin distinguir mayúsculas ni espacios sobrantes) y renombrarlas, y SHALL ver la lista de turmas con la cantidad de alumnos y de coordinadores de cada una. Una cuenta `COORDINATOR` SHALL recibir solo sus turmas (id y nombre, sin conteos); un `USER`, `403`. Crear o renombrar SHALL ser solo del `ADMIN`. Un nombre repetido SHALL rechazarse con `409` sin cambiar nada.

#### Scenario: Crear una turma
- **WHEN** un `ADMIN` crea la turma "Turma 1"
- **THEN** la turma aparece en la lista con 0 alumnos y 0 coordinadores

#### Scenario: Nombre repetido
- **WHEN** un `ADMIN` crea o renombra una turma con el nombre " turma 1 " y ya existe "Turma 1"
- **THEN** el sistema responde `409` con el mensaje "Ya existe una turma con ese nombre." y no cambia nada

#### Scenario: Renombrar una turma
- **WHEN** un `ADMIN` renombra "Turma 2" a "Turma 2 – 2026"
- **THEN** sus alumnos y coordinadores siguen en ella con el nombre nuevo

#### Scenario: La coordinación lista sus turmas
- **WHEN** la coordinación de "Turma 1" y "Turma 2" pide la lista de turmas
- **THEN** recibe solo esas dos, con id y nombre

#### Scenario: Otro rol intenta gestionar turmas
- **WHEN** un `USER` intenta listar turmas, o un `USER` o un `COORDINATOR` intenta crearlas o renombrarlas
- **THEN** el sistema responde `403`

### Requirement: Turma del alumno
Un `ADMIN` SHALL poder asignar a una cuenta `USER` una turma o ninguna, y cambiarla. Una cuenta `ADMIN` o `COORDINATOR` NO SHALL tener turma de alumno. El cambio SHALL valer de inmediato para lo que ve la coordinación, sin que el alumno tenga que volver a iniciar sesión, y NO SHALL modificar sus historias ni su cupo.

#### Scenario: Asignar una turma
- **WHEN** un `ADMIN` asigna la "Turma 1" a una cuenta `USER`
- **THEN** la cuenta queda en la "Turma 1" y sus historias pasan a verse para la coordinación de esa turma

#### Scenario: Quitar la turma
- **WHEN** un `ADMIN` deja sin turma a un alumno de la "Turma 1"
- **THEN** la coordinación de la "Turma 1" deja de ver al alumno y sus historias

#### Scenario: Turma para una cuenta que no es de alumno
- **WHEN** un `ADMIN` intenta asignar una turma de alumno a una cuenta `ADMIN` o `COORDINATOR`
- **THEN** el sistema responde `409` sin cambiar nada

### Requirement: Cuentas de coordinación
Un `ADMIN` SHALL poder convertir una cuenta `USER` sin historias en `COORDINATOR`, asignándole una o más turmas, cambiar sus turmas y volverla a `USER`. Una cuenta con historias NO SHALL convertirse en `COORDINATOR`. Al convertirse, la cuenta SHALL perder su turma de alumno y su cupo. Una cuenta `COORDINATOR` NO SHALL crear historias, aunque su sesión aún tenga el rol anterior. El rol nuevo SHALL valer desde la siguiente renovación de la sesión.

#### Scenario: Convertir en coordinación
- **WHEN** un `ADMIN` convierte en `COORDINATOR` una cuenta `USER` sin historias con las turmas "Turma 1" y "Turma 2"
- **THEN** la cuenta queda como coordinación de esas turmas, sin turma de alumno y sin cupo

#### Scenario: Cuenta con historias
- **WHEN** un `ADMIN` intenta convertir en `COORDINATOR` una cuenta que tiene historias
- **THEN** el sistema responde `409` con el mensaje "La cuenta tiene historias clínicas: no puede pasar a coordinación." y no cambia nada

#### Scenario: Sesión con el rol anterior
- **WHEN** una cuenta recién convertida en `COORDINATOR` intenta crear una historia con su sesión de alumno aún vigente
- **THEN** el sistema responde `403` y no crea nada

#### Scenario: Coordinación sin turmas
- **WHEN** un `ADMIN` deja una cuenta `COORDINATOR` sin ninguna turma
- **THEN** el sistema responde `400` y la cuenta conserva sus turmas

#### Scenario: Volver a alumno
- **WHEN** un `ADMIN` vuelve a `USER` una cuenta `COORDINATOR`
- **THEN** la cuenta pierde sus turmas de coordinación, queda sin turma de alumno y recibe el cupo inicial configurado

### Requirement: Historias de las turmas en solo lectura
Una cuenta `COORDINATOR` SHALL ver en "Historias clínicas" solo las historias cuyos autores son alumnos de sus turmas, con columnas Alumno y Turma, búsqueda y filtro por turma, y sin "Nueva historia". Al abrir una historia SHALL verla en la vista preliminar A4, de solo lectura y sin "Imprimir"; NO SHALL ver el formulario de edición.

#### Scenario: Listado de la coordinación
- **WHEN** la coordinación de la "Turma 1" abre "Historias clínicas"
- **THEN** ve las historias de los alumnos de la "Turma 1" con su alumno y su turma, y no ve las de otras turmas ni las de alumnos sin turma

#### Scenario: Filtrar por turma
- **WHEN** la coordinación de "Turma 1" y "Turma 2" filtra por "Turma 2"
- **THEN** el listado muestra solo las historias de los alumnos de la "Turma 2"

#### Scenario: Abrir una historia
- **WHEN** la coordinación abre una historia de su turma
- **THEN** la ve en la vista preliminar, sin el botón "Imprimir" y sin acceso al formulario
- **AND** abrirla no registra ninguna impresión ni fija los datos del paciente

#### Scenario: Historia fuera de sus turmas
- **WHEN** la coordinación pide una historia de un alumno de otra turma o sin turma
- **THEN** el sistema responde `404` y la pantalla muestra "Historia no encontrada"

### Requirement: La coordinación no modifica historias
El servidor SHALL rechazar con `403` toda escritura de una cuenta `COORDINATOR` sobre historias: crear, guardar, registrar una impresión, solicitar o descartar un desbloqueo y desbloquear. El rechazo SHALL ocurrir aunque la historia sea de sus turmas y sin cambiar nada.

#### Scenario: Intento de guardar
- **WHEN** una cuenta `COORDINATOR` envía un guardado de una historia de su turma
- **THEN** el sistema responde `403` y la historia no cambia

#### Scenario: Intento de registrar una impresión
- **WHEN** una cuenta `COORDINATOR` intenta registrar la impresión de una historia de su turma
- **THEN** el sistema responde `403` y los datos del paciente no quedan fijos

#### Scenario: Intento de crear
- **WHEN** una cuenta `COORDINATOR` intenta crear una historia
- **THEN** el sistema responde `403`

### Requirement: Avance de las turmas en Inicio
Para una cuenta `COORDINATOR`, Inicio SHALL mostrar, por cada una de sus turmas: alumnos, historias totales, completas, en progreso y sin calcular (criterio de completa del tratante), alumnos sin historias, y por alumno sus historias y cuántas completas. Las métricas SHALL calcularse en el servidor y NO SHALL incluir alumnos de otras turmas. Otro rol que las pida SHALL recibir `403`.

#### Scenario: Avance de una turma
- **WHEN** la coordinación de la "Turma 1" abre Inicio
- **THEN** ve el resumen de la "Turma 1" y la lista de sus alumnos con sus historias y completas

#### Scenario: Turma sin alumnos
- **WHEN** una turma de la coordinación no tiene alumnos
- **THEN** su resumen muestra 0 alumnos con un estado vacío

#### Scenario: Otro rol pide el avance de turmas
- **WHEN** un `USER` o un `ADMIN` pide las métricas de coordinación
- **THEN** el sistema responde `403`
