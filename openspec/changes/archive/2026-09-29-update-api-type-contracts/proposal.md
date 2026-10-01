## Why

Verificado en vivo contra un JSON malformado real (`POST /auth/register` con body inválido): el backend responde `400` con `"detail":"Failed to read request"` — el mensaje interno de Spring, en inglés. `GlobalExceptionHandler` extiende `ResponseEntityExceptionHandler`, cuyo padre resuelve por su cuenta más de 15 tipos de excepción de Spring MVC (JSON malformado, 404, 405, 415, parámetro/cabecera faltante, tipo no convertible...) — cada uno con su propio `detail` en inglés, pensado para logs. Además esos errores salen **sin `timestamp` ni `traceId`**: solo los `@ExceptionHandler` explícitos los añaden. El frontend reenvía cualquier `detail` directo a un toast, asumiendo que siempre viene "listo para mostrarse" — cierto solo para las excepciones que `GlobalExceptionHandler` maneja explícitamente.

De paso: la capacidad `api-type-contracts` nunca documentó el requirement "la API falla con un único formato de error (RFC 9457)", implementado solo en parte. Este change lo captura y lo completa.

## What Changes

- Todo error gestionado por Spring MVC, por los `@ExceptionHandler` del proyecto o por Spring Security vía `HandlerExceptionResolver` SHALL responder el mismo `ProblemDetail` completo (`type`, `title`, `status`, `detail`, `timestamp`, `traceId`) con un `detail` en español apto para el usuario.
- Un solo punto de cambio: `handleExceptionInternal` sobrescrito con un mapa **status → mensaje en español** (400, 404, 405, 406, 413, 415, 503) y fallback genérico; reutiliza el `ProblemDetail` que construye el padre (sin perder `type`/`title`/`status`/`instance`) y le añade `timestamp`/`traceId`.
- Documenta en `api-type-contracts` el requirement "Formato uniforme de error en toda la API", con su alcance explícito.
- **Ya resuelto, referenciar sin reimplementar**: Spring Security (401 sin sesión, 403 de `@PreAuthorize`/regla de URL) delega en el `HandlerExceptionResolver` desde PR #8.
- Corrige `docs/backend.md` §10–§11, que describe como existentes piezas que no están en este repo (`presentation.ProblemDetails`, `ApiProblem`/`ValidationProblem`, `handleDataIntegrity`, `OpenApiErrorsConfig`, `PublicPaths`).

## Non-goals

- Errores fuera de los puntos de extensión de MVC/Security (antes del `DispatcherServlet`, filtros que no delegan, respuesta ya comprometida, errores del contenedor): fuera del requirement, dicho de forma explícita.
- **Documentar errores y status reales en el contrato OpenAPI**: este change normaliza únicamente las respuestas de error **en runtime**; no modifica `contracts/openapi.json` ni los artefactos generados. La documentación OpenAPI de `ProblemDetail`, errores transversales y status reales (`201` de registro, `204` de logout) queda trazada como **deuda explícita** del change sucesor `update-api-contract-responses` (planeado en `docs/vision.md`), que debe completarse antes de considerar `api-type-contracts` plenamente sincronizada: hoy el frontend genera tipos desde un contrato que no conoce `detail`, `timestamp`, `traceId`, `201` ni `204`.
- No cambia el frontend: solo mejora el texto que entrega el backend.
- No agrega mensajes por tipo de excepción: el mapa es por status HTTP.
- No re-decide el lado de Spring Security (PR #8).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `api-type-contracts`: ADDED "Formato uniforme de error en toda la API" (forma completa + `detail` en español en todo error gestionado por MVC, los handlers del proyecto o Spring Security). Ningún requirement existente cambia: "Credenciales inválidas" (`authentication`) ya exige su mensaje en español y sigue igual.

## Impact

- **Backend**: `GlobalExceptionHandler` (mapa + `handleExceptionInternal`).
- **Tests**: nuevo `ErrorContractIT` (400/404/405/415/negocio/401 con formato completo), nuevo `ErrorFallbackTest` (`@WebMvcTest`, fallback genérico y 500), `MethodSecurityTest` (403 con `timestamp`).
- **Contrato/Frontend**: sin cambios (`ContractDriftIT` verde sin regenerar).
- **Docs**: `docs/backend.md` §10–§11, `docs/testing.md` §6; `docs/vision.md` enlaza el change.
