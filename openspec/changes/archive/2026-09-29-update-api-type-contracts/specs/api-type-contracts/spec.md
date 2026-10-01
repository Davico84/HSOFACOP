## ADDED Requirements

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
