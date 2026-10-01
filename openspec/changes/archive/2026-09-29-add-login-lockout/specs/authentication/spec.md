## MODIFIED Requirements

### Requirement: Inicio de sesión con credenciales
El sistema SHALL autenticar a un usuario existente por correo y contraseña cuando la cuenta no esté bloqueada temporalmente, establecer su sesión al validarlas y rechazar credenciales inválidas sin revelar cuál campo falló.

#### Scenario: Credenciales válidas
- **WHEN** un usuario registrado, con la cuenta no bloqueada, envía su correo y contraseña correctos
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

## ADDED Requirements

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
