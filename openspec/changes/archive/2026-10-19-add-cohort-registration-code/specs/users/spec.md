## ADDED Requirements

### Requirement: Datos de contacto e identificación de la cuenta
Cada cuenta SHALL poder guardar, todos opcionales: celular (9 dígitos que empiezan con 9), documento (tipo DNI, carné de extranjería o pasaporte y su número, con las mismas reglas que el documento del paciente, siempre los dos juntos) y número de colegiatura COP (1 a 6 dígitos). Un dato con formato inválido SHALL rechazarse con `400` sin guardar nada.

#### Scenario: Datos válidos
- **WHEN** se guardan el celular "987654321", el carné de extranjería "001234567" y el COP "12345"
- **THEN** la cuenta queda con esos datos

#### Scenario: Celular inválido
- **WHEN** se envía el celular "87654321" o "887654321"
- **THEN** el sistema responde `400` con el error en el celular y no guarda nada

#### Scenario: Documento incompleto
- **WHEN** se envía un tipo de documento sin número, o un número sin tipo
- **THEN** el sistema responde `400` con el error en el campo que falta

#### Scenario: Quitar un dato
- **WHEN** se guarda el celular vacío en una cuenta que lo tenía
- **THEN** la cuenta queda sin celular

### Requirement: Pantalla "Mis datos"
Toda cuenta autenticada SHALL tener en el menú la pantalla "Mis datos", donde ve su nombre, correo y rol (solo lectura) y edita su celular, documento y COP. Solo SHALL leer y cambiar los datos de su propia cuenta.

#### Scenario: Completar los datos después del registro
- **WHEN** un alumno que se registró sin celular lo agrega en "Mis datos" y guarda
- **THEN** se avisa "Datos guardados" y el `ADMIN` ve el celular en "Usuarios"

#### Scenario: Error junto al campo
- **WHEN** un alumno escribe un DNI de 7 dígitos en "Mis datos"
- **THEN** el formulario muestra el error junto al campo y no envía la petición

#### Scenario: Sin sesión
- **WHEN** una petición sin sesión pide o cambia "Mis datos"
- **THEN** el sistema responde `401`

### Requirement: Datos de la cuenta en Usuarios
En "Usuarios", el `ADMIN` SHALL ver los datos de contacto e identificación de cada cuenta con la acción "Ver datos", que muestra celular, documento y COP (o "Sin registrar" en los que falten). El `ADMIN` NO SHALL editarlos.

#### Scenario: Ver los datos de un alumno
- **WHEN** el `ADMIN` pulsa "Ver datos" en un alumno con celular y sin COP
- **THEN** ve el celular y "Sin registrar" en el COP, sin campos editables

## MODIFIED Requirements

### Requirement: Listado de usuarios para administradores
El sistema SHALL permitir a un usuario `ADMIN` consultar las cuentas paginadas (20 por página por defecto, como máximo 100), con exactamente id, nombre, correo, rol, estado, cupo de historias clínicas (`recordQuota`, nulo = sin límite), cantidad de historias creadas (`recordCount`), turma del alumno (`cohort`), turmas de la coordinación (`coordinatorCohorts`) y celular, documento y COP (nulos si faltan) de cada una, y SHALL denegarlo a cualquier otro rol.

#### Scenario: Primera página
- **WHEN** un `ADMIN` consulta el listado de usuarios
- **THEN** recibe la primera página con hasta 20 cuentas, el número de página, el tamaño, el total de elementos y de páginas y si es la última

#### Scenario: Página siguiente
- **WHEN** un `ADMIN` pide la página siguiente
- **THEN** recibe las cuentas de esa página

#### Scenario: Tamaño de página por encima del máximo
- **WHEN** un `ADMIN` pide un tamaño de página mayor que 100
- **THEN** recibe como mucho 100 cuentas y la respuesta indica el tamaño aplicado (100)

#### Scenario: Página sin resultados
- **WHEN** un `ADMIN` pide una página posterior a la última
- **THEN** recibe una página vacía con los totales, sin error

#### Scenario: Solo los datos necesarios
- **WHEN** se devuelve una cuenta en el listado
- **THEN** contiene exactamente id, correo, nombre, rol, estado, cupo de historias, cantidad de historias creadas, turma del alumno, turmas de la coordinación, celular, documento y COP, y nunca el hash de la contraseña, el contador de intentos, el bloqueo temporal ni fechas internas

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` o `COORDINATOR` consulta el listado de usuarios
- **THEN** la API responde `403`
