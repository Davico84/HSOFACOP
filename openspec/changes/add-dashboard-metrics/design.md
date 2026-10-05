## Context

- Inicio (`screens/dashboard` → `modules/dashboard/DashboardFeature`) muestra KPIs y actividad de ejemplo (`data/sampleData.ts`), sin backend. `core/components/StatCard` ya existe.
- Datos disponibles: `orthodontic_records` (autor, columnas del paciente, `created_at`, `updated_at`, `last_step`, `content` JSONB), `users` (`role`, `status`, `created_at`, `record_quota`) y el cupo (`RecordQuotaView`).
- "Pasos con datos" hoy solo se calcula en el navegador (`useStepStatus`: `hasAnyData` contra los valores por defecto de una historia nueva) con la historia abierta.

## Goals / Non-Goals

**Goals:** métricas útiles por rol en Inicio, calculadas en el servidor con consultas agregadas; "datos faltantes" y "para retomar" basados en los pasos con datos.

**Non-Goals:** filtros de fechas, exportar, gráficos con librería, tiempo real, recalcular historias viejas sin abrirlas, métricas del ADMIN como tratante.

## Decisions

### Pasos con datos: los envía el cliente al guardar
- Columna `filled_steps SMALLINT NULL` (V13), máscara de bits: bit `n-1` = paso `n` con datos; `CHECK (filled_steps BETWEEN 0 AND 255)`; nula = sin calcular.
- La API usa una lista (`filledSteps: [1, 2, 5]`, cada uno 1–8, sin repetidos), no la máscara: es legible en el contrato; el servicio la convierte. Ausente = no cambia (igual que `lastStep`).
- El formulario calcula la lista con la misma lógica de la navegación de pasos (`hasAnyData` contra la base), extraída a una función pura (`filledStepsOf(values)`) que usan el hook y el guardado; se envía en cada guardado (cambio de paso, "Guardar", autoguardado).
  - *Por qué no calcularlo en el servidor*: habría que duplicar en Java qué cuenta como dato en cada uno de los ~33 bloques del contenido y sus valores por defecto (p. ej. hábitos de succión "No"); dos implementaciones del mismo criterio se desincronizan. El dato solo alimenta métricas, no decisiones de seguridad: que lo informe el cliente es aceptable.
  - *Historias viejas*: quedan "sin calcular" hasta su próximo guardado con cambios. Se muestran aparte ("sin calcular") y "Para retomar" las incluye.
- Completa = 8 pasos con datos.

### Endpoints (paquete `dashboard`, solo lectura)
- `GET /api/dashboard/me` (cualquier autenticado, pensado para `USER`): `{ records: { total, createdThisMonth }, quota: { limit, used, reached }, completeness: { complete, inProgress, notComputed, averageFilledSteps }, missing: { withoutDocument, withoutBirthDate, withoutTreatmentStart, emptySteps: [{ step, count }] }, resume: [{ id, recordNumber, patientName, lastStep, filledSteps, updatedAt }] }`.
- `GET /api/dashboard/admin` (`@PreAuthorize ADMIN`, si no `403`): `{ users: { total, active, disabled, newThisMonth }, records: { total, createdThisMonth, complete, incomplete, notComputed, perMonth: [{ month: "2026-05", count }] }, topAuthors: [{ userId, fullName, records, averageFilledSteps }], quotas: [{ userId, fullName, used, limit, reached }] }`.
- Consultas agregadas (JPQL/nativas con `COUNT`, `SUM(CASE…)`, `GROUP BY`), nunca se carga `content`. Conteo de bits en SQL con `(filled_steps & 1 <> 0)::int + …` (sin `bit_count`, que no aplica a enteros en PG16). `emptySteps`: por paso, historias calculadas cuyo bit está apagado.
- "Mes en curso" y los 6 meses: según el `Clock` de la app (`ClockConfig`, zona del servidor); los meses sin historias se rellenan con 0 en Java.
- `topAuthors`: hasta 5, por cantidad desc y nombre; `averageFilledSteps` sobre sus historias calculadas (nulo si ninguna). `quotas`: solo cuentas `USER` con cupo y `used >= ceil(0,8 × limit)` o lleno; cupo 0 cuenta como lleno.
- DTOs con `operationId` (`getMyDashboard`, `getAdminDashboard`) registrados en `OpenApiContractIT`.

### Frontend (`modules/dashboard`)
- `DashboardFeature` elige por rol: `UserDashboard` o `AdminDashboard`. Hooks `useMyDashboard` / `useAdminDashboard` (React Query, `dashboardKeys`), estados de carga/error/reintento como el resto.
- Componentes: tarjetas con `StatCard`; `ResumeList` (enlaces `recordPath(id, lastStep ?? 1)`), `EmptyStepsList` (nombre del paso desde `RECORD_STEPS`, barras proporcionales con CSS), `MonthlyBars` (barras CSS, mes abreviado en español, con texto accesible), `TopAuthorsTable`, `QuotaAlerts`.
- Guardar una historia o cambiar un cupo invalida `dashboardKeys.all`.
- Se borran `data/sampleData.ts`, `SampleDataBanner`, `RecentActivity` y sus tests.

## Risks / Trade-offs

- [El cliente informa `filledSteps`] → Un cliente modificado podría mentir; solo afecta métricas. Se valida rango y formato.
- [Historias viejas sin calcular] → Mientras no se vuelvan a guardar, completitud y pasos vacíos las excluyen; se muestran como "sin calcular" para no engañar.
- [Consultas sobre todas las historias del ADMIN] → Agregadas con índices existentes (`author_id`, `updated_at`); volumen esperado bajo (cientos/miles).
- [Mes según la zona del servidor] → Si el servidor no está en la zona de la clínica, el corte del mes puede correrse horas; se documenta y se usa el `Clock` para poder ajustarlo.

## Migration Plan

V13 agrega `filled_steps` nullable con CHECK; no toca datos. Contrato y cliente regenerados en el mismo PR. Rollback: la columna se ignora.
