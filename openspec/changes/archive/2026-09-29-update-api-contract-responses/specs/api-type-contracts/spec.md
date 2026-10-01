## ADDED Requirements

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
