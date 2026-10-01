## Why

El login (`POST /auth/login`) acepta intentos ilimitados: una cuenta se puede atacar por fuerza bruta sin freno. La plantilla debe traer de serie el mismo bloqueo temporal que ya usamos en otro proyecto, con sus decisiones de concurrencia y transacciones ya resueltas, para que cada copia no lo reinvente (y no lo reinvente mal).

## What Changes

- Tras **N intentos fallidos consecutivos** (por defecto 5) la cuenta queda **bloqueada temporalmente** (por defecto 15 minutos); al expirar la ventana vuelve a aceptar login.
- Configuración externalizada y **validada al arranque**: `app.auth.lockout.max-attempts` y `app.auth.lockout.window` (ISO-8601). Config inválida = la aplicación no arranca.
- Dos columnas nuevas en `users` (migración aditiva con `DEFAULT`, sin backfill): `failed_login_attempts`, `locked_until`.
- El fallo se registra con un **único `UPDATE` atómico** y en **transacción propia** (sobrevive al rollback del 401).
- Una cuenta bloqueada se rechaza **antes** de comparar la contraseña y **sin tocar el contador**; el éxito resetea el contador con un **reset condicional** (si la cuenta se bloqueó durante el login, se rechaza).
- Respuesta **indistinguible**: mismo `401` y mismo mensaje ("Correo electrónico o contraseña incorrectos") para credenciales inválidas y cuenta bloqueada. Sin cambios en el contrato OpenAPI ni en el frontend.

## Non-goals

- Bloqueo **manual** por un administrador / estado administrativo de la cuenta (capacidad `users`, futura). Cuando exista, será un campo **independiente** del bloqueo automático, y un rechazo por ese estado (con contraseña correcta) no tocará el contador: esa regla y su scenario se añadirán con `users`, no en este change.
- Rate limiting por IP o global, CAPTCHA, notificación por correo del bloqueo, desbloqueo por enlace.
- Igualar tiempos de respuesta (correo inexistente o cuenta bloqueada responden sin bcrypt): mitigación de enumeración por tiempo, fuera de alcance.
- Mostrar al usuario que su cuenta está bloqueada o cuánto falta (lo impide el requisito de respuesta indistinguible).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `authentication`: MODIFIED "Inicio de sesión con credenciales" (una contraseña correcta solo abre sesión si la cuenta no está bloqueada); ADDED "Bloqueo temporal por intentos fallidos de login" y "Configuración del bloqueo validada al arranque".

## Impact

- Backend: `AuthService.login` (deja de ser una única transacción larga, ver design D4), nuevo `LoginAttemptService` (transacción propia), `UserRepository` (dos `UPDATE` nativos), entidad `User` (dos campos de solo lectura), `LoginLockoutProperties` (`infra.security`), `application.yml`, migración `V6__login_lockout.sql`.
- Tests: `AuthServiceTest` (unit), nuevo `LoginLockoutIT` (Testcontainers), `LoginLockoutPropertiesTest` (contexto sin Docker). Estrategia en `docs/testing.md`.
- Docs: `docs/backend.md` (seguridad: bloqueo de login y sus reglas), `docs/domain.md` al archivar (campos de `User`).
- Sin cambios en API/contrato (`ContractDriftIT` debe seguir verde) ni en frontend.
