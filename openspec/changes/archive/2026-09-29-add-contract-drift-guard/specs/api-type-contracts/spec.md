## MODIFIED Requirements

### Requirement: Especificación OpenAPI publicada y versionada
El backend SHALL exponer su especificación OpenAPI en runtime y exportarla a un snapshot **versionado en Git**, que sirve como contrato fuente único para el frontend.

#### Scenario: Exposición en runtime
- **WHEN** se realiza una petición GET a `/v3/api-docs` con la aplicación en ejecución
- **THEN** el backend responde `200 OK` con un documento OpenAPI válido
- **AND** el documento incluye las operaciones de autenticación (registro, login, refresco)

#### Scenario: Snapshot del contrato versionado
- **WHEN** se ejecuta el export del contrato del backend (`./mvnw verify -Dcontract.update=true`, sin necesidad de levantar la aplicación)
- **THEN** se genera/actualiza `contracts/openapi.json` (documento OpenAPI válido) con el documento que publica el backend, en formato JSON con 2 espacios de indentación, UTF-8 y salto de línea final, conservando su `servers`
- **AND** ese archivo está versionado en Git (no bajo `target/`), como fuente para el codegen del frontend

#### Scenario: Restricciones de validación reflejadas en el contrato
- **WHEN** se inspecciona el schema de un DTO `*Request` en `contracts/openapi.json` (p. ej. el de registro)
- **THEN** las restricciones de formato del DTO (longitud, formato de correo, campos requeridos) aparecen reflejadas en el schema (paridad con `docs/coding-style.md §7`)

### Requirement: Contrato y artefactos generados sincronizados (sin drift)
El repositorio SHALL versionar los archivos TypeScript generados y SHALL detectar, en las dos direcciones (backend → contrato y contrato → cliente generado), cuando el contrato o los artefactos generados quedan desactualizados.

#### Scenario: Artefactos generados versionados
- **WHEN** se inspecciona `src/modules/core/services`
- **THEN** los archivos generados por el codegen están versionados en Git
- **AND** el pipeline del frontend (typecheck/lint/test) se ejecuta sin necesidad del build del backend

#### Scenario: Detección de drift en CI
- **WHEN** CI regenera el contrato y los tipos y compara con lo versionado
- **THEN** si hay diferencias, el pipeline falla indicando que el contrato o los artefactos generados están desactualizados

#### Scenario: Contrato alineado con el backend
- **WHEN** se ejecuta la verificación del backend (`./mvnw verify`) y el documento que publica `/v3/api-docs` coincide con `contracts/openapi.json` (comparación semántica, ignorando `servers`)
- **THEN** la verificación del contrato pasa sin modificar ningún archivo

#### Scenario: Contrato desactualizado respecto al backend
- **WHEN** se ejecuta la verificación del backend y el documento publicado difiere de `contracts/openapi.json` (p. ej. se añadió un endpoint, cambió un DTO o se editó el contrato a mano)
- **THEN** la verificación falla indicando qué partes del contrato difieren y el comando para regenerarlo (`./mvnw verify -Dcontract.update=true`, seguido de `pnpm generate:api`)

#### Scenario: Cambio solo en el contrato
- **WHEN** un cambio modifica `contracts/openapi.json` sin tocar el backend
- **THEN** el pipeline del backend también se ejecuta y detecta la diferencia
