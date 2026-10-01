# Estándares de Backend — Mi Proyecto

Parte de la documentación de Mi Proyecto. Estándares de código y convenciones del backend **Java 25 · Spring Boot 4.0.6**.
Complementa a `docs/architecture.md` (arquitectura por capas), `docs/testing.md` (pruebas: slices + Testcontainers) y `docs/commits.md`.
El equivalente de frontend es `docs/frontend.md` (y el estilo general de código en `docs/coding-style.md`).

---

## 1. Arquitectura por capas

Flujo de dependencias **estricto**:

```
presentation  →  service  →  persistence
                   ↑
infra (config · security · storage · mail) = adaptadores técnicos (transversal) · common = utilidades
```

| Capa | Paquete | Responsabilidad | NO debe |
|---|---|---|---|
| Presentación | `presentation.controller`, `presentation.dto` | Recibir HTTP, validar request (DTO + Bean Validation), delegar en services, construir respuesta | Contener lógica de negocio ni acceder a `persistence`/entidades |
| Servicio | `service.<dominio>` | **Lógica de negocio**, transacciones, orquestación, mapeo entidad→record del servicio (view) | Depender de `presentation` |
| Persistencia | `persistence.entity`, `persistence.repository`, `persistence.specification` | Entidades JPA, repositorios Spring Data, queries dinámicas (Specifications) | Contener reglas de negocio; depender de `presentation`/`service` |
| Infraestructura | `infra.config`, `infra.security`, `infra.storage`, `infra.mail` | Adaptadores técnicos: configuración del framework, seguridad, S3, mail | Contener lógica de negocio |
| Común | `common` | Utilidades transversales y tipos compartidos | Depender de un dominio |

**Reglas de oro:**
- La **lógica de negocio vive en `service.<dominio>`**, no en `infra` (infra = solo técnico).
- `presentation` **nunca** importa de `persistence` (ni entidades ni repositorios). Habla con `service`.
- Las **entidades JPA no salen de `persistence`... ni de `service`**: el service las convierte a **records propios** (views: `UserView`, `AuthResult`) y `presentation` traduce esos records a DTO. Ver §6.
- `infra` (config/security) **sí** puede cablear servicios: es el composition root (por eso ArchUnit no restringe `infra → service`).
- Los controllers son **delgados**: sin lógica; orquestan y delegan.
- Un `<dominio>` (capacidad) tiene su paquete `service.<dominio>` (ver granularidad de capacidades en `docs/vision.md §5`).

---

## 2. Convenciones de nombres

- **Idioma**: identificadores en **inglés** (convención Java); Javadoc/comentarios en español. Dos canales de mensajes, que **no se mezclan**:
  - **Mensajes al usuario** (el `message` de una `BusinessException`, que es el `detail` HTTP, §10): **en español**, aptos para mostrarse tal cual.
  - **Logs operativos**: en español, estables y con contexto (ids), **sin** contraseñas, tokens, secretos ni PII (§13). No reutilices el mensaje del usuario como log.
  Elige un idioma para los términos de dominio y sé consistente en todo el backend.
- Clases/Interfaces: `PascalCase`. Métodos/variables: `camelCase`. Constantes: `UPPER_SNAKE_CASE`. Paquetes: `minúscula.sin.guiones`.
- **Sufijos por rol** (obligatorios):

| Elemento | Sufijo | Ejemplo |
|---|---|---|
| Controller | `Controller` | `AppointmentController` |
| Service | `Service` — **clase concreta por defecto**; interfaz + `ServiceImpl` **solo** cuando exista una segunda implementación real | `AppointmentService` |
| Repositorio | `Repository` | `AppointmentRepository` |
| Entidad | — (sustantivo) | `Appointment` |
| DTO | `Request`/`Response` | `RegisterRequest`, `UserResponse` |
| Record del servicio (view/command) | `View`/`Command`/sustantivo | `UserView`, `RegisterCommand`, `AuthResult` |
| Specification | `Specification`/`Specs` | `AppointmentSpecifications` |
| Excepción | `Exception` | `AppointmentNotFoundException` |

---

## 3. SOLID y DRY (aplicado a Spring)

- **SRP**: una clase, una razón de cambio. El controller enruta, el service decide, el repository persiste.
- **OCP/DIP**: depende de **abstracciones** donde aporten. Regla del proyecto (§2): service como **clase concreta por defecto**; extrae la interfaz **cuando aparezca la segunda implementación**, no de forma especulativa.
- **ISP**: interfaces pequeñas y enfocadas.
- **DRY**: centraliza validación/reglas repetidas en el service o en validadores; no dupliques mapeos (una sola factoría `from(...)` por DTO, §6).

---

## 4. Inyección de dependencias

- **Siempre por constructor** con campos `final`. **Prohibida** la inyección por campo (`@Autowired` en atributos).
- Se usa Lombok `@RequiredArgsConstructor` para la inyección por constructor. Se permiten **constructores explícitos** cuando existan variantes legítimas para tests, factories o compatibilidad, siempre que Spring use un **único constructor inequívoco** (p. ej. `AuthService`: uno público con `@Autowired` para Spring y otro de paquete para tests). No se refactoriza código solo para cumplir esta preferencia.

```java
@Service
@RequiredArgsConstructor
public class AppointmentService {
    private final AppointmentRepository repository;
}
```

---

## 5. Controllers y diseño de API REST

- **Rutas vigentes**: la autenticación se expone bajo **`/auth/*`** (pública, `PublicPaths`). Los **recursos de negocio nuevos** van bajo `/api/<recurso>`, en plural y kebab/lowercase: `/api/appointments`, `/api/appointments/{id}` (privados salvo que se añadan a `PublicPaths`). Mover `/auth` a `/api/auth` sería un change explícito de migración de API (contrato, cliente, seguridad, cookie), no una limpieza.
- Métodos HTTP correctos: `GET` (leer), `POST` (crear), `PUT`/`PATCH` (actualizar), `DELETE` (borrar).
- Status codes correctos: `200/201/204`, `400/401/403/404/409`, `500`. Usa `ResponseEntity<T>`.
- **Nunca** recibir/retornar entidades JPA: usa DTOs (`*Request` entrada, `*Response` salida).
- Validación de entrada con `@Valid` sobre el DTO.
- Documenta con **springdoc-openapi** (`@Operation`, `@ApiResponse`; reglas en §10.2). Swagger UI y `/v3/api-docs` se habilitan con **`SWAGGER_ENABLED`**, **apagada por defecto** (`springdoc.*.enabled: ${SWAGGER_ENABLED:false}`): un despliegue que no configure nada no expone la documentación (`404`). En local, `SWAGGER_ENABLED=true` en `secrets.properties`. Los tests que leen `/v3/api-docs` la activan con `@TestPropertySource(properties = "SWAGGER_ENABLED=true")`; un IT nuevo que la olvide falla con `404`. El contrato versionado (`contracts/openapi.json`) no depende de ella.

```java
@RestController
@RequestMapping("/api/appointments")
@RequiredArgsConstructor
public class AppointmentController {
    private final AppointmentService service;

    @PostMapping
    public ResponseEntity<AppointmentResponse> create(@Valid @RequestBody CreateAppointmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(service.create(request));
    }
}
```

### 5.1 Paginación

Patrón real: `UsersController.listUsers` → `UserAdminService.list(pageable)` → `JpaRepository.findAll(pageable)`.

- **`page` y `size` explícitos** (`@RequestParam`, `page` base 0 con `@Min(0)`, `size` con `@Min(1)` y por defecto **20**), y el **orden fijo en el servidor** (`PageRequest.of(page, size, Sort.by("id"))`). **No** recibas un `Pageable` del cliente: con él podría mandar `sort` por cualquier propiedad de la entidad (p. ej. `sort=passwordHash`, que revelaría el orden de los hashes) o por una inexistente (500). Si un listado necesita ordenar por columnas, acepta una **lista cerrada** (enum) y tradúcela en el servidor.
- **Tope de `size` = 100**: un valor mayor se **recorta** (`Math.min`) y la respuesta devuelve el `size` aplicado. `page`/`size` inválidos → `400`.
- **Nunca** devuelvas `Page<T>` de Spring Data: envuelve en `PageResponse<T>` (`presentation.dto.PageResponse`: `content`/`page`/`size`/`totalElements`/`totalPages`/`last`, con `PageResponse.from(page.map(XResponse::from))`). springdoc publica el genérico como un schema concreto (`PageResponseUserSummaryResponse`); declara `produces = application/json` en el `@GetMapping` para que la respuesta inferida no salga como `*/*`.
- Una página posterior a la última devuelve `content` vacío con los totales, **sin error** (el frontend ofrece volver a la anterior).
- Los elementos son DTOs con los campos **exactos** que necesita la pantalla (p. ej. `UserSummaryResponse`: `id`, `email`, `fullName`, `role`, `status`): nunca entidades JPA ni campos internos.

---

## 6. DTOs, validación y mapeo

- **DTOs** preferentemente `record` (inmutables). Separa entrada (`*Request`) de salida (`*Response`).
- **Bean Validation** en los `*Request`: `@NotNull`, `@NotBlank`, `@Email`, `@Size`, `@Positive`, etc. La validación de **formato** vive en el DTO; la de **reglas de negocio** en el service.
- **Mapeo en dos saltos, sin clases `Mapper`** (patrón del proyecto; MapStruct **no** está en el pom):
  1. El **service** mapea entidad → **record propio del servicio** (view: `UserView`, `AuthResult`; entrada compleja: `RegisterCommand`). Las entidades JPA no salen de ahí.
  2. **`presentation`** traduce ese record a DTO con una **factoría estática** `Response.from(view)` en el propio DTO (así lo hacen `UserResponse`, `AuthResponse`...).

  Ni el controller conoce entidades, ni el service conoce DTOs — es lo que vigila ArchUnit.
- **Paridad con el frontend**: las restricciones de **formato** de cada `*Request` (longitud, patrón, rango, requerido) deben reflejarse en el schema Zod del formulario correspondiente. El backend es la barrera definitiva; el frontend evita `400` de formato innecesarios. Política y tabla de correlación en `docs/coding-style.md §7`.

```java
public record CreateAppointmentRequest(
    @NotNull Long customerId,
    @NotNull @Future Instant scheduledAt,   // instante → Instant, nunca LocalDateTime (§8.2)
    @Size(max = 500) String notes
) {}
```

---

## 7. Services

- Contienen la **lógica de negocio** y orquestan repositorios/otros services.
- **Transaccionalidad**: `@Transactional` en métodos de escritura; `@Transactional(readOnly = true)` en lecturas. Preferir el límite transaccional en el service, no en el controller.
- Lanzan excepciones de dominio (§10) cuando una regla no se cumple.

---

## 8. Persistencia (JPA / Spring Data)

- **Entidades**:
  - No usar Lombok `@Data`/`@EqualsAndHashCode` por defecto en entidades (rompe con lazy loading y colecciones). Usa `@Getter/@Setter` puntuales; `equals/hashCode` basados en la clave de negocio o en el id con cuidado.
  - Relaciones **LAZY** por defecto; carga explícita con `@EntityGraph` o *fetch join*.
  - Nombres de tabla/columna definidos por Flyway; las anotaciones reflejan el esquema (no lo generan).
- **Repositorios**: interfaces `JpaRepository<Entity, Id>`. Consultas derivadas por nombre cuando sean simples; `@Query` para casos concretos.
- **Queries dinámicas**: usa `JpaSpecificationExecutor` + clases en `persistence.specification` (no concatenar strings de JPQL).
- **Rendimiento**: evita N+1 (fetch joins/`@EntityGraph`), selecciona solo lo necesario (proyecciones/DTO projections), pagina con `Pageable`.

---

## 8.1 Multi-tenancy — no aplica (plantilla single-tenant)

Esta plantilla es para **una sola empresa**: no hay organizaciones, `organization_id` ni Row-Level Security. Las reglas de aislamiento (`@TenantId` + RLS, contexto de tenant, async, tests de aislamiento) de la **plantilla multi-tenant planificada** están conservadas en `docs/future/multi-tenant-template.md`.

---

## 8.2 Fechas y zonas horarias — todo en UTC

La app se ve desde cualquier país: **ningún instante se representa con la zona horaria del
servidor**. Regla, ya vigente de facto en el código (`createdAt`/`updatedAt`/`expiresAt` en
`User`, `RefreshToken`):

- **Instante** (un momento concreto en el tiempo — cuándo se creó un registro, cuándo vence un
  token, cuándo empieza una cita) → Java `Instant` + columna Postgres `TIMESTAMPTZ`.
  `TIMESTAMPTZ` normaliza y guarda en UTC sin importar la zona de la sesión; `Instant` es UTC por
  definición. Genera el valor con `Instant.now()`.
- **Prohibido `LocalDateTime`** para representar un instante: no lleva zona, es ambiguo apenas hay
  más de un huso horario en juego (justo el caso de este SaaS). El ejemplo de `CreateAppointmentRequest`
  en §6 usa `Instant` por esto.
- **Fecha de calendario sin hora** (cumpleaños, p. ej. `Customer.birthDate`) → Java `LocalDate` + columna
  `DATE`. No es un instante — es una fecha civil, no lleva ni necesita zona horaria.
- **Presentación**: Jackson serializa `Instant` a ISO-8601 con sufijo `Z` (UTC) automáticamente, sin
  anotar nada. La conversión a la hora local del usuario es responsabilidad del **frontend**, nunca
  del backend.

---

## 8.3 Concurrencia — bloqueo optimista (`@Version`)

Hoy **ninguna entidad lo usa** (no hace falta: los flujos actuales no tienen edición concurrente
real). Regla para cuando aparezca una que sí — candidatas previsibles: `appointments` (agenda
compartida por recepción/dentista) o cualquier entidad de facturación:

- Añade `@Version private Long version;` en la entidad + columna `version BIGINT NOT NULL DEFAULT 0`
  en su migración. Hibernate la gestiona sola: incrementa en cada `UPDATE` y lanza
  `ObjectOptimisticLockingFailureException` si la fila cambió entre lectura y escritura.
- Esa excepción se mapea a **`409`** en `GlobalExceptionHandler` (§10) el día que se introduzca el
  primer `@Version` — no antes (no hay nada que mapear todavía).
- No lo añadas de forma especulativa a entidades sin edición concurrente real: es ruido y una
  fuente de `409` que nadie espera.

---

## 8.4 Modelado de dominio — conjuntos cerrados y formatos

Estándar para toda capacidad nueva, **antes** de escribir la migración:

- **Conjunto cerrado de valores → enum, nunca `String` libre.** Se refleja en **tres** sitios para
  que el frontend lo herede: enum Java en la entidad, `CHECK` en la migración, y el enum aparece en
  el contrato OpenAPI (springdoc lo infiere del tipo Java). Ejemplo real: `Role` (`ADMIN`/`USER`);
  otros típicos: `DocumentType`, `Status`.
- **Nunca tipo numérico para identificadores con formato** (documento, teléfono): pierden ceros a la
  izquierda y los pasaportes son alfanuméricos. `VARCHAR` + validación de formato explícita (Bean
  Validation o un validador propio, p. ej. `@ValidDocument`).

---

## 8.5 `Optional` y valores ausentes

- **Sí**: `Optional<T>` como **tipo de retorno** de un método de repositorio o service que busca
  **un único resultado que puede no existir** (`findByEmail`, `findBySlug`, `findByTokenHash`) — es
  la convención de Spring Data y ya la sigue todo el código.
- **No**: `Optional` como **parámetro** de método, como **campo** de entidad/DTO/record, ni
  envolviendo una **colección** (`Optional<List<T>>` — usa lista vacía).
- Un `Optional` vacío que representa "no encontrado" en un flujo de negocio se traduce a la
  excepción de dominio correspondiente (p. ej. `CustomerNotFoundException`, §10) **en el service** — no
  propagues el `Optional` hasta `presentation`.

---

## 8.6 Auditoría de autoría (`createdBy`/`updatedBy`)

`created_at`/`updated_at` dicen **cuándo** cambió un registro, no **quién** lo cambió. Regla para
toda entidad de negocio nueva (trazabilidad, `docs/vision.md §1`):

- Columnas `created_by BIGINT REFERENCES users(id)` y `updated_by BIGINT REFERENCES users(id)` junto
  a `created_at`/`updated_at` en la migración.
- Campos `@CreatedBy`/`@LastModifiedBy` (Spring Data JPA Auditing) en la entidad, con
  `@EntityListeners(AuditingEntityListener.class)` — **no confundir con** `@CreationTimestamp`/
  `@UpdateTimestamp` (Hibernate nativo), que es lo que ya rellena `created_at`/`updated_at` hoy: son
  **dos mecanismos distintos**. `@CreationTimestamp` no sabe quién hizo el cambio, solo cuándo.
- Habilitar `@EnableJpaAuditing` (`infra.config`) con un `AuditorAware<Long>` que lee el `userId`
  del `SecurityContextHolder` — `JwtAuthenticationFilter` ya lo deja en los `details` de la
  `Authentication`; el `AuditorAware` es un adaptador fino sobre algo que ya existe.
- Caso límite: sin petición autenticada (p. ej. el registro en `service.auth`, o un job de sistema)
  no hay `Authentication` — el `AuditorAware` debe devolver `Optional.empty()` ahí, no lanzar.

---

## 9. Migraciones (Flyway)

- Única fuente del esquema: `spring.jpa.hibernate.ddl-auto=none`. Hibernate **no** crea ni altera tablas.
- Migraciones en `src/main/resources/db/migration`, nombre `V<n>__descripcion_snake.sql` (p. ej. `V1__init.sql`, `V2__add_appointments.sql`).
- Una migración **aplicada es inmutable**: nunca la edites; crea una nueva.
- Revisar cada script antes de mergear.

---

## 10. Manejo de errores — RFC 9457 (Problem Details)

**Estándar del proyecto**: todos los errores se devuelven como **`ProblemDetail` (RFC 9457)**, el tipo nativo de Spring Boot 3/4. No se crean DTOs de error propios.

- **Activación nativa**: `spring.mvc.problemdetails.enabled=true` en `application.yml`. Con esto, las excepciones propias de Spring MVC (404, 405, JSON malformado, etc.) ya responden en formato ProblemDetail.
- **Handler centralizado**: un único `@RestControllerAdvice` que **extiende `ResponseEntityExceptionHandler`** (para conservar el status de las excepciones de Spring y no convertirlas en 500). Vive en `presentation` (`GlobalExceptionHandler`).
- **Excepciones de negocio**: heredan de una base `service.BusinessException` que lleva el `HttpStatus` y un `errorType` (slug). Un solo `@ExceptionHandler(BusinessException.class)` las mapea a ProblemDetail — no hace falta un handler por excepción. Ejemplos: `EmailAlreadyExistsException` (409), `InvalidCredentialsException` (401).
- **`type` relativo**: `/errors/<errorType>` (agnóstico al entorno; nada de URLs absolutas por dominio). Usa `about:blank` solo si no aplica un tipo.
- **Extensiones**: se añaden `timestamp` (Instant) y `traceId` a cada error. El `traceId` lo genera un `TraceIdFilter` (en `infra.config`) que lo registra en el **MDC** (aparece en todos los logs de la petición) y lo devuelve en la cabecera `X-Trace-Id`. Así un error en producción es rastreable de punta a punta.
- **Validación (`@Valid`) → 400**: se sobrescribe `handleMethodArgumentNotValid` para incluir la extensión `errors` (lista de `{field, message}`).
- **Errores inesperados → 500**: red de seguridad `@ExceptionHandler(Exception.class)` que **loguea el stacktrace con el traceId** y responde un ProblemDetail genérico. **Nunca** se filtran stack traces ni detalles internos en la respuesta.

Ejemplo de respuesta (validación):
```json
{
  "type": "/errors/validation-error",
  "title": "Validation failed",
  "status": 400,
  "detail": "Uno o más campos son inválidos.",
  "errors": [{ "field": "password", "message": "La contraseña debe tener al menos 8 caracteres" }],
  "timestamp": "2026-07-03T12:34:56Z",
  "traceId": "a1b2c3d4"
}
```

> El `Content-Type` es `application/problem+json`. El contrato OpenAPI los documenta (`ApiProblem`/`ValidationProblem`, §10.2) y el frontend los tipa con el modelo generado (`core/utils/apiError.ts`).

---

### 10.1 Un único formato de error — sin excepciones

**Regla dura: todo error sale de `GlobalExceptionHandler` con el mismo `ProblemDetail` (RFC 9457)** — `type`, `title`, `status`, `detail` en español, `timestamp` y `traceId` (el mismo valor que la cabecera `X-Trace-Id`). Requirement "Formato uniforme de error en toda la API" (`api-type-contracts`). No hay DTO de error propio ni fábrica aparte: cada handler construye su `ProblemDetail` nativo y llama a `addExtensions` (`timestamp` + `traceId` del MDC).

Cómo llega cada origen de error:

| Origen | Dónde se resuelve | `detail` |
|---|---|---|
| Excepción de negocio (`BusinessException`) | `handleBusiness` | el de la excepción (`type` `/errors/<errorType>`) |
| `@Valid` → 400 | `handleMethodArgumentNotValid` (+ extensión `errors`) | "Uno o más campos son inválidos." |
| 401 sin sesión / 403 (`@PreAuthorize` o regla de ruta) | `handleAuthentication` / `handleAccessDenied`: el `authenticationEntryPoint` y el `accessDeniedHandler` de `SecurityConfig` **delegan en el `HandlerExceptionResolver`** (nunca `sendError()`, §11.0a) | curado en español |
| Lo que Spring MVC resuelve por su cuenta (JSON malformado, 404, 405, 406, 413, 415, 503, `ResponseStatusException`…) | `handleExceptionInternal` | mapa `DEFAULT_DETAILS` status → mensaje; fuera del mapa, `GENERIC_DETAIL` |
| Cualquier otra excepción → 500 | `handleUncaught` (loguea stacktrace + `traceId`) | "Ocurrió un error inesperado." |

**`handleExceptionInternal`** reutiliza el `ProblemDetail` que construye el padre (conserva `title`, `status` e `instance`), sustituye su `detail` interno en inglés (p. ej. `"Failed to read request"`) y añade `timestamp`/`traceId`. Spring deja esos errores con `type = about:blank` y lo **omite** al serializar: se reemplaza por `/errors/<status>` (`/errors/bad-request`, `/errors/not-found`…). Es un **fallback por status, no por tipo de excepción**: dos excepciones con el mismo status comparten mensaje a propósito.

**Alcance** (lo dice el requirement): errores que pasan por Spring MVC, por estos handlers o por Spring Security vía `HandlerExceptionResolver`. Un error antes del `DispatcherServlet`, en un filtro que no delega, con la respuesta ya comprometida o del contenedor **no** tiene este formato. Nunca serialices un error a mano en un filtro: delega en el `HandlerExceptionResolver`.

⚠️ **Regla para cualquier `@ExceptionHandler` nuevo o método del framework sobrescrito**: queda **fuera** del mapa de `handleExceptionInternal`, así que debe dar su propio `detail` en español y llamar a `addExtensions` — como `handleBusiness`, `handleAuthentication`, `handleAccessDenied`, `handleUncaught` y `handleMethodArgumentNotValid`. Si no, filtra el mensaje interno del framework al usuario (el frontend pinta `detail` tal cual en un toast, `getUserFriendlyError`).

Lo fijan `ErrorContractIT` (contexto completo: 400/404/405/415, negocio, 401 con formato completo y `traceId == X-Trace-Id`) y `ErrorFallbackTest` (mapa completo, fallback genérico, 500), comparando contra la respuesta real y con el `detail` exacto de la aplicación.

### 10.2 Documentar una operación en el contrato

El contrato OpenAPI es la **fuente única de verdad** (capacidad `api-type-contracts`): el frontend deriva de él sus tipos, y `ContractDriftIT` **rompe la build** si el contrato no refleja el backend.

Los errores se documentan con dos schemas de **solo documentación** (`presentation.dto`): `ApiProblem` (`type`, `title`, `status`, `detail`, `timestamp` obligatorios; `instance`, `traceId` opcionales) y `ValidationProblem` (los mismos + `errors[]` de `FieldProblem`), servidos como `application/problem+json`. En runtime el cuerpo sigue siendo el `ProblemDetail` de §10.1; `OpenApiContractIT` vigila que ambos no diverjan.

**Lo que NO tienes que escribir** — los errores transversales se inyectan solos (`infra.config.OpenApiErrorsConfig`, idempotente: nunca reemplaza una respuesta que declares):

| Respuesta | Se añade sola cuando… |
|---|---|
| `500` | siempre |
| `401` | la ruta **no** es pública según `infra.security.PublicPaths` (la misma lista que usa `SecurityConfig`) |
| `403` | el método o su clase llevan `@PreAuthorize` (también como meta-anotación). `@Secured`/`@RolesAllowed` no cuentan: `@EnableMethodSecurity` no los activa |

**Lo que SÍ tienes que declarar** en cada operación (solo tú lo sabes):

- **`@Operation(operationId = "...")`** estable: orval nombra así la función del cliente.
- **El status de éxito, siempre**, con su schema: `@ApiResponse(responseCode = "201", content = @Content(mediaType = "application/json", schema = @Schema(implementation = XResponse.class)))`. Un `204` va **sin `content`**. Los controllers devuelven `ResponseEntity`, así que springdoc no puede inferir el status real, y ⚠️ al declarar cualquier `@ApiResponse` deja de inferir el de éxito. `OpenApiContractIT` **falla** si un handler de `com.odontorisas` no declara un `@ApiResponse` `2xx`.
- El **`400`** (`ValidationProblem`) donde haya `@Valid`, el **`409`** de conflicto, y el `401` **semántico** de rutas públicas (p. ej. credenciales inválidas), todos con `@Content(mediaType = MediaType.APPLICATION_PROBLEM_JSON_VALUE, schema = @Schema(implementation = ApiProblem.class))`. Los `404`/`405`/`415` de protocolo no se declaran (su formato lo garantiza §10.1).

Tras tocar la API: regenera `contracts/openapi.json` **y** el cliente del frontend. No hace falta levantar la aplicación (necesita Docker, como los demás `*IT`):

```bash
cd modules/backend
./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -Dcontract.update=true
cd ../frontend
pnpm generate:api
```

El modo `-Dcontract.update=true` escribe el documento que publica `/v3/api-docs` con el formato de `JSON.stringify(doc, null, 2)` (UTF-8, salto de línea final) y **conserva el `servers`** del archivo. Sin esa propiedad, el mismo comando solo **comprueba**; si falla, lista las rutas JSON que difieren. No exportes el contrato a mano con `curl` ni lo pases por scripts: un `curl | python` en Windows lo dejó doble codificado (cp1252).

## 11. Seguridad

- **Spring Security + JWT** (`com.auth0:java-jwt`). Configuración en `infra.security`.
- Contraseñas con hashing fuerte (BCrypt). **Nunca** en texto plano ni en logs.
- Autorización por rol (`ADMIN`/`USER`) con seguridad a nivel de método (`@PreAuthorize`) y/o `SecurityFilterChain`.
- **Sin secretos en el código ni en git**: viven en `secrets.properties` / variables de entorno (ignorados), con `secrets.properties.example` versionado (§12).
- Validar y sanear toda entrada; los DTOs + Bean Validation son la primera barrera.
- **`@EnableMethodSecurity`** en `SecurityConfig`: sin esto, un `@PreAuthorize` en un método no
  enforza nada — la anotación se ignora en silencio, sin error al arrancar ni al llamar.

### 11.0a Errores de autenticación/autorización con el mismo formato que el resto

El `authenticationEntryPoint` (401, sin sesión) y el `accessDeniedHandler` (403, `@PreAuthorize`
o regla de ruta) **delegan en el `HandlerExceptionResolver`** de MVC en vez de `response.sendError()`.
Así ambos casos llegan a `GlobalExceptionHandler` (`handleAuthentication`/`handleAccessDenied`) y
salen con el mismo `ProblemDetail` (RFC 9457: `type`, `title`, `status`, `detail`, `timestamp`,
`traceId`) que cualquier otro error de la API — `sendError()` devuelve el cuerpo por defecto del
contenedor, con una forma distinta que el contrato no puede describir con el mismo schema.

### 11.0b Secreto de firma de los tokens (`JWT_SECRET`)

`app.security.jwt.secret` (`${JWT_SECRET}`, sin default) firma los access tokens con HMAC-256. Sin él, Spring **no falla solo**: deja el placeholder sin resolver y el secreto valdría el literal `${JWT_SECRET}` (público: cualquiera podría firmar un token de `ADMIN`). Por eso **la app no arranca** si el secreto es inseguro (`JwtSecretRules`, capacidad `authentication`):

- ausente, vacío o en blanco; con un placeholder sin resolver (`${…}`); igual al valor de `secrets.properties.example`; o de **menos de 32 bytes** en UTF-8 (mínimo para HMAC-256).
- La validación vive en el **constructor de `TokenService`**, no en el binding de `SecurityProperties`: un fallo de binding lo describe el `BindFailureAnalyzer` de Boot con "Value: …" y **imprimiría el secreto** en el log de arranque. Ningún mensaje de `JwtSecretRules` incluye el valor (lo fijan `JwtSecretStartupTest` y `JwtSecretStartupOutputTest`, que captura la salida real del arranque).
- Tests: `AbstractIntegrationTest` registra `TEST_JWT_SECRET` con `@DynamicPropertySource` (máxima precedencia: gana a `secrets.properties`, a `JWT_SECRET` y a `-D…`). Nunca imprimas un secreto en un test: compáralo por hash (`JwtSecretHermeticityIT`).

### 11.0c Cuentas deshabilitadas (capacidad `users`)

`users.status` (`ACTIVE`/`DISABLED`, `UserStatus`) es un estado **administrativo**, independiente del bloqueo temporal (`locked_until`). Solo un `ADMIN` lo cambia, y solo en cuentas `USER` (`/api/users/{id}/status`; sobre una `ADMIN` → `409`).

- **Login** (`AuthService.login`): el bloqueo por intentos se comprueba antes y gana; una contraseña incorrecta cuenta el fallo **también** si la cuenta está deshabilitada; solo con la contraseña **correcta** una cuenta `DISABLED` recibe `403` `/errors/account-disabled`, **sin tocar el contador**. El reset condicional exige `status = 'ACTIVE'`: si la cuenta se deshabilita durante el login, afecta 0 filas y **nunca** se emiten tokens.
- **Al deshabilitar** (`UserAdminService.changeStatus`, con la fila bloqueada: `PESSIMISTIC_WRITE`): sus refresh tokens se **revocan** (no se borran) en la misma transacción. Así el refresh aún los encuentra y responde `403` explicativo; reactivar no los restaura (hay que volver a entrar).
- **Refresh** (`AuthService.refresh`): si la cuenta está `DISABLED` → `403` antes de comprobar revocado/expirado, sin escribir nada. La lectura del token es **sin bloqueo** pesimista (no añadas `FOR UPDATE`).
- La sesión abierta de una cuenta deshabilitada termina como tarde al caducar su access token (`JWT_ACCESS_TTL`, 15 min): el filtro JWT es stateless y no consulta la BD (ventana aceptada).

### 11.0 Bloqueo de login por intentos fallidos

Tras `app.auth.lockout.max-attempts` fallos consecutivos (por defecto 5) la cuenta queda bloqueada `app.auth.lockout.window` (ISO-8601, por defecto `PT15M`). Config inválida (`max-attempts < 1`, ventana ≤ 0 o malformada) = la app **no arranca** (`LoginLockoutProperties`). Estado en `users.failed_login_attempts` / `users.locked_until`, mapeados **solo lectura** en `User`.

Reglas que no se tocan sin revisar el change `add-login-lockout`:

- **`AuthService.login` NO es `@Transactional`.** Cada paso tiene su transacción corta: con una transacción envolvente, cada fallo ocuparía dos conexiones (la del login + la del registro del fallo) y unos pocos fallos simultáneos —un ataque— agotarían el pool.
- **Orden**: buscar por correo → si `locked_until` está vigente, 401 **sin BCrypt y sin tocar el contador** → contraseña incorrecta: registrar el fallo (`LoginAttemptService`, `REQUIRES_NEW`) y 401 → éxito: reset condicional + emisión de tokens en **una** transacción.
- **Contador**: solo con los `UPDATE` atómicos de `UserRepository` (nunca leer-incrementar-guardar). En SQL nativo, los parámetros `Instant` van con `CAST(:x AS timestamptz)`: dentro de un `CASE` PostgreSQL los recibe como `text`.
- **Reset condicional**: si el reset afecta 0 filas (otra petición bloqueó la cuenta durante BCrypt), 401 y no se emiten tokens.
- **Respuesta indistinguible**: correo inexistente, contraseña incorrecta y cuenta bloqueada lanzan la misma `InvalidCredentialsException` (mismo status, `type`, `title`, `detail`). Solo el log del servidor (`WARN` con id de usuario) dice que era un bloqueo.
- Un futuro **bloqueo manual de admin** irá en otro campo: el bloqueo automático expira; si compartieran campo, expirar la ventana reactivaría una cuenta bloqueada a mano. Un rechazo por ese estado (con contraseña correcta) no tocará el contador.

### 11.1 Actuator — superficie expuesta

`spring-boot-starter-actuator` está en el `pom.xml`. Configuración real (`application.yml`):
`management.endpoints.web.exposure.include: health,info` — **explícito**, no el default del
framework (que además solo trae `health`; aquí se sumó `info` a propósito). No amplíes esa lista sin
decidir a la vez si el endpoint nuevo queda público o autenticado (siguiente punto).

- **Solo `/actuator/health/**` y `/actuator/info` son públicos** (`PublicPaths` — fuente única
  compartida por `SecurityConfig` y el customizer de OpenAPI; `PublicPathsTest` fija que su
  `matches` decide igual que Spring Security). Cualquier otro endpoint de actuator cae bajo
  `anyRequest().authenticated()`: no hay excepción salvo esas dos rutas.
- ⚠️ **`management.endpoint.health.show-details: always`** combinado con que `/actuator/health/**`
  es **público** significa que el detalle de salud (estado de cada *health indicator*: BD, disco...)
  lo ve cualquiera sin autenticar. Es una decisión consciente, no un descuido — pero si algún día un
  *health indicator* propio expone algo sensible (nombre de host interno, versión de dependencia),
  hay que revisar si sigue mereciendo `always` en una ruta pública o si baja a `when-authorized`.
- Antes de exponer un endpoint nuevo de actuator (`/env`, `/beans`, `/httptrace`...): añádelo a
  `exposure.include` **y** decide explícitamente si entra en `PublicPaths` — nunca por omisión. Si
  se expone `/env`, revisa que no filtre `app.security.jwt.secret` ni credenciales de BD.

### 11.2 CORS

Configurado en `SecurityConfig.corsConfigurationSource`; orígenes desde
`app.security.cors.allowed-origins` (externalizado, §12 — `http://localhost:5173` en local, por env
en despliegue).

- `allowCredentials(true)` porque el refresh token viaja en cookie `HttpOnly` (`RefreshCookieFactory`).
  **Regla dura**: con credenciales habilitadas, `allowedOrigins` **nunca** puede ser `*` — lista
  explícita de orígenes conocidos, siempre.
- ⚠️ **Gotcha de la spec CORS**: `allowedHeaders(List.of("*"))` **no actúa como comodín** en
  peticiones con credenciales — el navegador lo trata como el header literal `"*"`, no como "cualquier
  header". Si el frontend algún día añade un header custom (`X-Something`), el preflight fallará en
  silencio pese a que el código "dice" `*`. El día que haga falta, lista los headers explícitos en
  vez de depurar a ciegas.

---

## 12. Configuración

- **Configuración única** (sin perfiles `dev/qa/pro`). Un solo `application.yml` con placeholders `${VAR}` para **todos** los valores configurables.
- **Todo externalizado como secreto**: los valores se inyectan por variables de entorno; en local se cargan de `secrets.properties` (ignorado por git) vía `spring.config.import=optional:file:./secrets.properties`. Se versiona solo `secrets.properties.example`.
- **`JWT_SECRET`** es obligatorio en todo entorno: ≥ 32 bytes aleatorios (`openssl rand -base64 48`); sin él la app no arranca (§11.0b). Cambiarlo **invalida los access tokens emitidos** (dejan de verificar), pero **no cierra las sesiones**: el refresh token es opaco, se guarda hasheado en BD y no depende del secreto, así que el frontend renueva el access token de forma transparente. Si una rotación busca expulsar a todos (p. ej. secreto filtrado), hay que **revocar también los refresh tokens** (borrar `refresh_tokens`). Con **varias réplicas**, todas deben compartir el mismo secreto: una réplica con otro rechazaría los tokens de las demás.
- **`SWAGGER_ENABLED`** (por defecto `false`): documentación de la API (§5). `true` solo en local o en entornos donde se quiera exponer a propósito.
- **Nunca** hardcodear ni versionar URLs, credenciales ni parámetros de entorno sensibles.
- Tipar la configuración con `@ConfigurationProperties` (evitar `@Value` disperso).

---

## 13. Caché y logging

- **Caché**: Spring Cache + Caffeine. `@Cacheable`/`@CacheEvict` con nombres de caché explícitos; cachea solo lo que aporta (lecturas costosas y estables).
- **Logging**: SLF4J. Se prefiere Lombok `@Slf4j`; `LoggerFactory.getLogger(...)` es válido cuando la clase no usa Lombok o necesita un logger especial (el código actual lo usa). Mensajes en español (§2). Niveles adecuados (`info`, `warn`, `error`, `debug`). Log estructurado con contexto (ids), **sin** secretos ni datos personales (PII) de usuarios o clientes.

---

## 14. Lombok — uso recomendado

- **Sí**: `@RequiredArgsConstructor` (DI), `@Getter/@Setter` (DTOs mutables o config), `@Slf4j`, `@Builder` en DTOs.
- **Evitar**: `@Data`/`@EqualsAndHashCode`/`@ToString` en **entidades JPA**; `@ToString` con relaciones lazy.

---

## 15. Pruebas

No se duplica aquí: la estrategia (niveles, slices, **Testcontainers**, puente Scenario→test) está en **`docs/testing.md`**. Recordatorio operativo:
- Controller → `@WebMvcTest` (service mockeado). Seguridad → `+ spring-security-test`.
- Persistencia/Specifications/Flyway → `@SpringBootTest` acotado a Repository (no `@DataJpaTest`, ver `docs/testing.md §5.1`) + **Testcontainers (PostgreSQL)**.
- Nombre de test referenciando el scenario del spec; patrón AAA.
- `./mvnw -B verify` en verde (requiere Docker).

---

## 16. Workflow y calidad

- Commits: Conventional Commits en español (`docs/commits.md`).
- Antes de PR: `./mvnw -B verify` (compila + tests) en verde; sin warnings sin resolver.
- Ramas de feature pequeñas y enfocadas.

---

## 17. Checklist de pre-entrega (backend)

- [ ] ¿Lleva `created_by`/`updated_by` (§8.6), además de `created_at`/`updated_at`?
- [ ] ¿Respeta el flujo de capas (presentación no toca persistencia; entidades no salen de persistence ni de service — views §6)?
- [ ] ¿Controllers delgados y con DTOs (`*Request`/`*Response`), sin exponer entidades?
- [ ] ¿Validación de formato en DTO (Bean Validation) y de negocio en el service?
- [ ] ¿Inyección por constructor (`@RequiredArgsConstructor` o un único constructor explícito inequívoco, §4), sin inyección por campo?
- [ ] ¿Transaccionalidad correcta (`@Transactional`, `readOnly` en lecturas)?
- [ ] ¿Sin N+1 (fetch join/`@EntityGraph`), consultas dinámicas vía `Specification`?
- [ ] ¿Cambios de esquema como nueva migración Flyway (no editar aplicadas)?
- [ ] ¿Errores centralizados con formato consistente; sin secretos en logs?
- [ ] ¿Instantes en `Instant`/`TIMESTAMPTZ` (nunca `LocalDateTime`, §8.2)? ¿`LocalDate` solo para fechas de calendario sin hora?
- [ ] ¿Conjunto cerrado de valores como enum (app + `CHECK` + contrato, §8.4)? ¿Documento/teléfono como `VARCHAR`, nunca numérico?
- [ ] ¿Pruebas por scenario según `docs/testing.md`; `./mvnw verify` verde?
