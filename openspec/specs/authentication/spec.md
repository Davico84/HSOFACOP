# authentication Specification

## Purpose

Gestiona la identidad y el acceso de los usuarios: registro de cuenta, inicio y cierre de sesión con credenciales, persistencia y renovación de la sesión mediante tokens, y protección de rutas según autenticación y rol.
## Requirements
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
El sistema SHALL autenticar a un usuario existente por correo y contraseña cuando la cuenta no esté bloqueada temporalmente ni deshabilitada, establecer su sesión al validarlas y rechazar credenciales inválidas sin revelar cuál campo falló.

#### Scenario: Credenciales válidas
- **WHEN** un usuario registrado, con la cuenta activa y no bloqueada, envía su correo y contraseña correctos
- **THEN** el sistema establece la sesión (token de acceso y de refresco)
- **AND** redirige al panel correspondiente a su rol

#### Scenario: Credenciales inválidas
- **WHEN** un usuario envía un correo inexistente o una contraseña incorrecta, y la cuenta (si existe) no está bloqueada temporalmente
- **THEN** el sistema responde `401` con el mensaje "Correo electrónico o contraseña incorrectos"
- **AND** no establece ninguna sesión
- **AND** si la cuenta existe (esté activa o deshabilitada), registra el intento fallido

#### Scenario: Campos vacíos
- **WHEN** un usuario intenta enviar el formulario de login con el correo o la contraseña vacíos
- **THEN** el frontend muestra errores de validación en los campos vacíos
- **AND** no envía la petición al backend

### Requirement: Orden de las comprobaciones al iniciar sesión
Una cuenta bloqueada temporalmente SHALL responder con el error genérico antes de comparar la contraseña, aunque también esté deshabilitada. Una contraseña incorrecta SHALL registrar el fallo también en una cuenta deshabilitada. Una cuenta deshabilitada SHALL rechazarse con un mensaje específico solo cuando la contraseña es correcta, sin alterar el contador de intentos fallidos.

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

### Requirement: Bloqueo temporal por intentos fallidos de login
El sistema SHALL bloquear temporalmente una cuenta tras un número configurable de intentos de login fallidos consecutivos por contraseña incorrecta, SHALL rechazar el login de una cuenta bloqueada sin comparar la contraseña y sin alterar su contador ni su ventana de bloqueo, y SHALL responder a una cuenta bloqueada exactamente igual que a unas credenciales inválidas.

#### Scenario: Fallos por debajo del umbral no bloquean
- **WHEN** un usuario registrado envía una contraseña incorrecta `max-attempts - 1` veces seguidas y después envía la contraseña correcta
- **THEN** el sistema establece la sesión
- **AND** el contador de intentos fallidos vuelve a 0

#### Scenario: El intento que alcanza el umbral bloquea la cuenta
- **WHEN** un usuario registrado envía una contraseña incorrecta `max-attempts` veces seguidas
- **THEN** la cuenta queda bloqueada hasta el instante del último fallo más la ventana configurada
- **AND** un login posterior con la contraseña correcta, dentro de la ventana, responde `401` y no establece sesión

#### Scenario: Cuenta bloqueada rechaza sin tocar el contador
- **WHEN** se intenta el login de una cuenta bloqueada (con contraseña correcta o incorrecta)
- **THEN** el sistema responde `401` sin establecer sesión
- **AND** el contador de intentos fallidos y el fin del bloqueo no cambian (insistir no prolonga el bloqueo)

#### Scenario: Respuesta indistinguible de credenciales inválidas
- **WHEN** se intenta el login de una cuenta bloqueada
- **THEN** la respuesta tiene el mismo status (`401`), `type`, `title` y `detail` ("Correo electrónico o contraseña incorrectos") que la de un correo inexistente o una contraseña incorrecta
- **AND** no establece sesión (sin token ni cookie de refresco)
- **AND** solo difieren los campos variables de cualquier error (`timestamp`, `traceId`)

#### Scenario: Ventana expirada reinicia el conteo
- **WHEN** la ventana de bloqueo de una cuenta ya expiró y el usuario vuelve a enviar una contraseña incorrecta
- **THEN** el contador de intentos fallidos pasa a 1 (no sigue sumando sobre el bloqueo anterior)
- **AND** la cuenta no está bloqueada

#### Scenario: Login correcto tras expirar la ventana
- **WHEN** la ventana de bloqueo de una cuenta ya expiró y el usuario envía la contraseña correcta
- **THEN** el sistema establece la sesión
- **AND** el contador de intentos fallidos vuelve a 0 y la cuenta deja de tener bloqueo registrado

#### Scenario: El fallo cuenta aunque el login responda con error
- **WHEN** un login falla por contraseña incorrecta y la petición termina con `401`
- **THEN** el incremento del contador queda persistido

#### Scenario: Cuenta bloqueada durante el propio login
- **WHEN** la contraseña es correcta pero, entre la comprobación inicial del bloqueo y el reset del contador, otra petición concurrente bloqueó la cuenta
- **THEN** el sistema responde `401` sin establecer sesión
- **AND** el bloqueo establecido por la otra petición se conserva

### Requirement: Configuración del bloqueo validada al arranque
El sistema SHALL leer el umbral (`app.auth.lockout.max-attempts`, por defecto 5) y la ventana (`app.auth.lockout.window`, duración ISO-8601, por defecto `PT15M`) de la configuración externa, y SHALL negarse a arrancar si alguno es inválido.

#### Scenario: Valores por defecto
- **WHEN** la aplicación arranca sin definir `app.auth.lockout.*`
- **THEN** el umbral es 5 intentos y la ventana 15 minutos

#### Scenario: Umbral inválido impide arrancar
- **WHEN** `app.auth.lockout.max-attempts` es menor que 1
- **THEN** el contexto de la aplicación no arranca e indica la propiedad inválida

#### Scenario: Ventana inválida impide arrancar
- **WHEN** `app.auth.lockout.window` es cero, negativa o no es una duración ISO-8601 válida
- **THEN** el contexto de la aplicación no arranca e indica la propiedad inválida

### Requirement: Secreto de firma de tokens obligatorio y robusto
El sistema SHALL negarse a arrancar si el secreto con el que firma los tokens (`app.security.jwt.secret`) no es seguro: ausente, vacío o en blanco, con un placeholder sin resolver (`${…}`), igual al valor de ejemplo versionado en `secrets.properties.example`, o de menos de 32 bytes en UTF-8. Ningún mensaje de error ni log de arranque SHALL revelar el valor del secreto. Los tests SHALL usar un secreto propio, con precedencia sobre la configuración local, el entorno y las propiedades de sistema.

#### Scenario: Secreto ausente
- **WHEN** la propiedad `app.security.jwt.secret` no tiene valor (no está definida)
- **THEN** la aplicación no arranca e indica que `app.security.jwt.secret` es obligatorio

#### Scenario: Placeholder sin resolver
- **WHEN** `JWT_SECRET` no está definida y el valor queda como el placeholder literal `${JWT_SECRET}`
- **THEN** la aplicación no arranca e indica que hay que definir `JWT_SECRET`

#### Scenario: Secreto vacío o en blanco
- **WHEN** el secreto es la cadena vacía o solo tiene espacios
- **THEN** la aplicación no arranca e indica que `app.security.jwt.secret` es obligatorio

#### Scenario: Secreto demasiado corto
- **WHEN** el secreto tiene menos de 32 bytes en UTF-8 (p. ej. 31 bytes)
- **THEN** la aplicación no arranca e indica el mínimo de 32 bytes
- **AND** un secreto con menos de 32 caracteres pero al menos 32 bytes (caracteres multibyte) sí es aceptado

#### Scenario: Valor de ejemplo sin cambiar
- **WHEN** el secreto es el valor de `JWT_SECRET` de `secrets.properties.example`
- **THEN** la aplicación no arranca e indica que hay que generar un secreto propio

#### Scenario: El error no revela el secreto
- **WHEN** el arranque falla por un secreto inválido
- **THEN** ni la cadena de excepciones ni la salida del arranque contienen el valor del secreto

#### Scenario: Secreto válido
- **WHEN** el secreto tiene al menos 32 bytes y no es un placeholder ni el valor de ejemplo
- **THEN** la aplicación arranca y firma y verifica tokens con él

#### Scenario: Tests con secreto propio
- **WHEN** se ejecutan los tests de contexto completo, haya o no `secrets.properties` local, `JWT_SECRET` en el entorno o una propiedad de sistema `JWT_SECRET`
- **THEN** usan el secreto de test definido por la suite, no el placeholder literal ni ningún valor externo

