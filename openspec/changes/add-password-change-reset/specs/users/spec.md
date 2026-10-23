## ADDED Requirements

### Requirement: Enlace de restablecimiento de contraseña
Un `ADMIN` SHALL poder generar para una cuenta `USER` o `COORDINATOR` activa un enlace de restablecimiento de un solo uso que vence a las 24 horas. Generar uno nuevo SHALL anular el anterior que no se haya usado. Para una cuenta `ADMIN` o deshabilitada SHALL responder `409`; a otro rol, `403`. El enlace solo se muestra al generarlo: el sistema NO SHALL guardarlo en claro.

#### Scenario: Generar un enlace
- **WHEN** un `ADMIN` genera el enlace de restablecimiento de un alumno activo
- **THEN** recibe un enlace que sirve una vez durante 24 horas

#### Scenario: Un enlace nuevo anula el anterior
- **WHEN** un `ADMIN` genera un segundo enlace para la misma cuenta
- **THEN** el primero ya no sirve para restablecer y el segundo sí

#### Scenario: Cuenta ADMIN o deshabilitada
- **WHEN** un `ADMIN` intenta generar el enlace de una cuenta `ADMIN` o de una cuenta deshabilitada
- **THEN** el sistema responde `409` y no genera nada

#### Scenario: Otro rol intenta generar un enlace
- **WHEN** un `USER` o un `COORDINATOR` intenta generar un enlace de restablecimiento
- **THEN** el sistema responde `403`

### Requirement: Restablecer la contraseña desde Usuarios
En "Usuarios", cada cuenta `USER` o `COORDINATOR` SHALL ofrecer la acción "Restablecer contraseña", que tras una confirmación genera el enlace y lo muestra en un diálogo con "Copiar enlace", la hora en que vence y la indicación de enviarlo a la persona. Al cerrarlo, el enlace NO SHALL volver a mostrarse.

#### Scenario: Copiar el enlace para enviarlo
- **WHEN** el `ADMIN` confirma "Restablecer contraseña" de un alumno y pulsa "Copiar enlace"
- **THEN** el enlace queda en el portapapeles, se avisa "Enlace copiado" y el diálogo muestra cuándo vence

#### Scenario: Cancelar no genera nada
- **WHEN** el `ADMIN` pulsa "Restablecer contraseña" y cancela la confirmación
- **THEN** no se genera ningún enlace y el anterior, si había, sigue vigente
