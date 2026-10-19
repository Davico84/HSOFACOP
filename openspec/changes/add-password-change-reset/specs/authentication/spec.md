## ADDED Requirements

### Requirement: Cambio de contraseña con la sesión iniciada
Una cuenta autenticada SHALL poder cambiar su contraseña indicando la actual y una nueva de al menos 8 caracteres distinta de la actual. Una contraseña actual incorrecta SHALL rechazarse con `400` en ese campo, sin cambiar nada, y SHALL contar como intento fallido para el bloqueo temporal; con la cuenta bloqueada, el cambio SHALL rechazarse sin comparar la contraseña.

#### Scenario: Cambio correcto
- **WHEN** una cuenta envía su contraseña actual y una nueva válida
- **THEN** desde entonces inicia sesión con la nueva y no con la anterior

#### Scenario: Contraseña actual incorrecta
- **WHEN** una cuenta envía una contraseña actual que no es la suya
- **THEN** el sistema responde `400` con "La contraseña actual no es correcta." en ese campo, no cambia la contraseña y suma un intento fallido

#### Scenario: Cuenta bloqueada por intentos
- **WHEN** una cuenta bloqueada temporalmente intenta cambiar su contraseña
- **THEN** el sistema responde `400` con "Demasiados intentos fallidos. Espera unos minutos e inténtalo de nuevo." sin comparar la contraseña ni alterar el bloqueo

#### Scenario: Nueva igual a la actual o demasiado corta
- **WHEN** la nueva contraseña es igual a la actual o tiene menos de 8 caracteres
- **THEN** el sistema responde `400` con el error en la nueva contraseña y no cambia nada

#### Scenario: Sin sesión
- **WHEN** una petición sin sesión intenta cambiar una contraseña
- **THEN** el sistema responde `401`

### Requirement: Sesiones tras cambiar la contraseña
Al cambiar la contraseña, el sistema SHALL revocar todas las sesiones renovables de la cuenta y SHALL emitir una sesión nueva para el dispositivo que hizo el cambio, que sigue conectado; los demás dispositivos SHALL quedar fuera como tarde al caducar su token de acceso en curso.

#### Scenario: Otros dispositivos quedan fuera
- **WHEN** una cuenta con sesión en dos dispositivos cambia su contraseña desde uno
- **THEN** ese dispositivo sigue con sesión y el otro no puede renovar la suya

### Requirement: Restablecimiento de contraseña con un enlace
Un visitante con un enlace de restablecimiento válido (capacidad `users`) SHALL poder fijar una contraseña nueva de al menos 8 caracteres en la página pública "Nueva contraseña". Al hacerlo, el enlace SHALL quedar usado, SHALL revocarse toda sesión renovable de la cuenta y SHALL quitarse su bloqueo temporal; la página SHALL llevar al login con un aviso. Un enlace usado, vencido, anulado o inexistente SHALL rechazarse con `400` sin cambiar nada.

#### Scenario: Restablecer con un enlace válido
- **WHEN** un visitante abre un enlace vigente y fija una contraseña nueva válida
- **THEN** la cuenta inicia sesión con la nueva, sus sesiones anteriores no se renuevan y la pantalla va al login con "Contraseña actualizada. Inicia sesión."

#### Scenario: Restablecer quita el bloqueo temporal
- **WHEN** una cuenta bloqueada por intentos fallidos restablece su contraseña con un enlace vigente
- **THEN** puede iniciar sesión con la nueva de inmediato

#### Scenario: Enlace no válido
- **WHEN** un visitante usa un enlace ya usado, vencido, anulado por uno más nuevo o que no existe
- **THEN** el sistema responde `400` y la página muestra "El enlace no es válido o venció. Pide uno nuevo al administrador." sin cambiar la contraseña

#### Scenario: Contraseña nueva inválida en el enlace
- **WHEN** un visitante escribe en "Nueva contraseña" una contraseña de menos de 8 caracteres o una confirmación distinta
- **THEN** el formulario muestra el error junto al campo y no envía la petición; el enlace sigue vigente
