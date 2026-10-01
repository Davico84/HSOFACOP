## MODIFIED Requirements

### Requirement: Inicio de sesión con credenciales
El sistema SHALL autenticar a un usuario existente por correo y contraseña cuando la cuenta no esté bloqueada temporalmente ni deshabilitada, establecer su sesión al validarlas y rechazar credenciales inválidas sin revelar cuál campo falló. Una contraseña incorrecta SHALL registrar el fallo también cuando la cuenta esté deshabilitada; una cuenta bloqueada temporalmente SHALL responder con el error genérico antes de comparar la contraseña, aunque también esté deshabilitada. Una cuenta deshabilitada SHALL rechazarse con un mensaje específico solo cuando la contraseña es correcta, sin alterar el contador de intentos fallidos.

#### Scenario: Credenciales válidas
- **WHEN** un usuario registrado, con la cuenta activa y no bloqueada, envía su correo y contraseña correctos
- **THEN** el sistema establece la sesión (token de acceso y de refresco)
- **AND** redirige al panel correspondiente a su rol

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía un correo inexistente o una contraseña incorrecta, y la cuenta (si existe) no está bloqueada temporalmente
- **THEN** el sistema responde `401` con el mensaje "Correo electrónico o contraseña incorrectos"
- **AND** no establece ninguna sesión
- **AND** si la cuenta existe (esté activa o deshabilitada), registra el intento fallido

#### Scenario: Cuenta deshabilitada con contraseña correcta
- **WHEN** el usuario de una cuenta deshabilitada, no bloqueada temporalmente, envía su correo y contraseña correctos
- **THEN** el sistema responde `403` con el mensaje "Tu cuenta está deshabilitada. Contacta con el administrador."
- **AND** no establece ninguna sesión ni modifica el contador de intentos fallidos

#### Scenario: Cuenta bloqueada y deshabilitada
- **WHEN** una cuenta deshabilitada tiene además un bloqueo temporal vigente y alguien intenta iniciar sesión con cualquier contraseña
- **THEN** el sistema responde `401` con el mensaje genérico de credenciales inválidas
- **AND** no compara la contraseña ni modifica el contador ni el fin del bloqueo

#### Scenario: Cuenta deshabilitada durante el propio login
- **WHEN** la contraseña es correcta pero la cuenta se deshabilita entre la lectura inicial y el establecimiento de la sesión
- **THEN** el sistema responde `401` sin establecer sesión
- **AND** no modifica el contador de intentos fallidos ni el bloqueo

#### Scenario: Campos vacíos
- **WHEN** un usuario intenta enviar el formulario de login con el correo o la contraseña vacíos
- **THEN** el frontend muestra errores de validación en los campos vacíos
- **AND** no envía la petición al backend

### Requirement: Renovación de token
El sistema SHALL renovar de forma transparente el token de acceso expirado usando el token de refresco, y cerrar la sesión cuando el refresco ya no sea válido o la cuenta esté deshabilitada; en este último caso SHALL explicar al usuario el motivo.

#### Scenario: Token de acceso expirado se renueva y reintenta
- **WHEN** una petición autenticada recibe `401` por token de acceso expirado y existe un token de refresco válido de una cuenta activa
- **THEN** el sistema solicita un nuevo token de acceso mediante el endpoint de refresco
- **AND** reintenta la petición original de forma transparente para el usuario

#### Scenario: Refresco inválido o expirado
- **WHEN** el intento de renovación falla porque el token de refresco es inválido, está revocado o expiró
- **THEN** el sistema cierra la sesión
- **AND** redirige al usuario a la pantalla de login

#### Scenario: Refresco de una cuenta deshabilitada
- **WHEN** se intenta renovar la sesión con un token de refresco de una cuenta deshabilitada (al caducar su token de acceso o al recargar la página)
- **THEN** el backend responde `403` con el mensaje "Tu cuenta está deshabilitada. Contacta con el administrador." y no emite tokens
- **AND** el frontend cierra la sesión, redirige a la pantalla de login y muestra ese mensaje una sola vez
