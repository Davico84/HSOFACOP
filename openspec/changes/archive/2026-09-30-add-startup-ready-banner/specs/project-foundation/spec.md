## ADDED Requirements

### Requirement: Aviso de backend listo al arrancar
Cuando el backend termina de arrancar y ya acepta peticiones, SHALL escribir en el log un aviso destacado y fácil de localizar con el nombre del proyecto, la URL base con el puerto real y el estado de la documentación de la API. El aviso SHALL NOT incluir secretos ni otros valores sensibles de configuración.

#### Scenario: Aviso con la URL real
- **WHEN** la aplicación termina de arrancar
- **THEN** el log muestra un bloque delimitado que incluye el nombre del proyecto (`app.name`) y la URL `http://localhost:<puerto>` con el puerto en el que realmente escucha (incluido el context-path si hay uno)

#### Scenario: Swagger activo
- **WHEN** la aplicación arranca con la documentación habilitada (`SWAGGER_ENABLED=true`)
- **THEN** el aviso incluye la URL de Swagger UI (`<url base>/swagger-ui.html`)

#### Scenario: Swagger desactivado
- **WHEN** la aplicación arranca con la documentación deshabilitada (por defecto)
- **THEN** el aviso indica que Swagger UI está desactivado y cómo activarlo (`SWAGGER_ENABLED=true`)

#### Scenario: Sin secretos en el aviso
- **WHEN** se escribe el aviso
- **THEN** no contiene el secreto JWT, la contraseña de la base de datos ni ningún otro valor de configuración sensible
