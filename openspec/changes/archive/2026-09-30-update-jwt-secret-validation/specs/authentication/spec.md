## ADDED Requirements

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
