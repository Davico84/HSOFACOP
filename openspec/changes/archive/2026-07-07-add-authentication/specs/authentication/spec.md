## ADDED Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir crear una cuenta con nombre completo, correo y contraseña (con confirmación de contraseña en el cliente), iniciar sesión automáticamente tras el alta, y rechazar correos duplicados o datos que no cumplan las validaciones mínimas. Otros datos de perfil (nombre de usuario, teléfono, país) se capturan más adelante en la gestión de perfil (capacidad `users`).

#### Scenario: Registro exitoso
- **WHEN** un visitante envía el formulario con nombre completo, correo válido y una contraseña de al menos 8 caracteres cuya confirmación coincide, con un correo no registrado
- **THEN** el sistema crea la cuenta con rol por defecto `USER`
- **AND** establece la sesión (emite token de acceso y de refresco)
- **AND** redirige al panel correspondiente a su rol

#### Scenario: Correo ya registrado
- **WHEN** un visitante intenta registrarse con un correo que ya existe
- **THEN** el sistema responde con un error de conflicto y un mensaje claro
- **AND** no crea una cuenta duplicada
- **AND** no establece ninguna sesión

#### Scenario: Contraseña demasiado corta (validación en cliente)
- **WHEN** un visitante escribe una contraseña de menos de 8 caracteres en el formulario de registro
- **THEN** el frontend muestra un error de validación en el campo
- **AND** no envía la petición al backend

#### Scenario: La confirmación de contraseña no coincide (validación en cliente)
- **WHEN** un visitante escribe una contraseña y una confirmación distintas
- **THEN** el frontend muestra un error de validación en el campo de confirmación
- **AND** no envía la petición al backend

### Requirement: Inicio de sesión con credenciales
El sistema SHALL autenticar a un usuario existente por correo y contraseña, establecer su sesión al validarlas y rechazar credenciales inválidas sin revelar cuál campo falló.

#### Scenario: Credenciales válidas
- **WHEN** un usuario registrado envía su correo y contraseña correctos
- **THEN** el sistema establece la sesión (token de acceso y de refresco)
- **AND** redirige al panel correspondiente a su rol

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía un correo inexistente o una contraseña incorrecta
- **THEN** el sistema responde con el mensaje "Correo electrónico o contraseña incorrectos"
- **AND** no establece ninguna sesión

#### Scenario: Campos vacíos
- **WHEN** un usuario intenta enviar el formulario de login con el correo o la contraseña vacíos
- **THEN** el frontend muestra errores de validación en los campos vacíos
- **AND** no envía la petición al backend

### Requirement: Persistencia de sesión
El sistema SHALL restaurar la sesión del usuario tras recargar la aplicación cuando la sesión siga vigente (token de refresco válido), y presentarse como no autenticado cuando no exista una sesión restaurable.

#### Scenario: Recarga con sesión vigente
- **WHEN** el usuario recarga la aplicación teniendo una sesión vigente (token de refresco válido)
- **THEN** el sistema restaura la sesión sin volver a pedir credenciales
- **AND** el usuario permanece en la ruta solicitada según su rol

#### Scenario: Sin sesión restaurable
- **WHEN** el usuario abre la aplicación sin sesión previa o con el refresco ausente/expirado
- **THEN** el sistema queda en estado no autenticado
- **AND** limpia cualquier dato de sesión residual del almacenamiento

### Requirement: Renovación de token
El sistema SHALL renovar de forma transparente el token de acceso expirado usando el token de refresco, y cerrar la sesión cuando el refresco ya no sea válido.

#### Scenario: Token de acceso expirado se renueva y reintenta
- **WHEN** una petición autenticada recibe `401` por token de acceso expirado y existe un token de refresco válido
- **THEN** el sistema solicita un nuevo token de acceso mediante el endpoint de refresco
- **AND** reintenta la petición original de forma transparente para el usuario

#### Scenario: Refresco inválido o expirado
- **WHEN** el intento de renovación falla porque el token de refresco es inválido o expiró
- **THEN** el sistema cierra la sesión
- **AND** redirige al usuario a la pantalla de login

### Requirement: Cierre de sesión
El sistema SHALL permitir al usuario cerrar su sesión de forma explícita, invalidando la sesión y eliminando los datos locales.

#### Scenario: Logout manual
- **WHEN** un usuario autenticado ejecuta la acción de cerrar sesión
- **THEN** el sistema invalida la sesión y elimina los tokens y los datos del usuario del almacenamiento local
- **AND** redirige a la pantalla de login

### Requirement: Protección de rutas por autenticación y rol
El sistema SHALL controlar el acceso a las rutas según el estado de autenticación y el rol del usuario, redirigiendo o denegando el acceso según corresponda.

#### Scenario: Acceso sin sesión a ruta privada
- **WHEN** un visitante sin sesión intenta acceder a una ruta privada
- **THEN** el sistema lo redirige a la pantalla de login

#### Scenario: Acceso con sesión a rutas de autenticación
- **WHEN** un usuario autenticado intenta acceder a `/auth` (login o registro)
- **THEN** el sistema lo redirige a su panel

#### Scenario: Rol sin permiso
- **WHEN** un usuario autenticado intenta acceder a una ruta para la que su rol no tiene permiso
- **THEN** el sistema muestra un estado de acceso denegado con la opción de volver
- **AND** no renderiza el contenido protegido
