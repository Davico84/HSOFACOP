## ADDED Requirements

### Requirement: Especificación OpenAPI publicada y versionada
El backend SHALL exponer su especificación OpenAPI en runtime y exportarla a un snapshot **versionado en Git**, que sirve como contrato fuente único para el frontend.

#### Scenario: Exposición en runtime
- **WHEN** se realiza una petición GET a `/v3/api-docs` con la aplicación en ejecución
- **THEN** el backend responde `200 OK` con un documento OpenAPI válido
- **AND** el documento incluye las operaciones de autenticación (registro, login, refresco)

#### Scenario: Snapshot del contrato versionado
- **WHEN** se ejecuta la tarea de export del contrato del backend
- **THEN** se genera/actualiza `contracts/openapi.json` (documento OpenAPI válido)
- **AND** ese archivo está versionado en Git (no bajo `target/`), como fuente para el codegen del frontend

#### Scenario: Restricciones de validación reflejadas en el contrato
- **WHEN** se inspecciona el schema de un DTO `*Request` en `contracts/openapi.json` (p. ej. el de registro)
- **THEN** las restricciones de formato del DTO (longitud, formato de correo, campos requeridos) aparecen reflejadas en el schema (paridad con `docs/coding-style.md §7`)

### Requirement: Tipos y cliente del frontend generados desde el contrato versionado
El frontend SHALL derivar sus tipos y sus funciones de acceso a la API a partir del contrato versionado (`contracts/openapi.json`), sin escribirlos a mano, manteniéndose desacoplado del build del backend. Los hooks de TanStack Query se componen a mano sobre esas funciones.

#### Scenario: Generación desde el contrato versionado
- **WHEN** se ejecuta el script `generate:api` del frontend contra `contracts/openapi.json`
- **THEN** se generan los tipos y las funciones fetch tipadas en `src/modules/core/services/generated`
- **AND** el proyecto pasa `pnpm typecheck` usando esos artefactos generados

#### Scenario: El consumo de la API usa los artefactos generados
- **WHEN** una pantalla o módulo del frontend invoca un endpoint de autenticación
- **THEN** lo hace a través de las **funciones y tipos generados** (los hooks de TanStack Query se componen a mano sobre esas funciones), no mediante llamadas `axios` escritas a mano con tipos manuales

### Requirement: Contrato y artefactos generados sincronizados (sin drift)
El repositorio SHALL versionar los archivos TypeScript generados y SHALL detectar en CI cuando el contrato o los artefactos generados quedan desactualizados.

#### Scenario: Artefactos generados versionados
- **WHEN** se inspecciona `src/modules/core/services`
- **THEN** los archivos generados por el codegen están versionados en Git
- **AND** el pipeline del frontend (typecheck/lint/test) se ejecuta sin necesidad del build del backend

#### Scenario: Detección de drift en CI
- **WHEN** CI regenera el contrato y los tipos y compara con lo versionado
- **THEN** si hay diferencias, el pipeline falla indicando que el contrato o los artefactos generados están desactualizados
