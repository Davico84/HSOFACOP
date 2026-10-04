## ADDED Requirements

### Requirement: Cupo de historias clínicas por usuario
Un `ADMIN` SHALL poder asignar, cambiar o quitar el cupo de historias clínicas de una cuenta `USER`: un número entero entre 0 y 9999, o sin límite. Por defecto ninguna cuenta tiene límite. El cupo SHALL poder quedar por debajo de las historias ya creadas, sin afectarlas. El sistema SHALL denegar el cambio a cualquier otro rol y SHALL rechazarlo para cuentas `ADMIN`. En la pantalla "Usuarios", cada cuenta `USER` SHALL mostrar sus historias creadas y su cupo, con una acción para cambiarlo.

#### Scenario: Asignar un cupo
- **WHEN** un `ADMIN` asigna un cupo de 5 a una cuenta `USER` con 3 historias creadas
- **THEN** la cuenta queda con cupo 5 y la pantalla "Usuarios" muestra "3 de 5"

#### Scenario: Quitar el límite
- **WHEN** un `ADMIN` marca "Sin límite" en el cupo de una cuenta `USER`
- **THEN** la cuenta queda sin cupo y la pantalla muestra "3 · sin límite"

#### Scenario: Cupo por debajo de lo ya creado
- **WHEN** un `ADMIN` asigna un cupo de 2 a una cuenta con 3 historias creadas
- **THEN** el diálogo avisa que el tratante ya tiene 3 historias y no podrá crear más; al confirmar, el cupo queda en 2 y las 3 historias siguen intactas

#### Scenario: Valor inválido
- **WHEN** se envía un cupo negativo, con decimales o mayor que 9999
- **THEN** la API responde `400` con el error en `recordQuota`

#### Scenario: Cuenta ADMIN
- **WHEN** un `ADMIN` intenta asignar un cupo a una cuenta `ADMIN`
- **THEN** la API responde `409` y no cambia nada

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` intenta cambiar un cupo
- **THEN** la API responde `403`

## MODIFIED Requirements

### Requirement: Listado de usuarios para administradores
El sistema SHALL permitir a un usuario `ADMIN` consultar las cuentas paginadas (20 por página por defecto, como máximo 100), con exactamente id, nombre, correo, rol, estado, cupo de historias clínicas (`recordQuota`, nulo = sin límite) y cantidad de historias creadas (`recordCount`) de cada una, y SHALL denegarlo a cualquier otro rol.

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
- **THEN** contiene exactamente id, correo, nombre, rol, estado, cupo de historias y cantidad de historias creadas, y nunca el hash de la contraseña, el contador de intentos, el bloqueo temporal ni fechas internas

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` consulta el listado de usuarios
- **THEN** la API responde `403`
