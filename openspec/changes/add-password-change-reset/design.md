## Context

- Sesión: access token JWT de 15 min + refresh token opaco persistido como hash SHA-256 (`refresh_tokens`, `TokenService.hashRefreshToken`), en cookie `HttpOnly`, `SameSite=Lax`, path `/auth` (`RefreshCookieFactory`). `RefreshTokenRepository.revokeAllByUserId` revoca todas las sesiones renovables de una cuenta.
- Bloqueo por intentos (`add-login-lockout`): `LoginAttemptService.recordFailure` (UPDATE atómico en transacción propia) y `UserRepository.resetFailedLogins`. `AuthService.login` no es transaccional a propósito: BCrypt fuera de transacción y escrituras cortas con `TransactionOperations`.
- `/auth/**` es público (`PublicPaths`); `/api/**` exige sesión. "Mis datos" vive en `ProfileController` (`/api/me/profile`, cualquier autenticado); "Usuarios" en `UsersController` (`hasRole('ADMIN')`).
- Frontend: rutas de invitado bajo `RequireGuest` (`/ingresar`, `/registro`); "Mis datos" en `ProfileFeature`; acciones de fila con `IconAction`; `copyToClipboard` en `core/utils`. Vercel reescribe `/api` y `/auth` a Render: las páginas del SPA no pueden empezar por `/auth`.

## Goals / Non-Goals

**Goals:** cambio de contraseña con la sesión iniciada (con el bloqueo por intentos), enlace de restablecimiento de un solo uso generado por el ADMIN y página pública para usarlo.

**Non-Goals:** envío por correo, restablecer la cuenta ADMIN, reglas de complejidad, rate limit por IP (ver proposal).

## Decisions

### Datos (`V20`)
```sql
CREATE TABLE password_reset_tokens (
    id          BIGSERIAL PRIMARY KEY,
    user_id     BIGINT NOT NULL REFERENCES users (id),
    token_hash  VARCHAR(64) NOT NULL,
    expires_at  TIMESTAMPTZ NOT NULL,
    used_at     TIMESTAMPTZ,
    created_by  BIGINT NOT NULL REFERENCES users (id),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_password_reset_tokens_hash UNIQUE (token_hash)
);
CREATE INDEX ix_password_reset_tokens_user ON password_reset_tokens (user_id);
```
- Token opaco de 32 bytes de `SecureRandom` en base64url (como el refresh); solo se guarda su hash SHA-256 (mismo `TokenService`, con un método `hashOpaqueToken` que reusa el del refresh). Vence a las 24 h del reloj de la app; `created_by` = ADMIN que lo generó.
- Generar uno nuevo **borra** los no usados de la cuenta en la misma transacción (anular = que no exista); los usados quedan como registro.

### Cambiar la contraseña
| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| PUT | `/api/me/password` | autenticado | `200 AuthResponse` + cookie de refresco nueva |
- En `ProfileController`. Cuerpo `ChangePasswordRequest(currentPassword, newPassword)`: `@NotBlank` y `@Size(min = 8)` en la nueva.
- `AuthService.changePassword(userId, current, new)`, sin `@Transactional` como el login: cuenta bloqueada (`lockedUntil` futuro) → `400 /errors/password-change-locked` sin BCrypt; actual incorrecta → `recordFailure` + `400 /errors/wrong-current-password`; nueva igual a la actual (`matches`) → `400 /errors/same-password`. Si todo va bien, en una transacción corta: nuevo hash, `revokeAllByUserId`, `resetFailedLogins` y sesión nueva (`issueTokens`). El controlador pone la cookie con `RefreshCookieFactory` (path `/auth`, aunque la respuesta salga de `/api`).
- Frontend: los tres `type` van a su campo (`currentPassword` o `newPassword`) con `setError`, sin toast; al éxito se guarda la sesión nueva (`setSession`) y aviso "Contraseña actualizada".

### Generar el enlace (ADMIN)
| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| POST | `/api/users/{id}/password-reset` | ADMIN | `201 { token, expiresAt }` |
- `UserAdminService.createPasswordReset(adminId, id)` con la fila bloqueada: 404 si no existe; `409 /errors/password-reset-not-applicable` si es ADMIN o está deshabilitada. El token en claro solo viaja en esta respuesta; nunca en logs.
- El frontend arma el enlace como `${origin}/restablecer#t=<token>`: en el **fragmento** (`#`), que el navegador no envía al servidor ni a los logs de Vercel/Render ni en el `Referer`.

### Restablecer (público)
| Método | Ruta | Rol | Respuesta |
|---|---|---|---|
| POST | `/auth/password-reset` | público | `204` |
- Cuerpo `ResetPasswordRequest(token, newPassword)` (`@Size(min = 8)`). `AuthService.resetPassword`: busca por hash con la fila bloqueada; inexistente, usado, vencido o cuenta deshabilitada → `400 /errors/invalid-password-reset` ("El enlace no es válido o venció. Pide uno nuevo al administrador."), mismo mensaje en todos los casos. Si vale: nuevo hash, `used_at = now`, `revokeAllByUserId` y quitar el bloqueo (`failed_login_attempts = 0`, `locked_until = null`), en una transacción. BCrypt de la nueva antes de abrirla.
- Página `/restablecer` fuera de `RequireGuest` y de `RequireAuth` (el ADMIN con sesión también puede probar un enlace), con `AuthLayout`: lee el token del fragmento y lo quita de la barra (`history.replaceState`), pide nueva y confirmación (Zod, mínimo 8, iguales) y al éxito va a `/ingresar` con el aviso "Contraseña actualizada. Inicia sesión.". Sin token en el fragmento muestra directamente el mensaje de enlace no válido.

### Usuarios (ADMIN)
- `UserRowAction` suma "Restablecer contraseña" (`KeyRound`) en cuentas `USER`/`COORDINATOR`; deshabilitadas: `disabledReason` "Actívala para restablecer su contraseña". Confirmación (`AlertDialog`: "Se anula el enlace anterior si había uno") y luego `ResetLinkDialog` con el enlace (solo lectura, cortado si es largo), "Copiar enlace" (`copyToClipboard`, "Enlace copiado"), "Vence el <fecha y hora local>" y "Envíaselo a <nombre> por WhatsApp o correo. Al cerrar este diálogo no se vuelve a mostrar.".

### Pantalla "Mis datos"
- Segundo bloque "Cambiar contraseña" (`ChangePasswordForm`, schema en `modules/auth/schemas`): contraseña actual, nueva (con `PasswordStrengthBar`) y confirmación; Zod: nueva ≥ 8, distinta de la actual, confirmación igual.

## Risks / Trade-offs

- **El enlace viaja por WhatsApp**: quien lo reciba controla la cuenta durante 24 h. Mitigación: un solo uso, vence en 24 h, un enlace nuevo anula el anterior, y restablecer cierra todas las sesiones. El ADMIN lo envía a quien conoce.
- **Sin rate limit en `/auth/password-reset`**: adivinar un token de 256 bits no es práctico; el rate limit por IP sigue en la auditoría.
- **Cambio con la contraseña actual correcta sin bloqueo propio**: los fallos suman al mismo bloqueo del login, así no hay una segunda vía para probar contraseñas.
- **Otros dispositivos siguen hasta 15 min** (access token vigente), igual que al deshabilitar una cuenta.
