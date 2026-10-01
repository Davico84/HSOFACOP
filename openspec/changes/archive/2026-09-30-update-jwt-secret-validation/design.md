## Context

- `application.yml`: `app.security.jwt.secret: ${JWT_SECRET}` sin default. Con el binder de Boot, si `JWT_SECRET` falta el valor enlazado es el literal `${JWT_SECRET}` (13 caracteres): **verificado** enlazando `app.security` desde `application.yml` sin otras fuentes.
- `SecurityProperties` es un record sin validación; `TokenService` hace `Algorithm.HMAC256(props.jwt().secret())` (java-jwt no exige longitud mínima).
- CI (`backend.yml`, `working-directory: modules/backend`) no define `JWT_SECRET` ni tiene `secrets.properties`; en local los tests importan `./secrets.properties` (Maven corre en `modules/backend`). `template.yml` ejecuta `project:apply`, que **crea** un `secrets.properties` durante el ensayo: es una prueba real de precedencia.
- `AbstractIntegrationTest` solo registra el datasource con `@DynamicPropertySource`. OdontoRisas (proyecto hermano) ya registra ahí un `JWT_SECRET` de test.
- Los `@WebMvcTest` (`MethodSecurityTest`, `ErrorFallbackTest`) excluyen `JwtAuthenticationFilter` y no crean `TokenService`; `AuthServiceTest` lo mockea.
- `apply.mjs` genera `JWT_SECRET` con `randomBytes(48)` (64 caracteres base64) al crear `secrets.properties`; conserva un valor personalizado existente.

## Goals / Non-Goals

**Goals:** imposible arrancar con un secreto inseguro; mensajes útiles que **nunca** revelan el valor (tampoco el log de arranque); tests con un secreto de precedencia determinista.

**Non-Goals:** ver `proposal.md`.

## Decisions

### D1. Validación en `TokenService`, no en el binding
`JwtSecretRules.validate(String secret)` (`infra.security`), llamada **en el constructor de `TokenService`** antes de `Algorithm.HMAC256`, con el secreto extraído de forma segura ante nulos: `JwtSecretRules.validate(props.jwt() == null ? null : props.jwt().secret())` (sin ninguna propiedad `app.security.jwt.*`, el binder puede dejar `jwt()` en `null`; sin esta guarda saltaría un `NullPointerException` sin el mensaje contractual). Lanza `IllegalStateException` con mensajes propios, **sin el valor**, en este orden:
1. `null` → "app.security.jwt.secret es obligatorio: define JWT_SECRET";
2. vacío/blanco → mismo mensaje;
3. contiene `${` → "app.security.jwt.secret no está resuelto: define la variable JWT_SECRET";
4. igual al valor de ejemplo → "app.security.jwt.secret usa el valor de ejemplo de secrets.properties.example: genera uno propio (openssl rand -base64 48)";
5. `< 32` bytes UTF-8 → "app.security.jwt.secret debe tener al menos 32 bytes (tiene N)".
**Por qué no en el constructor del record** (revisión): un fallo durante el *binding* lo describe el `BindFailureAnalyzer` de Boot con "Property: … Value: … Reason: …", que **imprimiría el secreto** (p. ej. uno real pero corto) en el log de arranque. Un fallo al crear `TokenService` se describe con el mensaje de la excepción, que controlamos. `TokenService` se crea siempre en la aplicación (lo usan `AuthService` y `JwtAuthenticationFilter`), así que el arranque falla igual.
**Valor de ejemplo sincronizado**: la constante `EXAMPLE_SECRET` duplica el valor del `.example`; `JwtSecretRulesTest` lee `secrets.properties.example` del repo y exige que su `JWT_SECRET` sea rechazado **precisamente por ser el valor de ejemplo** (el mensaje es el de la regla 4, no el de longitud), y que ese valor tenga ≥ 32 bytes (si no, la regla de longitud lo taparía y el test no detectaría la desincronización).

### D2. Secreto de test con precedencia determinista: `@DynamicPropertySource`
En `AbstractIntegrationTest`: `registry.add("app.security.jwt.secret", () -> TEST_JWT_SECRET)` (constante ≥ 32 bytes, claramente de test). `@DynamicPropertySource` tiene la **máxima precedencia** en el entorno de test: gana al `secrets.properties` importado, a la variable de entorno `JWT_SECRET` y a una propiedad de sistema. Se registra la propiedad final (no el placeholder `JWT_SECRET`) para no depender de cómo se resuelva.
Las slices `@WebMvcTest` no crean `TokenService`: no necesitan secreto. Si una slice futura lo necesita, usa la misma constante.
*Descartado*: `src/test/resources/application.properties` (no gana de forma garantizada al archivo importado ni al entorno); `systemPropertyVariables` en surefire/failsafe (una variable de entorno o `-D` externa podría competir).

### D3. Tests
- **`JwtSecretRulesTest`** (unit, sin Spring): un caso por regla — `null`, `""`, `"   "`, `"${JWT_SECRET}"`, valor de ejemplo, 31 bytes (inválidos: mensaje con `app.security.jwt.secret` y **sin el valor probado**); multibyte con < 32 caracteres y ≥ 32 bytes, y un valor aleatorio de 48 bytes (válidos); sincronía con `secrets.properties.example`.
- **`JwtSecretStartupTest`** (sin Docker, `ApplicationContextRunner` con `ConfigurationPropertiesAutoConfiguration`, `@EnableConfigurationProperties(SecurityProperties.class)` y `TokenService`): **ninguna** propiedad `app.security.jwt.*` (→ `jwt()` nulo, mensaje "obligatorio", no `NullPointerException`); propiedad `secret` sin definir con el resto presentes (→ `secret` nulo); placeholder literal (`app.security.jwt.secret=${JWT_SECRET}` sin `JWT_SECRET`); corto → `hasFailed()` con el mensaje de su regla y la **cadena completa** de `getStartupFailure()` (mensajes y causas) no contiene el valor; válido → arranca y un token firmado se verifica. Cada caso inválido se comprueba primero fallando.
- **`JwtSecretStartupOutputTest`** (sin Docker, `@ExtendWith(OutputCaptureExtension.class)`): arranca un `SpringApplication` real y mínimo (`WebApplicationType.NONE`, una `@Configuration` con `@EnableConfigurationProperties(SecurityProperties.class)` + `TokenService`) con un secreto corto **distintivo** (p. ej. 31 bytes con un marcador único); espera el fallo y comprueba que la salida capturada (stdout/stderr: log de arranque y el informe de los `FailureAnalyzer`) contiene `app.security.jwt.secret` y **no** contiene el valor. Cubre el scenario "El error no revela el secreto" más allá de la cadena de excepciones.
- **`JwtSecretHermeticityIT`** (contexto completo): el secreto efectivo es `TEST_JWT_SECRET` comparando por hash (nunca imprimiendo). Además de la ejecución normal, se lanza **de verdad** con propiedades de sistema contaminantes en el proceso de failsafe: `./mvnw -B verify -Dit.test=JwtSecretHermeticityIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false -DJWT_SECRET=contaminado-<32+ bytes> -Dapp.security.jwt.secret=contaminado-<32+ bytes>` (Maven propaga las `-D` a la JVM de failsafe, como ya hace `-Dcontract.update`), y sigue siendo el de test. El ensayo de `template.yml` (con `secrets.properties` creado por `project:apply`) lo ejerce en CI.
- Regresión: `./mvnw -B verify` verde; en CI (con Docker) `Skipped: 0`. En local sin Docker los `*IT` se saltan: no cuenta como verificación.

### D4. Docs, ejemplo y migración
- `secrets.properties.example`: "al menos **32 bytes** aleatorios (`openssl rand -base64 48`); la app no arranca con este valor de ejemplo".
- `docs/backend.md` §11 (reglas y por qué la validación está en `TokenService`) y §12.
- **Migración** (un `secrets.properties` existente con un secreto corto o de ejemplo deja de arrancar; `project:apply`/`project:setup` conservan valores personalizados): sustituir la línea a mano — `JWT_SECRET=` + la salida de `openssl rand -base64 48` (o `node -e "console.log(require('crypto').randomBytes(48).toString('base64'))"`). Se documenta en `docs/tooling-setup.md` y en el PR.

## Risks / Trade-offs

- [Un despliegue sin `JWT_SECRET` válido deja de arrancar] → intencionado (hoy arranca con un secreto público).
- [La validación depende de que exista `TokenService`] → siempre existe en la app; si algún día se firma con otro componente, debe llamar a `JwtSecretRules`.
- [Un secreto largo pero débil (`aaaa…`)] → no se mide entropía; el ejemplo y `project:apply` guían a uno aleatorio.
- [Cambiar el secreto invalida los access tokens emitidos (no las sesiones: el refresh opaco los renueva; para expulsar a todos hay que revocar los refresh tokens); réplicas con secretos distintos rechazan tokens ajenos] → consecuencias operativas conocidas, documentadas en §12.

## Migration Plan

Antes de desplegar, confirmar que cada entorno define `JWT_SECRET` con ≥ 32 bytes aleatorios. En local, regenerar si el actual es corto o el de ejemplo (D4). Rollback = revertir el PR.
