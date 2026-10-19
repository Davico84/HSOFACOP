## MODIFIED Requirements

### Requirement: Registro de usuario
El sistema SHALL permitir crear una cuenta con nombre completo, correo y contraseña (con confirmación de contraseña en el cliente), y opcionalmente un código de turma (capacidad `cohorts`) y los datos del alumno (celular, documento y COP, capacidad `users`); SHALL iniciar sesión automáticamente tras el alta y rechazar correos duplicados, códigos no válidos o datos que no cumplan las validaciones, sin crear la cuenta.

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

#### Scenario: Registro sin código ni datos opcionales
- **WHEN** un visitante se registra dejando vacíos el código de turma, el celular, el documento y el COP
- **THEN** la cuenta se crea como alumno individual, sin turma y sin esos datos

#### Scenario: Registro con datos del alumno
- **WHEN** un visitante se registra con celular "987654321", DNI "74125896" y COP "12345"
- **THEN** la cuenta se crea con esos datos y el alumno los ve en "Mis datos"

#### Scenario: Dato opcional con formato inválido
- **WHEN** un visitante escribe un celular de 8 dígitos o un DNI de 7
- **THEN** el formulario muestra el error junto al campo y no envía la petición; si llega al servidor, este responde `400` sin crear la cuenta
