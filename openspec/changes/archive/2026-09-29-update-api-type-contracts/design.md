## Context

`GlobalExceptionHandler` extiende `ResponseEntityExceptionHandler`. El padre resuelve por su cuenta más de 15 tipos de excepción de Spring MVC (`HttpMessageNotReadableException`, `NoResourceFoundException`, `HttpRequestMethodNotSupportedException`, `HttpMediaTypeNotSupportedException`, `MissingServletRequestParameterException`, `MethodArgumentTypeMismatchException`, `ResponseStatusException`, etc.) — cada uno con su propio `detail` en inglés, escrito para logs, no para un usuario final. Verificado en vivo: `POST /auth/register` con JSON malformado responde `400` con `"detail":"Failed to read request"`.

Además, **hoy esos errores salen sin `timestamp` ni `traceId`**: solo los `@ExceptionHandler` explícitos (`handleBusiness`, `handleAuthentication`, `handleAccessDenied`, `handleUncaught`, `handleMethodArgumentNotValid`) llaman a `addExtensions`; `handleExceptionInternal` no está sobrescrito.

El lado de Spring Security (401 sin sesión, 403 de `@PreAuthorize`/regla de URL) ya quedó resuelto en PR #8: el `authenticationEntryPoint`/`accessDeniedHandler` delegan en el `HandlerExceptionResolver` de MVC, que termina pasando por `GlobalExceptionHandler`.

Rutas: `anyRequest().authenticated()` responde 401 antes que MVC resuelva una ruta inexistente; bajo `/auth/**` (pública) sí llega el 404/405/415 de MVC.

## Goals / Non-Goals

**Goals:**
- Todo error gestionado por Spring MVC, por los `@ExceptionHandler` del proyecto o por Spring Security vía `HandlerExceptionResolver` responde el mismo `ProblemDetail` completo (`type`, `title`, `status`, `detail`, `timestamp`, `traceId`) con un `detail` en español apto para el usuario.
- Un solo punto de cambio para los errores del padre, que siga funcionando si Spring agrega nuevos tipos de excepción MVC.
- Documentar en `api-type-contracts` el requirement "formato uniforme de error", implementado solo en parte hasta ahora.

**Non-Goals:**
- Errores fuera de los puntos de extensión de MVC/Security (antes del `DispatcherServlet`, filtros que no delegan, respuesta ya comprometida, `AsyncRequestNotUsableException` —cuyo handler de Spring puede devolver `null`—, errores del contenedor). Quedan fuera del requirement de forma explícita; cubrirlos exigiría otro mecanismo (p. ej. un `ErrorController`/filtro global) que no compensa hoy.
- **Documentar los errores y los status reales en el contrato OpenAPI** (schema de error, `@ApiResponse` para `201`/`204`, un customizer que inyecte 401/403/500): hoy `contracts/openapi.json` declara `200` en `/auth/register` (real `201`) y `/auth/logout` (real `204`) y ningún error. Es un **change aparte** (`update-api-contract-responses`, siguiente): cambia el contrato y el cliente generado, y este change no debe mover `contracts/openapi.json` (`ContractDriftIT` debe seguir verde sin regenerarlo). La separación es intencional: **este change no puede archivarse como solución completa de la documentación del contrato**. Al archivarlo queda pendiente `update-api-contract-responses`, que deberá: schema `ProblemDetail` (`type`, `title`, `status`, `detail`, `instance`, `timestamp`, `traceId`) y de validación (`errors[]`); `@ApiResponse` con `201` en `/auth/register` y `204` en `/auth/logout`; 400/401/403/409/415/500 donde correspondan; un customizer de respuestas transversales (lo que `docs/backend.md` llama `OpenApiErrorsConfig`) con una fuente única de rutas públicas (`PublicPaths`); regenerar `contracts/openapi.json` y el cliente orval; `codegen-drift` y `ContractDriftIT` en verde; y tests que comparen lo documentado con lo real.
- No re-decide el lado de Spring Security (PR #8), solo se referencia y se prueba dentro del mismo requirement.
- No agrega mensaje por tipo de excepción: el mapa es por status HTTP.

## Decisions

### D1: Mapa `status → mensaje`, no override por tipo de excepción

`handleExceptionInternal` es el punto donde termina todo lo que resuelve el padre. Se sobrescribe una vez con un `Map<HttpStatus, String>` en español para los status que Spring MVC resuelve mediante `ResponseEntityExceptionHandler`: **400, 404, 405, 406, 413, 415 y 503** (p. ej. 400 → "La solicitud no es válida.", 404 → "No se encontró el recurso solicitado.", 405 → "Método no permitido para este recurso.", 406 → "No se puede generar la respuesta en el formato solicitado.", 413 → "La solicitud es demasiado grande.", 415 → "Tipo de contenido no soportado.", 503 → "El servicio no está disponible en este momento. Inténtalo más tarde.").
El **500** de `handleUncaught` conserva su handler explícito (no pasa por el mapa) y se prueba aparte. El 400 de validación (`handleMethodArgumentNotValid`) ya está sobrescrito con su `detail` y su extensión `errors`: no pasa por el mapa y se conserva.

*Alternativa descartada*: un `@ExceptionHandler` por tipo (~15 métodos casi idénticos, lista a sincronizar con cada versión de Spring).

### D2: Reutilizar el `body` del padre, no reemplazarlo

Firma en Spring Framework 7:
```java
protected ResponseEntity<Object> handleExceptionInternal(
    Exception ex, Object body, HttpHeaders headers, HttpStatusCode statusCode, WebRequest request)
```
- Si `body` es un `ProblemDetail` (caso habitual, p. ej. JSON malformado con `detail` "Failed to read request"), se **reutiliza la misma instancia**: se reemplaza `detail` y se añaden `timestamp`/`traceId` (`addExtensions`). No se tocan `title`, `status` ni `instance`.
- **`type`** (decidido al implementar): Spring deja `about:blank` en estos errores y su serializador **omite** el campo, así que el cuerpo salía sin `type`. Si el `type` es `null` o `about:blank`, se asigna `/errors/<slug del status>` (`/errors/bad-request`, `/errors/not-found`, `/errors/method-not-allowed`, `/errors/unsupported-media-type`…; status no estándar → `/errors/error`), el mismo patrón que `/errors/email-already-exists`. Un `type` propio que ya venga se conserva.
- Si `body` es `null` (algunos handlers del padre), se crea `ProblemDetail.forStatus(statusCode)` con el `detail` del mapa y las extensiones.
- Si `body` es de otro tipo (no previsto por Spring 7), se delega en `super` sin tocarlo: no se inventa un `ProblemDetail` encima de un cuerpo desconocido.
- La respuesta final se construye delegando en `super.handleExceptionInternal(ex, enrichedBody, headers, statusCode, request)`.

### D3: `HttpStatusCode` → `HttpStatus`, con fallback genérico

`HttpStatus.resolve(statusCode.value())` puede devolver `null` (código no estándar). Ese `null`, y cualquier status ausente del mapa, caen a un genérico: "Ocurrió un error al procesar la solicitud." Nunca se re-lanza el `detail` original de Spring.

### D4: No toca mensajes ya curados

Las excepciones con `@ExceptionHandler` explícito (negocio, autenticación, autorización, validación, inesperadas) no pasan por `handleExceptionInternal`: Spring despacha primero al handler más específico. El mapa solo se activa para lo que el padre resuelve por su cuenta.

### D5: Tests (uno por Scenario)

- **`ErrorContractIT`** (`@SpringBootTest` + Testcontainers: la única forma fiel de pasar por la `SecurityConfig` real, la delegación 401 al `HandlerExceptionResolver` y el `TraceIdFilter` real). MockMvc sobre `/auth/**` pública. Para cada error verifica `Content-Type: application/problem+json`, `type`, `title`, `status`, `timestamp`, `traceId == X-Trace-Id` y el `detail` **exacto definido por la aplicación** (p. ej. `"La solicitud no es válida."`): se asevera el mensaje propio, no una lista de textos internos de Spring que cambian entre versiones. En el 400 de JSON malformado se comprueba además que `title` e `instance` del `ProblemDetail` del padre se conservan y que `type` es `/errors/bad-request`:
  - 400: `POST /auth/register` con JSON malformado;
  - 404: `GET /auth/__ruta_inexistente__` (pública, así no hay 401 previo; se fija status y cuerpo, no el tipo de excepción —`NoResourceFoundException` o `NoHandlerFoundException` según configuración—);
  - 405: `GET /auth/login` (solo existe `POST`);
  - 415: `POST /auth/login` con `Content-Type: text/plain` y cuerpo `{}`;
  - negocio: registro con correo duplicado → su `detail` curado ("…ya registrado…"), no el genérico;
  - 401: `GET` a una ruta privada sin token → formato completo.
- **`ErrorFallbackTest`** (`@WebMvcTest`, sin Docker): controller de prueba en `testsupport.errors` (fuera del escaneo de `@SpringBootApplication`, que escanea `com.odontorisas`; registrado como `@Bean` explícito solo en este test, igual que `MethodSecurityTest`, para no aparecer en `/v3/api-docs` de `ContractDriftIT`):
  - `ResponseStatusException(HttpStatus.I_AM_A_TEAPOT, "texto interno")` (en Spring 7 pasa por `handleErrorResponseException` → `handleExceptionInternal`) → `detail` exactamente `"Ocurrió un error al procesar la solicitud."`, sin "texto interno";
  - **el mapa completo**: test parametrizado que lanza `ResponseStatusException` con cada status del mapa (400, 404, 405, 406, 413, 415, 503) → `detail` exactamente su mensaje. Así 406, 413 y 503 quedan probados sin montar un endpoint real para cada uno;
  - `RuntimeException("secreto")` → `500` con `detail` genérico sin "secreto".
- 403 ya lo cubre `MethodSecurityTest` (PR #8); se añade la aserción de `timestamp` si falta.
- `ContractDriftIT` sigue verde **sin regenerar** el contrato.

## Risks / Trade-offs

- [Un mensaje por status pierde matiz] → el objetivo es que el usuario nunca vea texto de Spring en inglés. Un caso que necesite más matiz tiene su propio `@ExceptionHandler`.
- [Status no estándar cae al genérico] → aceptable: mejor genérico en español que texto crudo.
- [Errores fuera de MVC/Security siguen con otra forma] → fuera de alcance y dicho en el requirement; si aparece uno real, se evalúa un `ErrorController`/filtro global.
- [El contrato sigue sin documentar errores ni `201`/`204`] → change aparte (`update-api-contract-responses`), ver Non-Goals.
