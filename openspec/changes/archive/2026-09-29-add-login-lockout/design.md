## Context

- `AuthService.login` (`@Transactional`): `findByEmail` → `passwordEncoder.matches` (BCrypt) → `issueTokens`. Cualquier rechazo lanza `InvalidCredentialsException` (`BusinessException`, 401, código `invalid-credentials`, mensaje genérico) y la transacción hace rollback.
- `User` (`users`) no tiene estado administrativo (sin `status`/`enabled`); ese estado llegará con la capacidad `users`.
- Patrón ya usado para concurrencia: `RefreshTokenRepository.deleteByTokenHash` (`@Modifying` que devuelve filas afectadas; 0 filas = perdió la carrera → 401).
- Config con records `@ConfigurationProperties` registrados con `@EnableConfigurationProperties` (`SecurityProperties`, `ProjectProperties`); `spring-boot-starter-validation` ya está en el `pom.xml`.
- Migraciones Flyway `V1`–`V5`; tests de integración con `AbstractIntegrationTest` (PostgreSQL real vía Testcontainers).

## Goals / Non-Goals

**Goals:** bloqueo temporal correcto bajo concurrencia (sin escrituras perdidas, sin resucitar cuentas bloqueadas), que sobreviva al rollback del 401, sin gastar BCrypt en cuentas bloqueadas, sin filtrar información al cliente y con config que falle rápido.

**Non-Goals:** ver `proposal.md` (bloqueo manual de admin, rate limiting por IP, igualar tiempos, avisar al usuario).

## Decisions

### D1. Configuración: `LoginLockoutProperties`
Record `@ConfigurationProperties(prefix = "app.auth.lockout") @Validated` en `infra.security`, registrado en `SecurityConfig` junto a `SecurityProperties`:
- `@Min(1) int maxAttempts` (`@DefaultValue("5")`);
- `Duration window` (`@DefaultValue("PT15M")`) validada **a mano** en el constructor compacto (`null`, cero o negativa → `IllegalArgumentException`): Bean Validation no tiene una restricción estándar para `Duration` positiva.
- `application.yml`: `max-attempts: ${AUTH_LOCKOUT_MAX_ATTEMPTS:5}`, `window: ${AUTH_LOCKOUT_WINDOW:PT15M}`.
Cualquiera de los dos fallos rompe el binding → el contexto no arranca (nada de valores "corregidos" en silencio).

### D2. Esquema: `V6__login_lockout.sql`, dos columnas independientes
```sql
ALTER TABLE users ADD COLUMN failed_login_attempts INT NOT NULL DEFAULT 0;
ALTER TABLE users ADD COLUMN locked_until TIMESTAMPTZ NULL;
```
Aditiva, con `DEFAULT`, sin backfill. **No** se reutilizará un futuro estado administrativo (p. ej. `LOCKED`): el bloqueo automático es temporal; si compartieran campo, al expirar la ventana se "resucitaría" una cuenta bloqueada a mano por un admin.
En `User` se mapean como **solo lectura**: la entidad nunca los sobrescribe (el `INSERT` usa el `DEFAULT`; un flush de la entidad no pisa un contador actualizado por otra petición). Solo los modifican los dos `UPDATE` de D3/D5.
```java
@Column(name = "failed_login_attempts", insertable = false, updatable = false, nullable = false)
private int failedLoginAttempts;

@Column(name = "locked_until", insertable = false, updatable = false)
private Instant lockedUntil;
```
Los `UPDATE` nativos no refrescan la entidad cargada: **tras un bulk update no se vuelven a leer estos campos desde la entidad** en la misma unidad de trabajo. No se usa `clearAutomatically = true`: vaciaría el contexto de persistencia y `issueTokens` guarda un `RefreshToken` que referencia al `User`.

### D3. Registro del fallo: un `UPDATE` atómico, en transacción propia
`UserRepository.registerFailedLogin(id, now, until, maxAttempts)` (`@Modifying`, SQL nativo):
```sql
UPDATE users
SET failed_login_attempts = CASE
      WHEN locked_until IS NOT NULL AND locked_until <= :now THEN 1
      ELSE failed_login_attempts + 1 END,
    locked_until = CASE
      WHEN locked_until IS NOT NULL AND locked_until <= :now
        THEN CASE WHEN 1 >= :maxAttempts THEN :until ELSE NULL END
      WHEN failed_login_attempts + 1 >= :maxAttempts THEN :until
      ELSE locked_until END
WHERE id = :id
```
- Nunca read-modify-write en Java: bajo concurrencia, leer-incrementar-guardar pierde escrituras. Las referencias del lado derecho ven los valores **antiguos** de la fila (semántica SQL), y la fila queda bloqueada durante el `UPDATE`, así que dos fallos concurrentes suman 2.
- Si la ventana anterior expiró, reinicia a 1 y limpia `locked_until`. Única diferencia con el SQL del proyecto original: la rama de expiración también bloquea si `maxAttempts = 1` (si no, con ese umbral el primer fallo tras expirar no bloquearía, contradiciendo "el intento que alcanza el umbral bloquea"). Cubierto en `LoginLockoutIT` (ver D7).
- **Transacción propia**: vive en un bean aparte, `LoginAttemptService.recordFailure(userId)` con `@Transactional(propagation = REQUIRES_NEW)`. El login lanza 401 justo después; si el incremento viviera en la misma transacción que el rechazo, el rollback lo borraría y el contador nunca avanzaría. Tiene que ser **otro bean** porque la auto-invocación no pasa por el proxy transaccional. `REQUIRES_NEW` se mantiene aunque (D4) no haya transacción exterior: garantiza el commit propio aunque alguien vuelva a envolver el login en una transacción.
- `now` = `Instant.now()`; `until = now + window`.
- En el SQL real los parámetros temporales van como `CAST(:now AS timestamptz)` / `CAST(:until AS timestamptz)`: dentro del `CASE`, PostgreSQL recibía el `Instant` como `text` ("CASE types timestamp with time zone and text cannot be matched").
*Alternativas descartadas*: `@Version`/bloqueo optimista (reintentos y 500 bajo carga); `SELECT … FOR UPDATE` + incremento en Java (dos queries y la misma complejidad); `noRollbackFor` en el login (el 401 no haría rollback de nada más, pero acopla el contador a la transacción del login y a cualquier fallo posterior).

### D4. `AuthService.login`: sin transacción larga, orden de chequeos
**`login` deja de ser `@Transactional`** (revisión de Codex). Con una transacción exterior abierta durante todo el login, cada fallo ocupaba **dos** conexiones a la vez (la exterior + la `REQUIRES_NEW`): con el pool Hikari por defecto (10), unos pocos logins fallidos simultáneos —justo lo que produce un ataque de fuerza bruta— agotan el pool y todas las peticiones quedan esperando una conexión que nunca se libera (hasta el timeout → 500). En lugar de ampliar el pool, cada paso usa su propia transacción corta (`open-in-view: false`, así que fuera de ellas no se retiene conexión):
1. `findByEmail` (transacción de solo lectura del repositorio) → si no existe, 401 (sin contador: no hay cuenta).
2. `lockedUntil != null && lockedUntil > now` → 401 **sin** comparar contraseña y **sin** tocar el contador (no se gasta BCrypt; insistir no prolonga la ventana).
3. `matches` (BCrypt, **sin conexión retenida**) falla → `loginAttempts.recordFailure(id)` (su transacción) → 401.
4. Éxito → **una transacción** (`TransactionTemplate`) con el reset condicional (D5) y `issueTokens`. Si la emisión de tokens falla después del reset, el rollback revierte también el reset (misma garantía que pedía "reset en la transacción principal").
Máximo **una** conexión por petición en cada momento. La entidad `User` de (1) queda *detached*; `issueTokens` solo lee sus campos ya cargados y la usa como referencia del `RefreshToken` (`persist` sin cascada: solo necesita el id).
Un rechazo por estado administrativo (cuenta suspendida, con contraseña correcta) **no** entra en este change: no existe ese estado. Cuando llegue `users`, irá entre (3) y (4) y no tocará el contador (ver proposal, Non-goals).

### D5. Reset condicional (defensa contra carrera)
`UserRepository.resetFailedLogins(id, now)` (`@Modifying`, nativo) devuelve filas afectadas:
```sql
UPDATE users SET failed_login_attempts = 0, locked_until = NULL
WHERE id = :id AND (locked_until IS NULL OR locked_until <= :now)
```
`locked_until` se lee una vez, al inicio; entre esa lectura y el reset pasa el hashing (~100 ms) y otra petición pudo bloquear la cuenta. Si el reset afecta **0 filas** → 401, no se emiten tokens (mismo patrón que la rotación del refresh token).

### D6. Respuesta: siempre `InvalidCredentialsException`
Correo inexistente, contraseña incorrecta, cuenta bloqueada y bloqueo concurrente lanzan **la misma** excepción: mismo 401, mismo `type` (`/errors/invalid-credentials`), mismo `title` y mismo `detail`. No se añade ningún campo nuevo al `ProblemDetail` (sería un cambio de contrato). No se crea `AccountLockedException` (evita que alguien la mapee a otro status o mensaje más adelante). En logs del servidor sí se distingue (`WARN` con id de usuario, sin correo ni contraseña).

### D7. Tests (un test por Scenario)
- **`LoginLockoutIT`** (Testcontainers, HTTP vía MockMvc, contadores leídos con `JdbcTemplate`):
  - umbral N-1 / N; bloqueada rechaza sin tocar contador ni `locked_until`;
  - 401 bloqueado vs. 401 por contraseña incorrecta: mismos status, `type`, `title`, `detail`, sin `Set-Cookie` de refresco (se ignoran `timestamp`/`traceId`);
  - ventana expirada: `UPDATE users SET locked_until = ? WHERE email = ?` con un `Instant` inequívocamente pasado (p. ej. `now - 1 h`), parametrizado → fallo reinicia a 1 / éxito resetea;
  - el fallo persiste tras el 401 (prueba la transacción propia);
  - dos fallos concurrentes suman 2: `ExecutorService` con dos tareas explícitas que esperan a un `CountDownLatch` común, se esperan ambos `Future`; se verifica solo el contador final (`2`), no el orden;
  - `registerFailedLogin` directo con `maxAttempts = 1` y ventana expirada → bloquea (umbral como parámetro, sin otro contexto de Spring);
  - **carrera del reset, determinista** (`LoginLockoutRaceIT`): `@MockitoSpyBean` sobre el `PasswordEncoder`; al comparar la contraseña (justo después de la lectura inicial y antes del reset) otra transacción fija `locked_until` futuro con `JdbcTemplate` → 401, `locked_until` y contador intactos y ningún `refresh_token` nuevo. Se prefirió al método de paquete `completeLogin` (llamarlo a través del proxy CGLIB de Spring no es fiable) y ejercita el hueco real del flujo HTTP.
- **`AuthServiceTest`** (unit, Mockito): orden de chequeos (bloqueada → `matches` y `recordFailure` nunca se llaman; contraseña incorrecta → `recordFailure`); `resetFailedLogins` = 0 → 401 sin emitir tokens.
- **`LoginLockoutPropertiesTest`** (sin Docker): `ApplicationContextRunner` con `AutoConfigurations.of(ConfigurationPropertiesAutoConfiguration.class, ValidationAutoConfiguration.class)` y una configuración de test con `@EnableConfigurationProperties(LoginLockoutProperties.class)`; defaults 5/PT15M; `max-attempts=0`, `window=PT0S`, `window=-PT1M` y `window=not-a-duration` → `startupFailure` cuyo mensaje (o causa) contiene el nombre completo de la propiedad (`app.auth.lockout.max-attempts` / `app.auth.lockout.window`). Cada caso inválido se comprueba primero que **falla** (un runner mal montado pasaría en vacío).
- `ContractDriftIT` sigue verde (sin cambios de API).

## Risks / Trade-offs

- [Bloqueo como denegación de servicio: un atacante que conoce el correo puede bloquear a la víctima 15 min en bucle] → inherente al bloqueo por cuenta; la ventana es corta y configurable. Rate limiting por IP queda como non-goal.
- [El contador no decae: 4 fallos hoy + 1 dentro de una semana bloquean] → decisión del diseño original ("consecutivos" hasta un éxito o hasta expirar un bloqueo). Documentado.
- [Diferencia de tiempos: cuenta bloqueada / correo inexistente responden sin BCrypt] → permite distinguir por tiempo; non-goal explícito.
- [Pool de conexiones bajo ataque] → D4: máximo una conexión por petición y ninguna durante BCrypt; no hace falta ampliar el pool. Si alguien vuelve a poner `@Transactional` en `login`, cada fallo volvería a ocupar dos conexiones: queda anotado en el Javadoc de `login` y en `docs/backend.md`.
- [Reloj de la app vs. de la BD] → `now` siempre lo calcula la app y se pasa a ambas queries; la BD no usa `now()` en estas comparaciones.

## Migration Plan

`V6` aditiva: las filas existentes quedan con contador 0 y sin bloqueo. Rollback de código: las columnas sobrantes no molestan; revertir el esquema requiere una `V7` que las elimine (no se edita `V6` ya aplicada).

## Open Questions

- Ninguna bloqueante. El bloqueo manual de admin se diseñará con `users` (campo independiente, ver D2).
