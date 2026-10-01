> Backend + contrato + frontend, en un solo PR (D5): solo el último commit se exige verde. Revisado por Codex.
> Los `*IT` necesitan Docker: verificar siempre `Skipped: 0`.
> Regenerar: `./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dcontract.update=true` y después `pnpm generate:api`.

## 1. Backend — rutas públicas (D4)

- [x] 1.1 `infra.security.PublicPaths` (`PATTERNS` inmutable + `matches` con `PathPatternParser`); `SecurityConfig` usa `PublicPaths.PATTERNS`
- [x] 1.2 `PublicPathsTest`: paridad con `PathPatternRequestMatcher` en todos los casos de D4

## 2. Backend — documentación del contrato (D1–D3)

- [x] 2.1 Records de esquema `ApiProblem`, `ValidationProblem`, `FieldProblem` en `presentation.dto` con `requiredMode` explícito (D1)
- [x] 2.2 `@Operation(operationId)` + `@ApiResponse` en `AuthController` según D2 (éxito siempre; `204` sin `content`; errores `application/problem+json`)
- [x] 2.3 `infra.config.OpenApiErrorsConfig`: `OperationCustomizer` (500; 403 por `@PreAuthorize` en método/clase/meta-anotación) + `OpenApiCustomizer` (401 fuera de `PublicPaths`); idempotente, sin reemplazar respuestas explícitas; `ApiProblem` registrado en `components`
- [x] 2.4 `OpenApiErrorsConfigTest` (unit): casos de D6, incluida la idempotencia

## 3. Contrato y verificación backend (D5, D6)

- [x] 3.1 `OpenApiContractIT` (antes de regenerar; debe fallar por las razones correctas contra el contrato viejo): status de éxito, errores semánticos, schemas y obligatoriedad, 500 en todas, `401` explícitos conservados, `operationId`, documentado == real, ningún handler sin `@ApiResponse` de éxito
- [x] 3.2 `OpenApiTransversalErrorsIT` con controller de `testsupport.openapi` (ruta privada + `@PreAuthorize`): 401/403 en el documento publicado y 401 real sin token
- [x] 3.3 Regenerar `contracts/openapi.json` con el modo update; revisar el diff (solo status, errores, `operationId`, schemas)
- [x] 3.4 `./mvnw -B verify` verde, `Skipped: 0`, `OpenApiContractIT`, `OpenApiTransversalErrorsIT` y `ContractDriftIT` en `failsafe-reports`

## 4. Frontend (D5, D6)

- [x] 4.1 `pnpm generate:api`; verificar en el código generado: `logout` → `Promise<void>`, `register`/`login`/`refresh` → `AuthResponse`, mismos nombres de función, `ApiProblem`/`ValidationProblem` en `model/`
- [x] 4.2 `core/utils/apiError.ts`: guard `isApiProblem` sobre el tipo generado; se elimina `ProblemDetailBody`
- [x] 4.3 `apiError.test.ts`: "Frontend tipado desde el contrato" (ApiProblem válido; `{detail: 42}`, `null`, HTML, sin `response`, no-Axios → genérico)
- [x] 4.4 `pnpm validate` verde; registro, login, logout y un error (correo duplicado) funcionan en el navegador (prueba manual)

## 5. Docs y cierre

- [x] 5.1 `docs/backend.md` §10, §10.2 y §11.1 (tras implementar 1–3): `OpenApiErrorsConfig`, `PublicPaths`, `ApiProblem`/`ValidationProblem` existen; eliminar "el contrato no documenta errores", "el contrato dice 200 donde la API devuelve 201/204" y los ⏳ de esas piezas; regla de `@Operation(operationId)` + éxito explícito para todo endpoint nuevo
- [x] 5.2 `docs/testing.md` §6: `OpenApiErrorsConfigTest`, `PublicPathsTest`, `OpenApiContractIT` y `OpenApiTransversalErrorsIT` existen; `OpenApiContractIT` (fidelidad) no sustituye a `ContractDriftIT` (snapshot); `Skipped: 0` también para ellos; quitar el párrafo del `200` fantasma
- [x] 5.3 `openspec validate update-api-contract-responses --strict`
