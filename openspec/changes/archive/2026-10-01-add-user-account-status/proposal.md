## Why

Hoy no hay forma de impedir que una persona siga usando la aplicación: no existe un estado de cuenta ni ninguna gestión de usuarios (solo `/auth/*`). Para dar de baja a alguien hay que tocar la base de datos. La plantilla necesita lo mínimo de la capacidad `users` del roadmap: que un administrador pueda **deshabilitar y reactivar** cuentas desde la aplicación, y que una cuenta deshabilitada deje de poder entrar.

## What Changes

- **Estado de la cuenta**: `ACTIVE` / `DISABLED` (enum en el código, `CHECK` en la BD, en el contrato y tipado en el frontend). Campo **independiente** del bloqueo temporal por intentos (`locked_until`).
- **Login**: con contraseña correcta y cuenta `DISABLED` → `403` "Tu cuenta está deshabilitada. Contacta con el administrador.", **sin tocar** el contador de intentos. Con contraseña incorrecta → el `401` genérico de siempre (y cuenta el fallo); el bloqueo por intentos se sigue comprobando antes. El mensaje específico no revela qué correos existen por su contenido ni por el código (la diferencia temporal del login ya existía y queda fuera).
- **Al deshabilitar**: se **revocan** (no se borran) los refresh tokens de la cuenta. Su sesión termina como mucho al caducar el access token en curso (≤ 15 min, `JWT_ACCESS_TTL`): ventana aceptada, el filtro JWT no consulta la BD. Reactivar no restaura sesiones.
- **Refresh**: una cuenta `DISABLED` no renueva su sesión: `403` con el mismo mensaje, y el frontend cierra la sesión **explicando el motivo** (un aviso).
- **Gestión (solo `ADMIN`)**: `GET /api/users` paginado (20 por página, máximo 100; primer uso de `PageResponse`) y `PATCH /api/users/{id}/status`. Un `ADMIN` **solo** cambia el estado de cuentas `USER`; sobre una cuenta `ADMIN` el backend responde `409`.
- **Pantalla "Usuarios"** (sección restringida a `ADMIN` en `core/config/sections.ts`): tabla con nombre, correo, rol, estado y la acción (deshabilitar / activar) con confirmación; las filas `ADMIN` no tienen acción.
- **Registro**: el correo de una cuenta deshabilitada sigue dando "ya registrado".

## Non-goals

- Corte **inmediato** de la sesión (consultar el estado en cada petición o versionar tokens): se acepta la ventana de ≤ 15 min.
- Búsqueda o filtros en el listado, cambio de rol desde la interfaz, edición de perfil, alta de usuarios por un admin.
- Auditoría de quién/cuándo cambió el estado (solo el campo `status`).
- Más estados (p. ej. pendiente de verificación).

## Capabilities

### New Capabilities
- `users` (primera parte de la capacidad del roadmap): gestión de cuentas por un administrador — listado paginado y cambio de estado (activar/deshabilitar) de cuentas `USER`. Roles, alta y perfil, en cambios posteriores.

### Modified Capabilities
- `authentication`: MODIFIED "Inicio de sesión con credenciales" (cuenta deshabilitada) y "Renovación de token" (refresh de una cuenta deshabilitada).

## Impact

- **Backend**: migración `V7` (`status`), enum `UserStatus`, `User`, `AuthService` (login/refresh), `UserRepository` (bloqueo de fila), `RefreshTokenRepository` (revocar por usuario), nuevo `service.users` + `UsersController` (`/api/users`), `PageResponse` en `presentation.dto`, tope de página, `AccountDisabledException` (403).
- **Contrato**: endpoints nuevos y `403` en login → regenerar `contracts/openapi.json` y el cliente orval (`OpenApiContractIT` exige `operationId` y éxito declarado).
- **Frontend**: aviso de cuenta deshabilitada en `refreshSession`; sección "Usuarios" (`sections.ts`, `navItems`, `routes`), `modules/users` (feature, hooks de React Query sobre el cliente generado, tabla, diálogo de confirmación), shadcn `table`, `badge`, `alert-dialog`.
- **Tests**: backend (`*IT` de login/refresh/gestión, unit de reglas) y frontend (Vitest + MSW).
- **Docs**: `docs/domain.md` (`status` en `User`), `docs/backend.md` (§5.1 paginación, §11), `docs/frontend.md`, `docs/vision.md` (roadmap de `users`).
