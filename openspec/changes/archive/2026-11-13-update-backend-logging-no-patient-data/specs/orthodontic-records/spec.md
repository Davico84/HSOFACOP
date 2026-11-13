# Spec Delta

## ADDED Requirements

### Requirement: Búsqueda de historias sin datos del paciente en las URL
El texto buscado de un paciente (nombre, documento) SHALL NOT viajar en la URL de la API, en la dirección del navegador ni en parámetros de consulta. Si la búsqueda lo envía al servidor, SHALL hacerlo en el cuerpo de una petición `POST /api/orthodontic-records/search`, con el texto limitado a 120 caracteres. `GET /api/orthodontic-records` SHALL listar sin búsqueda por texto.

#### Scenario: Buscar por nombre
- **WHEN** el usuario busca "quispe" en "Historias clínicas"
- **THEN** la aplicación envía `POST /api/orthodontic-records/search` con el texto en el cuerpo y ninguna URL de la petición contiene "quispe"
- **AND** el resultado y su orden son los mismos que antes

#### Scenario: Paginación y turma
- **WHEN** el usuario pasa a la página 2 o la coordinación filtra por turma
- **THEN** la página y el identificador de turma viajan como parámetros de la operación y el listado respeta el acceso por rol

#### Scenario: Parámetro q retirado
- **WHEN** un cliente envía `GET /api/orthodontic-records?q=quispe`
- **THEN** la API ignora el parámetro y lista sin filtrar por ese texto

#### Scenario: Acceso por rol en la búsqueda
- **WHEN** un `USER` busca con el nombre de un paciente de otro tratante
- **THEN** el resultado no incluye historias ajenas

#### Scenario: Texto en el límite
- **WHEN** el texto buscado tiene 120 caracteres, o 121
- **THEN** con 120 la API responde `200` y con 121 responde `400` sin buscar

#### Scenario: Cuerpo inválido
- **WHEN** el cuerpo está vacío, no es un objeto JSON o trae campos desconocidos
- **THEN** la API responde `400`

#### Scenario: Registros del sitio estático
- **WHEN** el usuario recarga el listado después de buscar un nombre
- **THEN** la petición del documento al sitio estático no contiene el nombre buscado

## MODIFIED Requirements

### Requirement: Listado y búsqueda de historias
El sistema SHALL ofrecer la sección "Historias clínicas" con un listado paginado, ordenado por última modificación (más reciente primero), con número, paciente, documento, odontólogo tratante, fecha de inicio y última modificación. SHALL permitir buscar por nombre del paciente, número de documento o número de historia, sin distinguir mayúsculas ni tildes. Un `USER` SHALL ver solo sus historias; un `ADMIN`, todas, con una columna de autor.

#### Scenario: USER ve solo las suyas
- **WHEN** un `USER` abre "Historias clínicas" y existen historias suyas y de otros
- **THEN** el listado muestra solo las suyas

#### Scenario: ADMIN ve todas con su autor
- **WHEN** un `ADMIN` abre "Historias clínicas"
- **THEN** el listado muestra las historias de todos los usuarios con la columna "Autor"

#### Scenario: Búsqueda sin tildes ni mayúsculas
- **WHEN** el usuario busca "quispe" y existe la paciente "Ana QUÍSPE"
- **THEN** la historia aparece en el resultado

#### Scenario: Búsqueda por documento o número
- **WHEN** el usuario busca un número de documento o un número de historia existentes (p. ej. "aeo-0015")
- **THEN** el resultado incluye la historia correspondiente

#### Scenario: Búsqueda por el número corregido
- **WHEN** el número de una historia se corrige de "AEO-0015" a "AEO-0051"
- **THEN** buscar "aeo-0051" la encuentra y buscar "aeo-0015" ya no

#### Scenario: Búsqueda y página en la dirección
- **WHEN** el usuario busca "quispe" y pasa a la página 2 del listado
- **THEN** la dirección queda `/historias?pagina=2`, sin el texto buscado, y recargar o volver de otra pantalla conserva la búsqueda y la página
- **AND** el texto buscado se conserva solo en la pestaña, no en la dirección ni en las peticiones a la API

#### Scenario: Sin resultados
- **WHEN** la búsqueda no coincide con ninguna historia
- **THEN** el listado muestra un estado vacío "No hay historias que coincidan" con opción de limpiar la búsqueda

#### Scenario: Sin historias todavía
- **WHEN** el usuario no tiene ninguna historia
- **THEN** el listado muestra un estado vacío con el botón "Nueva historia"

### Requirement: Volver al listado desde la historia
La historia (edición y nueva) SHALL mostrar arriba a la izquierda, sobre el título, el enlace "Historias clínicas" con una flecha hacia atrás, que SHALL llevar al listado con la búsqueda y la página vistas por última vez en la pestaña, aunque luego se haya cambiado de paso, creado la historia o abierto la vista previa; sin listado previo, a `/historias`. Con cambios sin guardar SHALL pedir la confirmación de cualquier salida del formulario. El listado recordado SHALL borrarse al cerrar sesión.

#### Scenario: Vuelve con la búsqueda y la página
- **WHEN** el usuario busca "quispe", pasa a la página 2, abre una historia, cambia de paso y pulsa "Historias clínicas"
- **THEN** vuelve a `/historias?pagina=2` con la búsqueda "quispe" restaurada desde la pestaña

#### Scenario: Después de crear una historia
- **WHEN** el usuario abre "Nueva historia" desde el listado con la búsqueda "quispe", crea la historia y pulsa "Historias clínicas"
- **THEN** vuelve a `/historias` con la búsqueda "quispe" restaurada desde la pestaña

#### Scenario: Después de la vista previa
- **WHEN** el usuario abre la vista previa desde la historia, pulsa "Volver" y luego "Historias clínicas"
- **THEN** vuelve al listado con la búsqueda y la página que tenía

#### Scenario: Sin listado previo
- **WHEN** el usuario abre una historia directamente por su dirección, sin haber pasado por el listado en esa pestaña, y pulsa "Historias clínicas"
- **THEN** vuelve a `/historias`

#### Scenario: Con cambios sin guardar
- **WHEN** el usuario tiene cambios sin guardar y pulsa "Historias clínicas"
- **THEN** se pide confirmación; al quedarse sigue en el paso con sus cambios y al salir va al listado

#### Scenario: Historia no encontrada
- **WHEN** el usuario abre una historia ajena o inexistente y pulsa "Volver a las historias"
- **THEN** vuelve al listado con la búsqueda y la página recordadas (o a `/historias` si no hay)

#### Scenario: Cierre de sesión
- **WHEN** el usuario cierra sesión y otro inicia sesión en la misma pestaña
- **THEN** el enlace de este último lleva a `/historias`, sin la búsqueda anterior
