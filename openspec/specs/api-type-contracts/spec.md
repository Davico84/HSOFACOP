# api-type-contracts Specification

## Purpose

Establece el contrato de API como fuente única de verdad entre backend y frontend: el backend publica y versiona su especificación OpenAPI, el frontend deriva de ella sus tipos y su cliente sin escribirlos a mano, y CI detecta cualquier drift entre el contrato y los artefactos generados.
## Requirements
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

### Requirement: Formato uniforme de error en toda la API

El backend SHALL responder todo error gestionado por Spring MVC (incluidos los que resuelve el manejador por defecto `ResponseEntityExceptionHandler`), por los `@ExceptionHandler` del proyecto o por los handlers de Spring Security que delegan en el `HandlerExceptionResolver`, con el mismo formato RFC 9457: `application/problem+json` con `type`, `title`, `status`, `detail` y `timestamp`, más `traceId` cuando la petición lo tiene (el mismo valor que la cabecera `X-Trace-Id`). El `detail` SHALL ser un mensaje en español apto para mostrarse a un usuario final, nunca el mensaje interno de Spring. Los errores producidos fuera de esos puntos de extensión (antes del `DispatcherServlet`, en filtros que no delegan, con la respuesta ya comprometida o en el contenedor) quedan fuera de este requirement.

#### Scenario: Excepción de negocio con handler explícito

- **WHEN** ocurre una excepción de negocio con un `@ExceptionHandler` propio en `GlobalExceptionHandler` (p. ej. correo duplicado en registro)
- **THEN** la respuesta es `application/problem+json` con su `detail` ya curado en español, sin reemplazarlo por un mensaje genérico
- **AND** incluye `timestamp` y un `traceId` igual a la cabecera `X-Trace-Id`

#### Scenario: Excepción resuelta por el manejador por defecto de Spring MVC

- **WHEN** ocurre una excepción que Spring MVC resuelve por su cuenta: JSON malformado (400), ruta inexistente (404), método no soportado (405) o tipo de contenido no soportado (415)
- **THEN** la respuesta es `application/problem+json` con `type`, `title`, `status`, `timestamp` y un `traceId` igual a la cabecera `X-Trace-Id`
- **AND** el `type` sigue el patrón `/errors/<status>` del proyecto (p. ej. `/errors/bad-request`), no el `about:blank` que Spring omite al serializar
- **AND** el `detail` es un mensaje en español apto para el usuario final, no el mensaje interno de Spring (p. ej. no "Failed to read request")

#### Scenario: Status HTTP sin mensaje específico en el mapa

- **WHEN** el manejador por defecto resuelve una excepción cuyo status HTTP no tiene un mensaje específico configurado
- **THEN** el `detail` es exactamente el mensaje genérico en español, nunca el texto de la excepción original

#### Scenario: Error de autenticación o autorización

- **WHEN** una petición falla por falta de sesión (401) o por no cumplir un `@PreAuthorize`/regla de URL (403)
- **THEN** la respuesta es `application/problem+json` con `detail` en español, con el mismo formato que el resto de errores de la API

#### Scenario: Error inesperado

- **WHEN** ocurre una excepción no prevista por ningún handler específico
- **THEN** la respuesta es `500` `application/problem+json` con un `detail` genérico en español, `timestamp` y `traceId`
- **AND** no expone stack trace ni el mensaje interno de la excepción

### Requirement: Respuestas documentadas fielmente en el contrato

El contrato OpenAPI SHALL declarar, para cada operación, el status de éxito que devuelve realmente la API y sus respuestas de error con un schema de error común (`ApiProblem`, y `ValidationProblem` para errores de validación) servido como `application/problem+json`, reflejando el formato ya garantizado en runtime por "Formato uniforme de error en toda la API". Los errores transversales (`500` en toda operación, `401` en toda ruta no pública, `403` en todo método protegido por rol) SHALL aparecer en el contrato sin declararlos operación a operación, sin reemplazar nunca una respuesta declarada explícitamente. Lo documentado SHALL coincidir con lo que la API responde, y el frontend SHALL tipar los errores con el tipo generado desde el contrato.

#### Scenario: Status de éxito real

- **WHEN** se inspecciona el contrato publicado
- **THEN** `POST /auth/register` declara `201` con `AuthResponse`, `POST /auth/logout` declara `204` sin cuerpo, y `POST /auth/login` y `POST /auth/refresh` declaran `200` con `AuthResponse`
- **AND** `register` y `logout` no declaran `200`
- **AND** toda operación de la API declara de forma explícita su respuesta de éxito

#### Scenario: Errores semánticos documentados con el schema de error

- **WHEN** se inspecciona una operación con errores propios en el contrato
- **THEN** `POST /auth/register` declara `400` (`ValidationProblem`) y `409` (`ApiProblem`), `POST /auth/login` declara `400` (`ValidationProblem`) y `401` (`ApiProblem`) y `POST /auth/refresh` declara `401` (`ApiProblem`)
- **AND** todas esas respuestas usan el media type `application/problem+json`
- **AND** `ApiProblem` exige `type`, `title`, `status`, `detail` y `timestamp`, con `instance` y `traceId` opcionales, y `ValidationProblem` tiene los mismos campos con la misma obligatoriedad más `errors` opcional

#### Scenario: Errores transversales heredados sin declararlos

- **WHEN** se publica cualquier operación
- **THEN** el contrato le declara `500` (`ApiProblem`)
- **AND** le declara `401` si su ruta no es pública, y `403` si su método o su clase exigen un rol con `@PreAuthorize`, sin `@ApiResponse` explícito para ellos
- **AND** una ruta pública no hereda el `401` transversal, pero conserva un `401` que declare explícitamente como error propio (p. ej. credenciales inválidas)

#### Scenario: Rutas públicas con una sola fuente

- **WHEN** una ruta es pública o privada según la lista de rutas públicas
- **THEN** la seguridad real y el contrato publicado observan lo mismo: una ruta privada responde `401` sin sesión y su operación declara `401`; una ruta pública no exige sesión y su operación no declara el `401` transversal

#### Scenario: Lo documentado coincide con lo real

- **WHEN** se ejercitan de verdad las operaciones documentadas (registro, login, logout y sus errores `400` de validación y `409`)
- **THEN** el status real de cada respuesta está declarado en su operación con el media type y el schema correspondientes
- **AND** los campos del cuerpo real de un error de negocio son un subconjunto de las propiedades de `ApiProblem`, y los de un error de validación, de las de `ValidationProblem`, incluidos todos sus campos obligatorios

#### Scenario: Frontend tipado desde el contrato

- **WHEN** el frontend extrae el mensaje de un error de la API
- **THEN** usa el tipo `ApiProblem` generado desde el contrato, no un tipo escrito a mano
- **AND** muestra su `detail` solo si la respuesta tiene un `detail` de texto; en cualquier otro caso (sin respuesta, cuerpo vacío, HTML, `detail` no textual) muestra un mensaje genérico

