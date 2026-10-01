> Solo backend (sin cambios de API, contrato ni frontend). Tests derivados de los Scenario de `specs/authentication/spec.md`. Revisado por Codex.
> Los `*IT` necesitan Docker: verificar siempre `Skipped: 0`.

## 1. Configuración (D1)

- [x] 1.1 `LoginLockoutProperties` (`infra.security`): `@Validated`, `@Min(1) maxAttempts` (default 5), `window` (default `PT15M`) validada en el constructor compacto; registrada en `SecurityConfig`
- [x] 1.2 `application.yml`: `app.auth.lockout.max-attempts: ${AUTH_LOCKOUT_MAX_ATTEMPTS:5}` y `window: ${AUTH_LOCKOUT_WINDOW:PT15M}`
- [x] 1.3 `LoginLockoutPropertiesTest` (sin Docker, runner de D7): "Valores por defecto"; "Umbral inválido impide arrancar" (`0`); "Ventana inválida impide arrancar" (`PT0S`, `-PT1M`, `not-a-duration`); el fallo nombra la propiedad completa

## 2. Esquema y persistencia (D2, D3, D5)

- [x] 2.1 `V6__login_lockout.sql`: `failed_login_attempts INT NOT NULL DEFAULT 0`, `locked_until TIMESTAMPTZ NULL`
- [x] 2.2 `User`: `failedLoginAttempts` y `lockedUntil` de solo lectura (`insertable = false, updatable = false`), tal como en D2
- [x] 2.3 `UserRepository.registerFailedLogin(id, now, until, maxAttempts)`: `UPDATE` nativo atómico de D3
- [x] 2.4 `UserRepository.resetFailedLogins(id, now)`: reset condicional de D5, devuelve filas afectadas

## 3. Login (D3, D4, D6)

- [x] 3.1 `LoginAttemptService.recordFailure(userId)` con `@Transactional(propagation = REQUIRES_NEW)`
- [x] 3.2 `AuthService.login` sin `@Transactional` (Javadoc explica por qué): lectura → bloqueada = 401 sin BCrypt ni contador → fallo = `recordFailure` + 401 → éxito = `completeLogin(user)` en `TransactionTemplate` (reset condicional, 0 filas = 401; después `issueTokens`); siempre `InvalidCredentialsException`; log `WARN` con id de usuario en bloqueo
- [x] 3.3 `AuthServiceTest` (unit): cuenta bloqueada no llama a `matches` ni a `recordFailure`; contraseña incorrecta llama a `recordFailure`; `resetFailedLogins` = 0 → 401 sin tokens

## 4. Integración (D7)

- [x] 4.1 `LoginLockoutIT`: "Credenciales válidas" (cuenta no bloqueada), "Fallos por debajo del umbral no bloquean" y "El intento que alcanza el umbral bloquea la cuenta"
- [x] 4.2 "Cuenta bloqueada rechaza sin tocar el contador" (contraseña correcta e incorrecta; contador y `locked_until` sin cambios)
- [x] 4.3 "Respuesta indistinguible de credenciales inválidas" (status, `type`, `title`, `detail`, sin cookie de refresco; `timestamp`/`traceId` ignorados)
- [x] 4.4 "Ventana expirada reinicia el conteo" y "Login correcto tras expirar la ventana" (`locked_until` pasado fijado por parámetro)
- [x] 4.5 "El fallo cuenta aunque el login responda con error" + dos fallos concurrentes suman 2 (`ExecutorService` + `CountDownLatch`)
- [x] 4.6 "Cuenta bloqueada durante el propio login": carrera determinista (`LoginLockoutRaceIT`, spy del `PasswordEncoder`) (bloqueo fijado entre la lectura y el reset → 401, bloqueo intacto, sin refresh token nuevo)
- [x] 4.7 Repositorio: `registerFailedLogin` con `maxAttempts = 1` y ventana expirada → bloquea

## 5. Verificación y docs

- [x] 5.1 `./mvnw -B verify`: verde, `Skipped: 0`, `LoginLockoutIT` y `ContractDriftIT` en `failsafe-reports`, `contracts/openapi.json` sin cambios
- [x] 5.2 Prueba manual con la app levantada: 5 fallos → 401 también con la contraseña correcta; mismo mensaje en el frontend
- [x] 5.3 `docs/backend.md` (§11 Seguridad): bloqueo de login (config, orden de chequeos, transacción propia, login sin transacción larga y por qué, reset condicional, respuesta indistinguible, independiente de un futuro bloqueo de admin)
- [x] 5.4 `openspec validate add-login-lockout --strict`
