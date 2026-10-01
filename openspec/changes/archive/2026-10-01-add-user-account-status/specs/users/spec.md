## ADDED Requirements

### Requirement: Estado de la cuenta
El sistema SHALL mantener para cada cuenta un estado `ACTIVE` o `DISABLED`, independiente del bloqueo temporal por intentos fallidos. Las cuentas nuevas SHALL crearse `ACTIVE`.

#### Scenario: Cuenta nueva activa
- **WHEN** un visitante se registra
- **THEN** su cuenta se crea con estado `ACTIVE`

#### Scenario: Independiente del bloqueo por intentos
- **WHEN** una cuenta cambia de estado
- **THEN** su contador de intentos fallidos y su bloqueo temporal no cambian

#### Scenario: Correo de una cuenta deshabilitada
- **WHEN** alguien intenta registrarse con el correo de una cuenta `DISABLED`
- **THEN** el registro se rechaza como correo ya registrado

### Requirement: Listado de usuarios para administradores
El sistema SHALL permitir a un usuario `ADMIN` consultar las cuentas paginadas (20 por página por defecto, como máximo 100), con exactamente id, nombre, correo, rol y estado de cada una, y SHALL denegarlo a cualquier otro rol.

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
- **THEN** contiene exactamente id, correo, nombre, rol y estado, y nunca el hash de la contraseña, el contador de intentos, el bloqueo temporal ni fechas internas

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` consulta el listado de usuarios
- **THEN** la API responde `403`

### Requirement: Cambio de estado de cuentas USER
El sistema SHALL permitir a un `ADMIN` deshabilitar y reactivar cuentas con rol `USER`, SHALL rechazar el cambio de estado de cuentas `ADMIN`, SHALL revocar las sesiones renovables de una cuenta al deshabilitarla y SHALL NOT restaurarlas al reactivarla.

#### Scenario: Deshabilitar una cuenta USER
- **WHEN** un `ADMIN` deshabilita una cuenta `USER` activa
- **THEN** la cuenta queda `DISABLED`
- **AND** todos sus tokens de refresco quedan revocados, de modo que su sesión termina como tarde al caducar el token de acceso en curso

#### Scenario: Reactivar una cuenta USER
- **WHEN** un `ADMIN` reactiva una cuenta `USER` deshabilitada
- **THEN** la cuenta queda `ACTIVE` y puede volver a iniciar sesión
- **AND** sus tokens de refresco revocados siguen sin ser válidos

#### Scenario: Mismo estado
- **WHEN** un `ADMIN` envía para una cuenta `USER` el estado que ya tiene
- **THEN** la API responde `200` con la cuenta sin cambios

#### Scenario: Cuenta ADMIN
- **WHEN** un `ADMIN` intenta cambiar el estado de una cuenta `ADMIN` (incluida la suya), con cualquier estado
- **THEN** la API responde `409` y la cuenta no cambia

#### Scenario: Cuenta inexistente
- **WHEN** un `ADMIN` intenta cambiar el estado de una cuenta que no existe
- **THEN** la API responde `404`

#### Scenario: Estado inválido
- **WHEN** un `ADMIN` envía un estado ausente, nulo o distinto de `ACTIVE`/`DISABLED`
- **THEN** la API responde `400` y la cuenta no cambia

#### Scenario: Usuario sin rol de administrador
- **WHEN** un usuario `USER` intenta cambiar el estado de una cuenta
- **THEN** la API responde `403` y la cuenta no cambia

### Requirement: Pantalla de usuarios para administradores
El sistema SHALL ofrecer a los `ADMIN` una sección "Usuarios" dentro del shell con el listado paginado y, en cada cuenta `USER`, la acción para deshabilitarla o reactivarla tras una confirmación. La sección SHALL estar restringida a `ADMIN`.

#### Scenario: Listado en pantalla
- **WHEN** un `ADMIN` abre la sección "Usuarios"
- **THEN** ve una tabla con nombre, correo, rol y estado de cada cuenta de la página, y controles para cambiar de página ("Siguiente" deshabilitado en la última)

#### Scenario: Cambio de página
- **WHEN** un `ADMIN` cambia de página
- **THEN** la tabla anterior sigue visible mientras carga la nueva y los controles reflejan la página pedida

#### Scenario: Deshabilitar con confirmación
- **WHEN** un `ADMIN` pulsa "Deshabilitar" en una cuenta `USER` activa
- **THEN** se pide confirmación
- **AND** al confirmar, mientras la petición está en curso la acción no puede repetirse, y al terminar la cuenta aparece como deshabilitada con la acción "Activar"
- **AND** al cancelar, la cuenta no cambia y no se envía ninguna petición

#### Scenario: Error al cambiar el estado
- **WHEN** el cambio de estado falla (p. ej. `409` o `404`)
- **THEN** se muestra el mensaje del error y el listado se recarga con el estado real

#### Scenario: Página vacía
- **WHEN** la página actual queda sin cuentas (p. ej. tras recargar el listado) y no es la primera
- **THEN** la pantalla muestra un estado vacío con la opción de volver a la página anterior, sin error

#### Scenario: Cuentas ADMIN sin acción
- **WHEN** el listado incluye cuentas `ADMIN`
- **THEN** esas filas no ofrecen ninguna acción de estado

#### Scenario: Sección restringida
- **WHEN** un usuario `USER` abre el shell o navega a la ruta de "Usuarios"
- **THEN** la sección no aparece en su navegación y la ruta muestra el acceso denegado del shell
