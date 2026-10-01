> Solo backend + docs. Sin cambios en `contracts/openapi.json` ni frontend (`ContractDriftIT` verde sin regenerar). Revisado por Codex (dos pasadas).
> `ErrorContractIT` necesita Docker: verificar siempre `Skipped: 0`. Los `detail` se asevera con el texto exacto de la aplicación.

## 1. Backend — `handleExceptionInternal` (D1–D4)

- [x] 1.1 `Map<HttpStatus, String>` en español en `GlobalExceptionHandler` para 400, 404, 405, 406, 413, 415 y 503, más el mensaje genérico de fallback
- [x] 1.2 Sobrescribir `handleExceptionInternal`: si `body` es `ProblemDetail`, reutilizarlo (`detail` + `addExtensions`, sin tocar `title`/`status`/`instance`; `type` `about:blank` → `/errors/<status>`); si es `null`, `ProblemDetail.forStatus(statusCode)`; otro tipo, delegar sin tocar; `HttpStatus.resolve` con fallback genérico; delegar en `super.handleExceptionInternal` con el body enriquecido
- [x] 1.3 Confirmar que los `@ExceptionHandler` explícitos (negocio, 401, 403, validación, 500) no pasan por el mapa y conservan su `detail`

## 2. Backend — tests (D5)

- [x] 2.1 `ErrorContractIT`: 400 JSON malformado (`POST /auth/register`) — formato completo, `traceId == X-Trace-Id`, `detail` exacto de la app; `title`/`instance` del padre conservados y `type` `/errors/bad-request`
- [x] 2.2 `ErrorContractIT`: 404 `GET /auth/__ruta_inexistente__`, 405 `GET /auth/login`, 415 `POST /auth/login` con `text/plain` — mismo formato completo y `detail` exacto
- [x] 2.3 `ErrorContractIT`: correo duplicado conserva su `detail` curado; 401 sin token en ruta privada con formato completo
- [x] 2.4 `ErrorFallbackTest` (`@WebMvcTest`, controller en `testsupport.errors` registrado como `@Bean` solo aquí): 418 → genérico exacto; parametrizado con cada status del mapa (400, 404, 405, 406, 413, 415, 503) → su mensaje exacto; `RuntimeException` → 500 genérico sin el mensaje interno
- [x] 2.5 `MethodSecurityTest`: el 403 incluye `timestamp` y el formato completo
- [x] 2.6 `./mvnw -B verify` verde, `Skipped: 0`, `ErrorContractIT` en `failsafe-reports`; regresión: `ContractDriftIT` verde y `contracts/openapi.json` sin cambios

## 3. Documentación

- [x] 3.1 Reescribir `docs/backend.md` §10 y §10.1 para describir únicamente los componentes existentes: `GlobalExceptionHandler`, `ProblemDetail` nativo de Spring, `addExtensions`, `handleMethodArgumentNotValid` y `handleExceptionInternal` (con el mapa y el alcance del requirement). Eliminar todas las referencias a `presentation.ProblemDetails`, `ProblemDetails.of`, `ApiProblem`, `ValidationProblem`, `handleDataIntegrity` y la fecha del otro proyecto. En §10.2 y §11.1 marcar `OpenApiErrorsConfig`, `PublicPaths` y los schemas de error como pendientes de `update-api-contract-responses`, sin afirmar que existen. Actualizar la frase "El frontend consume estos errores de forma tipada vía el contrato OpenAPI": el contrato todavía no los documenta
- [x] 3.2 `docs/testing.md` §6: `ErrorContractIT` pasa a existente (y `ErrorFallbackTest`); `OpenApiContractIT`/`OpenApiErrorsConfigTest` siguen pendientes (van con `update-api-contract-responses`)
- [x] 3.3 `openspec validate update-api-type-contracts --strict`
