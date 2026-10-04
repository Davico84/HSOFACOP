# Guía de Pruebas — HS FACOP

> **Propósito.** Definir la estrategia, estándares y reglas de pruebas del monorepo (backend + frontend).
> Cada capacidad, corrección o refactor se evalúa para elegir el nivel de prueba apropiado.
> Objetivo: **máxima confianza** en la estabilidad con el **mínimo coste** de mantenimiento.

Complementa a `docs/architecture.md` (stack) y a `openspec/` (specs). Aquí va el *cómo* se prueba; el *qué* se prueba nace de los **Scenarios** de cada spec.

---

## 0. Puente OpenSpec → Pruebas (regla central)

En este proyecto las pruebas **derivan de los `#### Scenario:` del spec**. No se inventan casos: se traducen escenarios.

- **Cada `#### Scenario:` (WHEN/THEN) ⇒ al menos un test.** El `WHEN` es el *arrange/act*; el `THEN`/`AND` son las *assertions*.
- El nombre del test **debe referenciar el scenario** para trazabilidad. Ej.: scenario "Migración inicial en base limpia" ⇒ `should_apply_flyway_migrations_on_clean_database` (back) o `it("aplica migraciones Flyway en base limpia", …)`.
- El **nivel** de la prueba (unit/componente/integración/e2e/slice) se elige con las matrices de §3 (front) y §5 (back) — siempre el nivel **más bajo** que valide el comportamiento con fidelidad.
- Un requirement se considera **cubierto** cuando todos sus scenarios tienen prueba verde. Esto es parte de la Definición de "listo".
- Al hacer `/opsx:apply`, las tareas de test de `tasks.md` deben mapear 1:1 (o más) con los scenarios del `spec.md` del change.

> Regla práctica: si un scenario no se puede convertir en una prueba automática, probablemente está mal redactado (ambiguo o no observable) → corrige el spec antes de codear.

---

## 1. Filosofía

Prioriza siempre el **nivel más bajo** capaz de validar el comportamiento.

```
Unit → Componente/Slice → Integración → E2E
```
- No escribas E2E si una prueba de Integración basta. No escribas Integración si una Unitaria basta.
- Principios **F.I.R.S.T.**: Fast, Independent, Repeatable (sin *flaky*), Self-validating, Timely.
- Patrón **AAA** (Arrange–Act–Assert) en todos los niveles.
- Probar **comportamiento**, no detalles de implementación.

---

## 2. Stack de pruebas

| Ámbito | Nivel | Herramientas |
| :--- | :--- | :--- |
| Frontend | Unit / Componente / Integración | Vitest + React Testing Library + MSW |
| Frontend | E2E | Playwright |
| Backend | Unit | JUnit 5 + Mockito |
| Backend | Slices | `@WebMvcTest` (controller, + `@EnableMethodSecurity` para seguridad) · `@SpringBootTest` acotado a Repository (no `@DataJpaTest` — ver §5.1) · `@SpringBootTest` (websocket, planeado — ver `docs/architecture.md §2`) |
| Backend | Integración / persistencia | **Testcontainers (PostgreSQL)** + Flyway |

Decisión del proyecto: **Testcontainers desde el inicio** (PostgreSQL real efímero), no H2 — garantiza paridad con producción. Requiere **Docker** local y en CI.

---

## 3. Frontend — matriz de decisiones

| Si el cambio afecta a… | Nivel |
| :--- | :--- |
| Funciones puras, helpers, formatters, mappers, validators | Unit |
| Zustand stores (acciones y lógica de estado) | Unit |
| Custom hooks lógicos puros | Unit |
| Componentes de UI reutilizables (botones, inputs) | Componente |
| Formularios, modales, tablas aisladas | Componente |
| Custom hooks de React Query (petición, caché) | Integración |
| Comunicación con la API (MSW) | Integración |
| Navegación y enrutamiento (Router) | Integración |
| Flujo de autenticación (login/logout) | Integración + E2E |
| Permisos por rol | Integración + E2E (frontend: integración con el router y los guards reales en `AppLayout.roles.test.tsx` y `sectionRoute.test.tsx`; **E2E de roles pendiente**: Playwright ya está instalado, faltan usuarios de prueba con rol en un backend de E2E) |
| Workflows CRUD completos | E2E |

### Utilidades del proyecto (frontend)
- **`renderWithProviders`** (`src/test/utils.tsx`): envuelve con `MemoryRouter` + `QueryClientProvider` (con `retry: false`). Úsalo en vez del `render` básico cuando el componente dependa de router o caché.
  > **Sesión: no es un provider.** Al ser Zustand no hay árbol que envolver — siembra el estado
  > directo con `useSessionStore.setState({ accessToken, user, status: "authenticated" })` antes de
  > renderizar (ver `LoginForm.test.tsx`, `guards.test.tsx`). **i18n**: pendiente, no adoptado
  > todavía (`docs/coding-style.md §4`, hook `useT` planeado) — se añade a `renderWithProviders`
  > cuando exista.
- **MSW** (`src/test/setup.ts`, `src/test/mocks/{handlers,server}.ts`): intercepta la red a nivel de servicio. Config `onUnhandledRequest: "error"` → toda petición no mockeada falla la prueba. Sobrescribe por test con `server.use(...)`.
- **Zustand**: limpia estado antes de cada test (`localStorage.clear()` + `useXStore.setState(estadoInicial)`), para evitar contaminación entre tests.

### Reglas de oro (RTL)
- Queries por prioridad: `getByRole`/`findByRole` → `getByLabelText` → `getByPlaceholderText` → `getByText`. Evita `querySelector`, `getElementById` y selección por clases CSS. `data-testid` solo como último recurso.
- Usa `@testing-library/user-event` (`const user = userEvent.setup()`), no `fireEvent`.
- Asíncrono: consultas `find*` + `await`, o `await waitFor(() => …)`. **Nunca** `setTimeout`/sleeps.
- No pruebes estilos puramente visuales (colores, márgenes, clases Tailwind) salvo que representen estado de negocio.

### Integración: hook de React Query + MSW
Usa `renderHook` con un `wrapper` que provea un `QueryClient` nuevo por test (con `retry: false`) + MSW + `waitFor` para esperar a que la query resuelva. Si el hook depende de sesión/router, usa los mismos providers que `renderWithProviders`.

---

## 4. Frontend — E2E (Playwright)

- Specs en `modules/frontend/e2e/`, **excluidos de Vitest** (`vitest.config.ts` los excluye explícitamente).
- Comandos: `pnpm test:e2e` (Chromium) · `pnpm test:e2e:ui` (interactivo). Primera vez: `pnpm exec playwright install chromium`.
- `playwright.config.ts` levanta el dev server y lo reutiliza si ya corre. Para entorno desplegado: `E2E_BASE_URL=... pnpm test:e2e`.
- **CI**: job `e2e-smoke` en `.github/workflows/frontend.yml`, instala Chromium y corre contra el dev server — **sin backend**.

- **Flujo real contra el backend**: los specs `e2e/*.backend.spec.ts` (p. ej. `records.backend.spec.ts`: registrarse → crear una historia clínica → llenar pasos → imprimir a PDF con `page.pdf()`) solo corren con `E2E_BACKEND=1 pnpm test:e2e` y el backend + PostgreSQL levantados en local. Se saltan en CI. Los que necesitan un `ADMIN` (p. ej. `quota.backend.spec.ts`) piden además `E2E_ADMIN_EMAIL` y `E2E_ADMIN_PASSWORD` de una cuenta ADMIN existente; sin ellas se saltan.

> [!IMPORTANT]
> **En CI los specs son "smoke", no CRUD real.** Cubren solo flujos que degradan con
> gracia **sin API** (`useSessionBootstrap` intenta un refresh, falla por red y cae a
> "no autenticado" → login), como `e2e/auth.smoke.spec.ts`: guard de rutas privadas,
> validación de formulario, navegación entre pantallas. **Pendiente** para un flujo
> E2E de CRUD real (login → crear un registro → verlo listado): estrategia de datos/entorno
> (usuario de prueba o seed reproducible) — necesitaría el backend + Postgres corriendo
> en CI. Hasta entonces, esos flujos de la matriz §3 se cubren **además** con
> Integración (MSW).
>
> **Gotcha ya resuelto**: `getByLabel("Contraseña")` es ambiguo en el login — el botón
> de mostrar/ocultar también matchea por su `aria-label` ("Mostrar contraseña" contiene
> "contraseña"). Usa `getByRole("textbox", { name: "Contraseña" })` para desambiguar.

---

## 5. Backend — matriz y slices

| Si el cambio afecta a… | Nivel / Anotación |
| :--- | :--- |
| Lógica de dominio, services, mappers, validadores | Unit (JUnit + Mockito) |
| Controllers (request/response, validación, status) | `@WebMvcTest` (service mockeado) — ver §5.1 |
| Seguridad / autorización por rol (`@PreAuthorize`) | `@WebMvcTest` + `@EnableMethodSecurity` + `spring-security-test` (`@WithMockUser`) — ver §5.1 |
| Repositorios / `Specification` / queries | Alcance de repositorio (solo `Repository`, sin pasar por el service) — ver §5.1, nota sobre por qué NO es `@DataJpaTest` |
| Migraciones Flyway | Integración + **Testcontainers** |
| WebSocket/STOMP | `@SpringBootTest` (websocket) |
| Flujo completo (controller→service→repo→BD) | `@SpringBootTest` + **Testcontainers** (los `*ControllerIT`, p. ej. `AuthControllerIT`) |

### 5.1 Dos capas para Controller/Repository — no una reemplaza a la otra

**Ambas conviven, cada una prueba algo distinto.** Los `*ControllerIT` (HTTP contra PostgreSQL
real) siguen siendo la fuente de verdad del comportamiento de negocio (aislamiento, conflictos
reales); los slices nuevos (`*ControllerTest`, sin sufijo `IT`) prueban la **forma** de la API
—status codes, validación, mapeo de excepciones a `ProblemDetail`, autorización por rol— rápido y
sin BD. Patrón: `CustomerControllerTest` (slice) junto a `CustomerControllerIT` (integración) —
mismo controller, capas distintas. *(Hoy solo existe `AuthControllerIT`; el slice de auth está pendiente.)*

**Convención de nombre**: `*Test` (sin `IT`) corre en `test` vía Surefire, no necesita Docker.
`*IT` corre en `verify` vía Failsafe, sí lo necesita.

**Piezas necesarias para un slice de Controller** (ninguna está incluida por defecto):
- Excluir `JwtAuthenticationFilter` del scan (`@WebMvcTest(..., excludeFilters = ...)`): es un
  `Filter` real, `@WebMvcTest` lo detecta e intenta construirlo — y necesita `TokenService`, que
  el slice no tiene. `@AutoConfigureMockMvc(addFilters = false)` no evita esto (solo evita que
  MockMvc lo *registre*; Spring igual intenta *crear* el bean).
- Para probar `@PreAuthorize`: importar un `@TestConfiguration` con solo `@EnableMethodSecurity`
  (la `SecurityConfig` real no se carga en el slice, así que sin esto el rol no se evalúa — un
  test de "no-admin" pasaría en falso) y usar `@WithMockUser(roles = "...")`, no un JWT real.

**Por qué `Repository`/`Specification` NO usa `@DataJpaTest`**: `@DataJpaTest` levanta H2 por
defecto, y eso contradice §2 (*"Testcontainers desde el inicio, no H2"*): un test verde contra H2
no garantiza el mismo comportamiento en PostgreSQL. Se usa `@SpringBootTest` (mismo patrón que el
resto de la suite) **acotado al repositorio** (sin pasar por el service) sobre Testcontainers.
Necesita Docker, así que corre como `*IT`, no `*Test` — el nombre sigue la convención de arriba.
Patrón: `CustomerSpecificationsIT`.

### Testcontainers (base de integración)
- Un único contenedor PostgreSQL reutilizable (patrón *singleton container*, `AbstractIntegrationTest`) para los tests de integración/persistencia.
- Perfil de test que **no** desactiva Flyway: las migraciones de `db/migration` se aplican sobre el contenedor limpio (así se ejerce el scenario "migración en base limpia").
- `ddl-auto=none` también en test: se valida que **Hibernate no altera** el esquema.
- Los slices que no tocan BD (`@WebMvcTest`, unit) **no** levantan contenedor → siguen siendo rápidos.
- **Clases `*IT`** (integración) corren en la fase `verify` vía **maven-failsafe-plugin**; los `*Test` (unit) en `test` vía surefire. Sin failsafe los `*IT` no se ejecutan.
- **`*IT` sin Docker se saltan limpios** (`disabledWithoutDocker=true`), no fallan — así que un `verify` "en verde" local no prueba nada si Docker no fue detectado. Gotcha ya resuelto: Testcontainers ≤ 1.21.3 habla la API Docker 1.32 y Docker Desktop reciente exige ≥ 1.40 → `BadRequestException (Status 400)` en `/info`, todos los `*IT` y tests con contenedor quedan **Skipped** y el build sale verde. Fix: Testcontainers ≥ 1.21.4 (`pom.xml`). **Revisa siempre que `Skipped: 0`** en la salida de `verify`.

> **Aislamiento entre organizaciones (multi-tenant):** no aplica a esta plantilla single-tenant. Los tests de aislamiento RLS obligatorios y sus trampas están en `docs/future/multi-tenant-template.md §2`.

### Una regla de arquitectura que nunca ha fallado no sabes si funciona
Dos lecciones que costaron caro y que ahora son estándar:

1. **Prueba que la regla falla.** Al escribir una regla de ArchUnit, introduce temporalmente la violación y comprueba que **rompe la build**. Si nunca la has visto fallar, no sabes si protege algo.
2. **Un importador roto deja la regla verde y vacía.** ArchUnit 1.3.0 no sabía leer el bytecode de Java 25 (*class file major 69*): fallaba **en silencio**, importaba **cero clases**, y el `allowEmptyShould(true)` daba por buenas todas las reglas. Estuvieron verdes meses **sin comprobar nada** — y al arreglarlo aparecieron violaciones de capas que llevaban ahí desde el principio. Por eso cada test de ArchUnit lleva ahora un **guardián del importador** (`the_importer_actually_reads_the_bytecode`) que falla si la lista de clases viene vacía.

### Convenciones (backend)
- Nombre de método de test orientado a comportamiento: `should_<resultado>_when_<condición>` (identificadores en inglés, propios de Java) y/o `@DisplayName` descriptivo en español referenciando el scenario.
- Estructura AAA con comentarios `// Arrange / // Act / // Assert`.
- Mockea la capa inmediatamente inferior: en tests de controller, mockea services; en tests de service, mockea repositorios. No uses conexiones reales en unit tests.
- Cubre por función: happy path + errores + edge cases + validación.

---

## 6. El contrato también se testea (y CI vigila las dos direcciones)

El contrato OpenAPI es la fuente única de verdad, así que **mentir en él es un bug**, y como tal se cubre con tests. Lo que aprendimos construyéndolo: **cada vez que se escribe el test que compara lo documentado contra lo real, aparece una mentira.** No basta con revisar el código: hay que **mirar el documento que el backend publica de verdad**.

| Test | Estado | Qué fija |
|---|---|---|
| `ContractDriftIT` | ✅ existe | 🛡️ **El guardián**: el contrato versionado refleja el backend actual (comparación semántica, ignora `servers`); expone registro/login/refresco; `RegisterRequest` refleja sus validaciones |
| `ContractJsonTest` (unit) | ✅ existe | El guardián también se prueba: serializador idéntico a `JSON.stringify` (fixture de oro generado con Node) y reglas de normalización/diff — **sin Docker** |
| `codegen-drift` (CI del front) | ✅ existe | Contrato → cliente generado |
| `ErrorContractIT` | ✅ existe | Formato **real** de los errores contra el backend completo (SecurityConfig, TraceIdFilter): 400 JSON malformado, 404, 405, 415, negocio y 401 con `type`/`title`/`status`/`detail` exacto en español/`timestamp` y `traceId == X-Trace-Id` |
| `ErrorFallbackTest` (unit, `@WebMvcTest`) | ✅ existe | Mapa status → mensaje completo, fallback genérico (418) y 500 sin mensaje interno — **sin Docker** |
| `OpenApiErrorsConfigTest` (unit) | ✅ existe | Reglas de los errores transversales del contrato: `500` siempre, `401` fuera de `PublicPaths`, `403` con `@PreAuthorize` (método, clase, meta-anotación), idempotencia — **sin Docker** |
| `PublicPathsTest` (unit) | ✅ existe | `PublicPaths.matches` decide igual que el matcher de Spring Security en los casos límite — **sin Docker** |
| `OpenApiContractIT` | ✅ existe | **Fidelidad** del documento publicado: status de éxito reales (sin `200` fantasma), errores con su schema y media type, `ApiProblem`/`ValidationProblem` sincronizados, `operationId` estables, cuerpos reales ⊆ schemas, y **ningún handler sin `@ApiResponse` de éxito** |
| `OpenApiTransversalErrorsIT` | ✅ existe | `401`/`403` transversales en el documento final (con un controller de `testsupport`) y la seguridad real coincide |

`OpenApiContractIT` **no sustituye** a `ContractDriftIT`: el primero verifica que lo que publica springdoc sea verdad; el segundo, que el snapshot versionado coincida con lo publicado. Los cuatro `*IT` de esta tabla necesitan Docker: verifica `Skipped: 0`.

Comprobar solo el contrato (necesita Docker; sin Docker se salta y **no prueba nada**, mira `Skipped`):

```bash
cd modules/backend
./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false
```

**Las dos direcciones del drift** — si falta una, el contrato puede mentir impunemente:

```
backend ──[ContractDriftIT, en el verify]──► contracts/openapi.json ──[codegen-drift, en el CI del front]──► cliente generado
```

Durante mucho tiempo **solo existía la segunda**, y aun con `ContractDriftIT` el contrato decía `200` donde la API devuelve `201`/`204` y no documentaba ni un error: `ContractDriftIT` vigila que el contrato refleje lo que springdoc publica, no que springdoc publique la verdad. Eso lo vigila `OpenApiContractIT`.

---

## 7. Cobertura

- La cobertura **no** es la meta; la confianza y la mantenibilidad sí. No infles números con tests triviales.
- Enfoca el esfuerzo en: lógica de negocio crítica (cálculos, permisos, validaciones), interacciones críticas y edge cases propensos a romperse.
- **Frontend**: `pnpm test:coverage` (`@vitest/coverage-v8`); informe HTML en `modules/frontend/coverage/` (ignorado). Sin umbral que rompa el build por ahora.
- **Backend**: JaCoCo vía `mvn verify` cuando se configure; sin umbral que rompa el build por ahora.
- Si en el futuro se exige un mínimo en CI, se configura en `coverage.thresholds` (Vitest) y en la regla de JaCoCo.

---

## 8. Requisitos en Pull Requests

Antes de abrir/fusionar un PR, garantizar:
1. `openspec validate <change> --strict` en verde (specs/change consistentes).
2. **Frontend**: `pnpm validate` (typecheck + lint + test) en verde.
3. **Backend**: `./mvnw -B verify` en verde (Docker disponible para Testcontainers).
4. Nueva funcionalidad incluye pruebas **según las matrices y los scenarios del spec**.
5. Sin *flaky tests*; sin `it.skip`/`@Disabled` en `main` sin justificación documentada.

> `pnpm validate` (front) y `./mvnw verify` (back) son la verificación local completa antes de subir.

---

## 9. Checklist para una nueva capacidad (al aplicar un change)

- [ ] ¿Cada `#### Scenario:` del `spec.md` tiene al menos una prueba que lo referencia?
- [ ] ¿Se eligió el nivel mínimo suficiente por cada scenario (matrices §3/§5)?
- [ ] Front: unit para funciones puras/stores; integración con MSW para hooks de React Query; componentes por roles accesibles; estados loading/error/empty.
- [ ] Back: slice adecuado (`@WebMvcTest` para controller; `@SpringBootTest` acotado a Repository, no `@DataJpaTest` — ver §5.1); persistencia/Flyway sobre Testcontainers; seguridad por rol con `spring-security-test`.
- [ ] ¿Se cubrieron errores y edge cases descritos en los scenarios (no solo el happy path)?
- [ ] ¿Suite local en verde (front y back) antes del commit/PR?
