## Context

- **Creación de historias:** `OrthodonticRecordService.create` toma el bloqueo del autor (`UserRepository.findByIdForUpdate`) para asignar el correlativo `AEO-NNN` sin carreras. Las historias no se borran.
- **Usuarios hoy:** `users` tiene el listado paginado para `ADMIN` y `PATCH /{id}/status` para activar o deshabilitar cuentas `USER`.
- **Pantalla "Usuarios":** tabla con acción por fila y diálogo de confirmación (`ChangeStatusDialog`).

## Goals / Non-Goals

**Goals:** un cupo opcional por tratante, administrado por el `ADMIN` y respetado al crear, sin carreras y sin tocar lo ya creado.

**Non-Goals:** ver proposal.

## Decisions

### D1. Modelo
`users.record_quota INTEGER NULL CHECK (record_quota >= 0)`. La migración es `V11__user_record_quota.sql`, sin datos: todas las cuentas quedan sin límite.
- **`null`:** sin límite.
- **`0`:** no puede crear ninguna.

En la entidad: `User.recordQuota: Integer`.

**Alternativa descartada:** una tabla de cupos aparte. No hay período ni historial que lo justifique.

### D2. Uso = historias creadas por el usuario
El uso es `count(*) from orthodontic_records where author_id = ?`. Como las historias no se borran, equivale al máximo `record_seq`, pero se cuenta para no depender de esa coincidencia. Ya existe índice por `author_id`, por el correlativo.

### D3. Verificación al crear (backend)
En `create`, después del `findByIdForUpdate(author)`:
- si el autor es `USER` y `recordQuota != null` y `uso >= recordQuota`, se lanza `RecordQuotaReachedException`;
- es una `BusinessException`: `GlobalExceptionHandler` la convierte en `409` `ProblemDetail` con `type=/errors/record-quota-reached` y `detail="Alcanzaste el máximo de {N} historias clínicas. Comunícate con el administrador para solicitar más."`. **Sin propiedades extra**: el `detail` ya lleva el número, y el esquema `ApiProblem` no admite otras (lo vigila `OpenApiContractIT`);
- `createRecord` documenta el `@ApiResponse(409, ApiProblem)`.

Al hacerse bajo el mismo bloqueo que el correlativo, dos creaciones simultáneas no pueden pasar el tope. `create` es la única vía de creación. El `ADMIN` nunca se limita. Editar (`PUT`) no consulta el cupo; el uso cuenta por `author_id`, que nunca cambia, así que un `ADMIN` que edita historias ajenas no altera el uso de nadie.

### D4. API de administración
- **`PATCH /api/users/{id}/record-quota`:**
  - cuerpo `{ "recordQuota": number | null }`, con `@Min(0) @Max(9999)`; `null` quita el límite;
  - solo `ADMIN`; si la cuenta destino no es `USER`, responde `409` con `type=/errors/quota-not-applicable`; si no existe, `404`;
  - devuelve el usuario actualizado (`UserSummaryResponse`, con `recordQuota` y `recordCount`). `PATCH /{id}/status` devuelve el mismo DTO, así que también incluye ambos campos (conteo con `countByAuthorId`).
- **`operationId` nuevos:** `changeRecordQuota` y `getRecordQuota`, registrados en la lista cerrada de `OpenApiContractIT.operation_ids_are_explicit_and_stable`.
- **`GET /api/users`:** cada cuenta incluye `recordQuota` (número o `null`) y `recordCount` (historias creadas). El conteo sale en una sola consulta agrupada para los ids de la página (`select r.author.id, count(r) … where r.author.id in :ids group by r.author.id`), sin N+1.

El requirement "Listado de usuarios" se modifica para incluir estos dos campos.

### D5. API para el tratante
`GET /api/orthodontic-records/quota` → `{ limit: number | null, used: number, reached: boolean }` del usuario autenticado. Para el `ADMIN`: `limit = null`, `reached = false` y `used` = las historias que creó él (el valor real, solo informativo). El frontend la consulta en el listado con React Query y la invalida al crear una historia.

### D6. Frontend
- **Listado de historias:**
  - con `reached`, "Nueva historia" se deshabilita, con un tooltip y además un `FieldHint` visible: "Alcanzaste el máximo de N historias clínicas. Comunícate con el administrador para solicitar más.". Vale para los **dos** botones: el de la cabecera y el del estado vacío (`RecordsEmptyState`), que es el que ve un tratante con cupo 0;
  - con cupo, se muestra "N de M historias" junto al título;
  - **`/historias/nueva` abierto directamente** con el cupo lleno: el formulario consulta `useRecordQuota`, muestra el aviso desde el inicio y deshabilita "Crear historia";
  - si aun así el servidor responde `409 record-quota-reached` (carrera), `onSaveError` muestra el `detail` del servidor y no navega;
  - al crear una historia se invalida la consulta del cupo; al cambiar un cupo en "Usuarios", la del listado de usuarios.
- **Usuarios (ADMIN):**
  - columna "Historias" con "3 de 5" o "3 · sin límite" para cuentas `USER`, y "3 · no aplica" para cuentas `ADMIN`;
  - acción "Cupo", solo en cuentas `USER`, que abre un diálogo con un `NumberInput` (mín. 0, máx. 9999, paso 1), la casilla "Sin límite" y un aviso si el cupo queda por debajo de las ya creadas;
  - el diálogo usa `dialog` de shadcn (está en "por incorporar" en `docs/frontend.md`). Se instala con las mismas precauciones que `sheet`: import `cn` corregido y sin el paquete `cn`, primitivos de `radix-ui`, botón de cierre en español, `globals.css` intacto y sin `Button asChild`.

## Risks / Trade-offs

- **[Cupo por debajo de lo ya creado]** → Se permite y se avisa en el diálogo; las existentes no se tocan.
- **[Abrir `/historias/nueva` con el cupo lleno]** → El backend bloquea al guardar y el formulario muestra el aviso. Además, la pantalla nueva consulta el cupo y muestra el aviso desde el inicio.
- **[Conteo en el listado de usuarios]** → Una consulta agrupada por página: O(1) consultas.

## Migration Plan

`V11` agrega la columna nula: compatible hacia atrás y sin datos que migrar. Rollback: quitar la columna.
