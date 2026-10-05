## Context

- `AuthService.register` crea la cuenta `USER` sin `recordQuota` (nulo = sin límite). El cupo se controla al crear (`OrthodonticRecordService.create`, bajo el bloqueo de la fila del autor) y el ADMIN lo cambia desde "Usuarios" (`PATCH /api/users/{id}/record-quota`).
- La numeración ya es por autor (`record_seq` + `UNIQUE (author_id, record_seq)`); no se toca.
- Muchos tests de integración (`OrthodonticRecordsIT`, `DashboardIT`, `UserAccountStatusIT`…) registran usuarios nuevos y crean varias historias; con cupo 1 por defecto fallarían con 409.

## Goals / Non-Goals

**Goals:** cuentas nuevas con cupo inicial 1, configurable por despliegue; cuentas existentes intactas.

**Non-Goals:** migrar cuentas existentes, UI para el cupo inicial, cambiar la numeración.

## Decisions

- **Propiedad** `app.records.default-quota: ${RECORDS_DEFAULT_QUOTA:1}` en `application.yml`, en un `@ConfigurationProperties` propio (`RecordsProperties`, prefijo `app.records`, `Integer defaultQuota`, validado `@Min(0) @Max(9999)` con `@Validated`: un valor inválido impide arrancar). Vacía (`RECORDS_DEFAULT_QUOTA=`) = nulo = sin límite.
  - *Por qué en el registro y no como `DEFAULT` de la columna*: el valor es configurable por despliegue y no debe cambiar el esquema; un `DEFAULT 1` en BD afectaría también a inserciones manuales y no se podría desactivar sin migración.
- `AuthService.register` asigna `recordQuota(properties.defaultQuota())`. Solo cuentas `USER` (el registro siempre crea `USER`); si luego se promueve a `ADMIN`, el cupo guardado se ignora como hoy.
- **Tests**: `src/test/resources/application.yml` (o la propiedad en `AbstractIntegrationTest`) fija `app.records.default-quota` **vacío** para que los IT existentes sigan creando historias libremente; los tests del cupo inicial lo fijan explícitamente (`@TestPropertySource(properties = "app.records.default-quota=1")` y `=3`) o lo comprueban sobre la cuenta registrada.
- `secrets.properties.example` y `docs/backend.md` (o `README` de despliegue) documentan `RECORDS_DEFAULT_QUOTA`.
- Frontend sin cambios: el cupo ya se muestra ("0 de 1 historias") y el aviso ya maneja el singular ("1 historia clínica").

## Risks / Trade-offs

- [Un tratante nuevo queda bloqueado tras su primera historia] → Es el comportamiento pedido; el aviso indica contactar al administrador, que amplía el cupo en "Usuarios".
- [E2E con backend real que crean varias historias con un usuario nuevo] → Los actuales crean una sola por usuario (registros, autoguardado, responsive); el de cupo asigna el suyo. Si alguno crea más, se ajusta en la tarea de tests.
- [Valor mal configurado] → La validación de la propiedad impide arrancar con un número fuera de 0–9999.

## Migration Plan

Sin migración de datos: solo afecta cuentas registradas después del despliegue. Rollback: `RECORDS_DEFAULT_QUOTA=` (vacío) vuelve al comportamiento anterior sin redeploy de código.
