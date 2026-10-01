## Why

`contracts/openapi.json` es la fuente única de verdad del frontend (`api-type-contracts`), pero hoy **miente**: declara `200` en `/auth/register` (la API devuelve `201`) y en `/auth/logout` (devuelve `204`), y **no documenta ningún error**, aunque desde `update-api-type-contracts` todos salen con el mismo `ProblemDetail`. El frontend compensa con un tipo escrito a mano (`ProblemDetailBody { detail?: string }` en `apiError.ts`). `ContractDriftIT` no lo detecta: vigila que el contrato refleje lo que springdoc publica, no que springdoc publique la verdad. Es la deuda explícita que dejó `update-api-type-contracts`.

## What Changes

- **Schemas de error** en el contrato: `ApiProblem` (`type`, `title`, `status`, `detail`, `instance`, `timestamp`, `traceId`) y `ValidationProblem` (`ApiProblem` + `errors[]` de `{field, message}`), servidos como `application/problem+json`.
- **Status reales** declarados con `@ApiResponse`: `201` en registro, `204` en logout, `200` en login y refresh.
- **Errores semánticos** declarados por operación: `400` (`ValidationProblem`) donde hay `@Valid`, `409` en registro, `401` de credenciales inválidas (login) y de refresh inválido.
- **Errores transversales inyectados solos** (`OpenApiErrorsConfig`): `500` en toda operación, `401` en toda ruta no pública, `403` en todo método con `@PreAuthorize`. Nadie tiene que acordarse de declararlos.
- **`PublicPaths`**: fuente única de rutas públicas, usada por `SecurityConfig` **y** por el customizer (así el `401` documentado no puede divergir del real).
- **`operationId` explícitos** (`register`, `login`, `refresh`, `logout`): los nombres del cliente generado quedan fijos.
- **Regenerar** `contracts/openapi.json` (modo `-Dcontract.update=true`) y el cliente orval; `apiError.ts` usa el tipo generado `ApiProblem`, con un guard de runtime, en lugar del escrito a mano.
- **Guardia contra el próximo `200` fantasma**: un test falla si un endpoint nuevo no declara su respuesta de éxito.

Este change **no redefine el formato runtime** de los errores: consume la garantía ya construida por "Formato uniforme de error en toda la API" y la refleja en OpenAPI mediante `ApiProblem` y `ValidationProblem`. Si el runtime y el contrato divergen, `OpenApiContractIT` debe fallar.

## Non-goals

- `404`, `405`, `415` y demás errores de protocolo de MVC **siguen cubiertos por el requirement de runtime** "Formato uniforme de error", pero no se declaran como respuestas específicas de cada operación: documentarlos en todas sería ruido. El `500` transversal cubre "cualquier otro error".
- `403` para `@Secured`/`@RolesAllowed`: no están activados en `@EnableMethodSecurity`; documentarlos sería mentir. Se ampliará si se activan.
- Cambiar el runtime de los errores o sus mensajes.
- Mostrar en la UI más que `detail` (p. ej. errores por campo desde `errors[]`): posible mejora futura del frontend.
- Documentar endpoints de actuator o swagger.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `api-type-contracts`: ADDED "Respuestas documentadas fielmente en el contrato" (status reales, errores semánticos con schema de error, transversales heredados, lo documentado coincide con lo real, frontend tipado desde el contrato).

## Impact

- **Backend**: `presentation.dto.ApiProblem`/`ValidationProblem` (solo esquema), `@ApiResponse` en `AuthController`, `infra.config.OpenApiErrorsConfig`, `infra.security.PublicPaths` (y `SecurityConfig` lo usa).
- **Contrato**: `contracts/openapi.json` regenerado (cambio intencionado; `ContractDriftIT` verde tras regenerar).
- **Frontend**: cliente orval regenerado (`model/apiProblem.ts`, `validationProblem.ts`…), `core/utils/apiError.ts` con el tipo generado; `codegen-drift` verde.
- **Tests**: `OpenApiErrorsConfigTest` y `PublicPathsTest` (unit), `OpenApiContractIT` (fidelidad: status, errores, schemas, documentado == real, ningún endpoint sin éxito declarado), `OpenApiTransversalErrorsIT` (401/403 en el documento publicado y en runtime), `apiError.test.ts`.
- **Entrega**: un solo PR; solo el último commit se exige verde (D5).
- **Docs**: `docs/backend.md` §10.2/§11.1 (las piezas pasan de ⏳ a existentes), `docs/testing.md` §6, `docs/vision.md`.
