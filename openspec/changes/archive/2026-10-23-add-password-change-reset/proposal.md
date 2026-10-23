## Why

Hoy nadie puede cambiar su contraseña y una cuenta que la olvida queda sin acceso: ni el alumno ni el ADMIN tienen cómo recuperarla desde la aplicación. Con cohortes de 15–20 alumnos y el uso real a punto de empezar, es el hueco de soporte más urgente. El envío por correo exige un servicio de correo y un dominio propio, que se decidirán con la venta institucional; mientras tanto el ADMIN, que conoce a cada alumno, puede entregar un enlace de restablecimiento por WhatsApp.

## What Changes

- **Cambiar la contraseña** (`authentication`): en "Mis datos", cualquier cuenta cambia su contraseña indicando la actual y la nueva (mínimo 8 caracteres, distinta de la actual, con confirmación en el cliente). Una contraseña actual incorrecta cuenta como intento fallido para el bloqueo temporal. Al cambiarla se cierran las sesiones de los demás dispositivos y la actual sigue abierta.
- **Enlace de restablecimiento** (`users`): en "Usuarios", el ADMIN genera para una cuenta `USER` o `COORDINATOR` activa un enlace de un solo uso que vence a las 24 horas, lo copia y lo envía por su cuenta. Generar uno nuevo anula el anterior.
- **Restablecer con el enlace** (`authentication`): una página pública "Nueva contraseña" fija la contraseña con el enlace válido, cierra todas las sesiones de la cuenta, quita un bloqueo temporal y lleva al login. Un enlace usado, vencido o anulado se rechaza con un mensaje que indica pedir uno nuevo.
- **Contrato**: endpoints nuevos para cambiar la contraseña, generar el enlace y restablecer.

### Non-goals

- "¿Olvidaste tu contraseña?" con envío por correo (con la venta institucional, junto con el dominio).
- Restablecer la cuenta `ADMIN` desde la aplicación (cambia la suya en "Mis datos").
- Reglas de complejidad más allá del mínimo de 8 caracteres o historial de contraseñas.
- Límite de peticiones por IP (pendiente de la auditoría).

## Capabilities

### New Capabilities
- (ninguna)

### Modified Capabilities
- `authentication`: cambio de contraseña con la sesión iniciada y restablecimiento con un enlace de un solo uso.
- `users`: el ADMIN genera el enlace de restablecimiento desde "Usuarios".

## Impact

- Backend: migración `V20` (`password_reset_tokens`); `AuthService` (cambio y restablecimiento), `UserAdminService` (generar enlace); tests.
- Contrato `contracts/openapi.json` y cliente orval.
- Frontend: bloque "Cambiar contraseña" en "Mis datos", acción "Restablecer contraseña" en "Usuarios" con diálogo para copiar el enlace, página pública `/restablecer`.
- Docs: `docs/domain.md` (enlace de restablecimiento), `docs/vision.md`.
