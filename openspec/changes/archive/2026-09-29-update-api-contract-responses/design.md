## Context

- `AuthController` devuelve `ResponseEntity` y no declara `@ApiResponse` ni `operationId`: springdoc no puede inferir el status real y publica `200` en las cuatro operaciones (`register` es `201`, `logout` `204`). No hay ningún error en el contrato ni schema de error.
- Runtime de errores ya uniforme (requirement archivado "Formato uniforme de error en toda la API"): `ProblemDetail` con `type`, `title`, `status`, `detail`, `instance`, `timestamp`, `traceId` y, en validación, `errors[]`. **Este change no redefine ese formato**: lo refleja en OpenAPI. Si runtime y contrato divergen, `OpenApiContractIT` debe fallar.
- Rutas públicas escritas en línea en `SecurityConfig.requestMatchers(...)`.
- `@EnableMethodSecurity` con sus valores por defecto: solo `@PreAuthorize`/`@PostAuthorize` se aplican (`@Secured` y `@RolesAllowed` **no** están activados). Hoy ningún endpoint de producción usa `@PreAuthorize`.
- Frontend: orval `axios-functions` + `customInstance` (versión fijada por `pnpm-lock.yaml`); `apiError.ts` usa un tipo local `ProblemDetailBody` y castea sin comprobar. Los mocks MSW ya usan `201`/`204`.
- Dos garantías complementarias: `ContractDriftIT` = el snapshot versionado coincide con `/v3/api-docs`; `OpenApiContractIT` (nuevo) = `/v3/api-docs` dice la verdad sobre la API. Ninguna sustituye a la otra.

## Goals / Non-Goals

**Goals:** contrato fiel (status reales + errores con schema); transversales automáticos e idempotentes; una sola fuente de rutas públicas; tests que detecten cuando lo documentado y lo real divergen, y cuando un endpoint nuevo olvida declarar su éxito; frontend tipado desde el contrato.

**Non-Goals:** ver `proposal.md`. En particular `404`/`405`/`415` siguen cubiertos por el requirement de runtime, pero no se declaran por operación.

## Decisions

### D1. Schemas de error como records de solo documentación
`presentation.dto.ApiProblem`, `presentation.dto.ValidationProblem` y `presentation.dto.FieldProblem` (`{field, message}`, ambos requeridos): records con `@Schema` que **no se instancian** en runtime. Obligatoriedad con `requiredMode` explícito:
```java
public record ApiProblem(
    @Schema(requiredMode = REQUIRED) String type,
    @Schema(requiredMode = REQUIRED) String title,
    @Schema(requiredMode = REQUIRED) Integer status,
    @Schema(requiredMode = REQUIRED) String detail,
    @Schema(requiredMode = REQUIRED, format = "date-time") Instant timestamp,
    @Schema(requiredMode = NOT_REQUIRED) String instance,
    @Schema(requiredMode = NOT_REQUIRED) String traceId) {}
```
`ValidationProblem` repite los mismos campos con la misma obligatoriedad + `@Schema(requiredMode = NOT_REQUIRED) List<FieldProblem> errors` (el 400 de JSON malformado no lo trae). Sin herencia: springdoc la traduce a `allOf`, que orval tipa peor; la duplicación la vigila `OpenApiContractIT` (mismos campos y obligatoriedad). Los opcionales se **omiten** en runtime, nunca valen `null`: no se marcan nullable.
*Alternativa descartada*: documentar `ProblemDetail` de Spring — sus `properties` dinámicas no tipan `timestamp`/`traceId`.

### D2. `@Operation` + `@ApiResponse` explícitos en `AuthController`
Al declarar cualquier `@ApiResponse`, springdoc deja de inferir la de éxito: **cada operación declara su éxito** con su schema. `operationId` explícito y estable (`register`, `login`, `refresh`, `logout`: los mismos nombres que orval genera hoy, así el cliente no cambia de API).
| Operación | Éxito | Errores semánticos |
|---|---|---|
| `POST /auth/register` | `201` `AuthResponse` | `400` `ValidationProblem`, `409` `ApiProblem` |
| `POST /auth/login` | `200` `AuthResponse` | `400` `ValidationProblem`, `401` `ApiProblem` (credenciales inválidas o cuenta bloqueada: mismo cuerpo) |
| `POST /auth/refresh` | `200` `AuthResponse` | `401` `ApiProblem` |
| `POST /auth/logout` | `204` | — |
- `204`: `@ApiResponse(responseCode = "204", description = "Sesión cerrada")` **sin `content`** (orval sigue generando `void`).
- Errores: `@Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class | ValidationProblem.class))`. Estas referencias explícitas son las que **registran** los schemas en `components` (ver D3).

### D3. Transversales: `OpenApiErrorsConfig` (`infra.config`)
- **`OperationCustomizer`** — `Operation customize(Operation operation, HandlerMethod handlerMethod)`: añade `500` a toda operación y `403` si el método o su clase llevan `@PreAuthorize` (directa o como meta-anotación: `AnnotatedElementUtils.hasAnnotation`). Solo `@PreAuthorize` porque es lo único que `@EnableMethodSecurity` aplica con esta configuración: documentar un `403` para `@Secured`/`@RolesAllowed`, que no se aplican, sería mentir. Si algún día se activan, se amplía la regla junto con la config.
- **`OpenApiCustomizer`** — `void customise(OpenAPI openApi)`: añade `401` a toda operación cuya ruta **no** case con `PublicPaths`.
- **Idempotencia**: antes de añadir, `responses.containsKey(code)`; nunca reemplaza una respuesta declarada con `@ApiResponse`. Un `401` explícito de una operación pública es un error semántico propio y se conserva. No se asume orden entre ambos customizers.
- **Registro de schemas**: el customizer se asegura de que `ApiProblem` esté en `components.schemas` (con `ModelConverters.getInstance().resolveAsResolvedSchema(new AnnotatedType(ApiProblem.class))` copiando `referencedSchemas`) antes de referenciarlo con `$ref`, por si una futura API no lo referencia explícitamente. Las firmas exactas se confirman contra `springdoc-openapi-starter-webmvc-ui:3.0.3` al implementar (la compilación lo garantiza).

### D4. `PublicPaths` (`infra.security`)
`final class PublicPaths` con `static final List<String> PATTERNS = List.of(...)` (inmutable) y `static boolean matches(String path)` con `PathPatternParser`. `SecurityConfig` hace `requestMatchers(PublicPaths.PATTERNS.toArray(String[]::new)).permitAll()`. No se usa un `RequestMatcher` en el customizer: exigiría construir un `HttpServletRequest` en código de producción.
La equivalencia de semántica **no se asume, se prueba**: `PublicPathsTest` compara `PublicPaths.matches(path)` con `PathPatternRequestMatcher.withDefaults().matcher(pattern)` (el matcher que Spring Security 7 usa con MVC) sobre `MockHttpServletRequest` en todos los casos obligatorios: `/auth`, `/auth/`, `/auth/login`, `/v3/api-docs`, `/v3/api-docs.yaml`, `/v3/api-docs/swagger-config`, `/swagger-ui.html`, `/swagger-ui/`, `/swagger-ui/index.html`, `/actuator/health`, `/actuator/health/liveness`, `/actuator/info`, `/actuator/env`, `/api/x`. Cualquier discrepancia hace fallar el test.

### D5. Regeneración y entrega
1. Implementar los tests de fidelidad (`OpenApiContractIT`, D6) **antes** de regenerar: deben fallar contra el contrato actual por las razones correctas.
2. `./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dcontract.update=true` (conserva `servers`); revisar a mano el diff de `contracts/openapi.json` (solo status, errores, `operationId` y schemas).
3. `pnpm generate:api`; verificar en el código generado que `logout` devuelve `Promise<void>`, que `register`/`login`/`refresh` conservan `AuthResponse`, que los nombres de función no cambian y que `ApiProblem`/`ValidationProblem` existen en `model/` (con la ruta real que genere orval).
4. `apiError.ts` con guard de runtime (D6) sobre el tipo generado; se borra `ProblemDetailBody`.
5. **Un solo PR** con backend, `contracts/openapi.json` y cliente. Los commits intermedios (por scope) pueden no pasar `ContractDriftIT`/`codegen-drift` por separado; el commit final DEBE pasar `./mvnw -B verify` y `pnpm validate` + `codegen-drift`. `project:apply` (`rules.mjs`) solo reescribe `info` y la cabecera del cliente: no necesita cambios; el ensayo de `template.yml` lo confirma.

### D6. Tests (uno por Scenario)
- **`OpenApiErrorsConfigTest`** (unit, sin Docker): customizers sobre `OpenAPI`/`Operation` sintéticos — `500` siempre; `401` en ruta privada y no en `/auth/**`; `403` con `@PreAuthorize` en método, en clase y como meta-anotación; sin anotación, sin `403`; un `401` explícito no se sobrescribe; aplicar dos veces no duplica (idempotencia).
- **`PublicPathsTest`** (unit): paridad con `PathPatternRequestMatcher` en los casos de D4.
- **`OpenApiContractIT`** (`@SpringBootTest` + Testcontainers vía `AbstractIntegrationTest`, mismo contexto que el resto de `*IT`): sobre `/v3/api-docs`, **resolviendo `$ref`** —
  - status de éxito (`201`/`204`/`200`), sin `200` en `register`/`logout`; `logout` `204` sin `content`;
  - errores semánticos de D2: media type `application/problem+json` y schema correcto;
  - `ApiProblem.required == [type,title,status,detail,timestamp]`; `ValidationProblem` con los mismos campos y obligatoriedad + `errors`;
  - `500` en todas las operaciones; ningún `401` transversal bajo `/auth/**`, pero `login`/`refresh` conservan su `401`;
  - `operationId` únicos y estables;
  - **documentado == real**: registra (201), login (200), logout (204) de verdad con email único; provoca un `409` y un `400` de validación reales; para cada respuesta comprueba que su status está declarado con ese media type y que las claves del cuerpo ⊆ propiedades del schema resuelto y ⊇ sus `required`;
  - **ningún endpoint olvida su éxito**: recorre `RequestMappingHandlerMapping` y exige que todo `HandlerMethod` de `com.odontorisas` declare `@ApiResponse` con un código `2xx` (excluye actuator y springdoc).
- **`OpenApiTransversalErrorsIT`** (contexto completo con un controller de `testsupport.openapi` importado solo aquí: una ruta privada y otra con `@PreAuthorize`): en el documento publicado, la privada declara `401` y la protegida `401` + `403`; y en runtime la privada responde `401` sin token. Cubre "Errores transversales heredados" y "Rutas públicas con una sola fuente" sobre el documento final, no solo sobre objetos sintéticos. El controller vive fuera de `com.odontorisas`: no aparece en el `/v3/api-docs` de `ContractDriftIT` (otro contexto).
- **Frontend `apiError.test.ts`** (Vitest): `AxiosError` con `ApiProblem` → su `detail`; `{ detail: 42 }`, `null`, cuerpo HTML/texto y `AxiosError` sin `response` → genérico; un error que no es `AxiosError` → genérico. Guard:
  ```ts
  function isApiProblem(value: unknown): value is ApiProblem {
    return typeof value === "object" && value !== null
      && typeof (value as { detail?: unknown }).detail === "string";
  }
  ```
  (No exige todos los campos RFC: un error parcial de un proxy degrada al genérico sin romper.)
- `ContractDriftIT` verde tras regenerar; `codegen-drift` verde en CI.

## Risks / Trade-offs

- [Records de documentación que el runtime no usa: pueden divergir del `ProblemDetail` real] → `OpenApiContractIT` compara cuerpos reales con los schemas (⊆ propiedades, ⊇ requeridos).
- [Endpoint nuevo sin `@ApiResponse` de éxito] → lo detecta `OpenApiContractIT` (recorrido de `RequestMappingHandlerMapping`).
- [`PathPatternParser` vs. matcher de Spring Security] → `PublicPathsTest` prueba la paridad; `OpenApiTransversalErrorsIT` lo confirma extremo a extremo.
- [Cambiar el contrato regenera el cliente] → cambio intencionado; `operationId` fijos para que los nombres no cambien; diff revisado en el PR.
- [Commits intermedios con CI roja] → aceptado; se entrega en un solo PR y solo el último commit se exige verde.

## Migration Plan

Sin datos. Contrato y cliente cambian en el mismo PR. Rollback = revertir el PR.
