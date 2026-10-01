## MODIFIED Requirements

### Requirement: Especificación OpenAPI publicada y versionada
El backend SHALL exponer su especificación OpenAPI en runtime **solo cuando la documentación está habilitada por configuración** (`SWAGGER_ENABLED`, deshabilitada por defecto) y exportarla a un snapshot **versionado en Git**, que sirve como contrato fuente único para el frontend.

#### Scenario: Exposición en runtime
- **WHEN** se realiza una petición GET a `/v3/api-docs` con la aplicación en ejecución y la documentación habilitada (`SWAGGER_ENABLED=true`)
- **THEN** el backend responde `200 OK` con un documento OpenAPI válido
- **AND** el documento incluye las operaciones de autenticación (registro, login, refresco)

#### Scenario: Documentación deshabilitada por defecto
- **WHEN** la aplicación se ejecuta sin configurar `SWAGGER_ENABLED` (o con `false`)
- **THEN** `GET /v3/api-docs` y `GET /swagger-ui.html` responden `404`
- **AND** el resto de la API funciona igual
- **AND** el valor por defecto de la configuración versionada es `false`

#### Scenario: Swagger UI disponible al habilitarla
- **WHEN** la aplicación se ejecuta con `SWAGGER_ENABLED=true`
- **THEN** `GET /swagger-ui.html` sirve la interfaz de Swagger UI

#### Scenario: Snapshot del contrato versionado
- **WHEN** se ejecuta el export del contrato del backend (`./mvnw verify -Dcontract.update=true`, sin necesidad de levantar la aplicación ni de configurar `SWAGGER_ENABLED` a mano: el propio test de export habilita la documentación en su contexto)
- **THEN** se genera/actualiza `contracts/openapi.json` (documento OpenAPI válido) con el documento que publica el backend, en formato JSON con 2 espacios de indentación, UTF-8 y salto de línea final, conservando su `servers`
- **AND** ese archivo está versionado en Git (no bajo `target/`), como fuente para el codegen del frontend

#### Scenario: Restricciones de validación reflejadas en el contrato
- **WHEN** se inspecciona el schema de un DTO `*Request` en `contracts/openapi.json` (p. ej. el de registro)
- **THEN** las restricciones de formato del DTO (longitud, formato de correo, campos requeridos) aparecen reflejadas en el schema (paridad con `docs/coding-style.md §7`)
