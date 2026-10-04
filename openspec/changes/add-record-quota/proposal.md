## Why

La clínica necesita poder poner un tope a cuántas historias clínicas crea cada tratante; por ejemplo, el cupo de pacientes asignado a un alumno del posgrado. Hoy cualquier `USER` puede crear historias sin límite. El usuario decidió:
- el límite es **por tratante**;
- lo fija el **ADMIN usuario por usuario**;
- **por defecto no hay límite**;
- al alcanzarlo, el tratante **no puede crear más, pero sí editar e imprimir** las que ya tiene.

## What Changes

- **Cupo de historias por usuario** (`users`): cada cuenta `USER` tiene un cupo opcional (vacío = sin límite). En la pantalla "Usuarios", el `ADMIN` ve, por cuenta, las historias creadas y el cupo ("3 de 5" o "3 · sin límite"), y puede asignarlo, cambiarlo o quitarlo. El cupo puede quedar por debajo de las ya creadas: no se borra nada, solo deja de poder crear.
- **Límite al crear** (`orthodontic-records`): si un `USER` ya creó tantas historias como su cupo, el sistema no le deja crear otra.
  - El backend responde `409` (`/errors/record-quota-reached`) con "Alcanzaste el máximo de N historias clínicas.".
  - En el listado, "Nueva historia" queda deshabilitado con el mismo aviso visible.
  - Editar, imprimir y buscar sus historias sigue igual. El `ADMIN` no tiene cupo.
- **Uso actual para el tratante**: el listado muestra "N de M historias" cuando el usuario tiene cupo.
- Migración: columna nueva `record_quota` en `users` (nula = sin límite).

## Non-goals

- Un tope global del sistema o por licencia.
- Cupos por período (mensual, por semestre).
- Archivar o borrar historias para liberar cupo (las historias no se borran).
- Cupo para cuentas `ADMIN`.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `users`: el `ADMIN` asigna un cupo de historias a cada cuenta `USER` y ve cuántas creó; el listado de usuarios incluye el cupo y la cantidad.
- `orthodontic-records`: crear una historia respeta el cupo del tratante.

## Impact

- **Backend**: `V11__user_record_quota.sql`; `User.recordQuota`; `PATCH /api/users/{id}/record-quota` (solo `ADMIN`, solo cuentas `USER`); listado de usuarios con `recordQuota` y `recordCount`; la creación de historias verifica el cupo bajo el bloqueo de usuario que ya usa el correlativo; `GET /api/orthodontic-records/quota` para el tratante; contrato regenerado.
- **Frontend**: columna y diálogo de cupo en "Usuarios"; "Nueva historia" deshabilitado con aviso y "N de M historias" en el listado.
- **Docs**: `docs/domain.md` (`User.recordQuota`), `docs/vision.md`.
