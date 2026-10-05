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
- La API usa una lista (`filledSteps: [1, 2, 5]`), no la máscara: es legible en el contrato; el servicio la convierte. Validación: `List<@Min(1) @Max(8) Integer>` + `@UniqueElements` (Hibernate Validator) → `400` en `filledSteps`. Se acepta al **crear** (`CreateRecordRequest`) y al **guardar** (`UpdateRecordRequest`; ausente = no cambia, igual que `lastStep`).
- **El servidor siempre marca el paso 1** (máscara `| 1`) al crear y al guardar con `filledSteps`: `patientName` es obligatorio, así que el paso 1 siempre tiene datos. Al crear sin `filledSteps` (o con `[]`) la historia nace con `[1]`; no se vuelve obligatorio en la API porque el servidor lo deduce.
- La respuesta devuelve los pasos persistidos. Se calculan sobre los valores **enviados** (el `sent` de `persist`, no los actuales), así que corresponden a ese guardado. `RecordNormalizer` puede descartar campos condicionados cuya condición no se cumple; un paso solo con ese dato podría figurar "con datos" hasta el siguiente guardado. Se acepta (solo afecta métricas) y se documenta.
- El formulario calcula la lista con la misma lógica de la navegación de pasos (`hasAnyData` contra la base), extraída a una función pura (`filledStepsOf(values)`) que usan el hook y el guardado; se envía en cada guardado (cambio de paso, "Guardar", autoguardado).
  - *Por qué no calcularlo en el servidor*: habría que duplicar en Java qué cuenta como dato en cada uno de los ~33 bloques del contenido y sus valores por defecto (p. ej. hábitos de succión "No"); dos implementaciones del mismo criterio se desincronizan. El dato solo alimenta métricas, no decisiones de seguridad: que lo informe el cliente es aceptable.
  - *Historias viejas*: quedan "sin calcular" hasta su próximo guardado con cambios. Se muestran aparte ("sin calcular") y "Para retomar" las incluye.
- **Completa = los 7 pasos clínicos (1–7) con datos.** El paso 8 (Firmas) se guarda en la máscara pero no cuenta para completitud, promedio ni pasos vacíos: sus nombres los completa la impresión y las firmas van a mano (decisión del usuario). Máscara clínica = `filled_steps & 127`; completa = `(filled_steps & 127) = 127`.

### Endpoints (paquete `dashboard`, solo lectura)
- `GET /api/dashboard/me` (`@PreAuthorize("hasRole('USER')")`; un `ADMIN` recibe `403`, porque su Inicio es solo global): `{ records: { total, createdThisMonth }, quota: { limit, used, reached }, completeness: { complete, inProgress, notComputed, averageFilledSteps }, missing: { withoutDocument, withoutBirthDate, withoutTreatmentStart, emptySteps: [{ step, count }] }, resume: [{ id, recordNumber, patientName, lastStep, filledSteps, updatedAt }] }`.
- `GET /api/dashboard/admin` (`@PreAuthorize ADMIN`, si no `403`): `{ users: { total, active, disabled, newThisMonth }, records: { total, createdThisMonth, complete, inProgress, notComputed, perMonth: [{ month: "2026-05", count }] }, topAuthors: [{ userId, fullName, status, records, averageFilledSteps }], quotas: { total, items: [{ userId, fullName, used, limit, reached }] } }`.
  - **Mismos nombres en ambos** (`complete` / `inProgress` / `notComputed`): en progreso = calculada y no completa; sin calcular = `filled_steps IS NULL`. "Para retomar" = en progreso + sin calcular.
  - `averageFilledSteps`: `Double` nullable (nulo si no hay calculadas), redondeado a 1 decimal en Java (`HALF_UP`); `filledSteps` en `resume` = cantidad de pasos clínicos con datos (nulo si sin calcular).
  - `emptySteps`: siempre los 7 pasos clínicos (con `count` 0 si ninguno), orden `count DESC, step ASC`.
- **SQL nativo** (`@Query(nativeQuery = true)` o `JdbcTemplate`): el `&` y los casts no existen en JPQL. Una consulta por bloque con `COUNT(*) FILTER (WHERE …)`: totales, mes, completas/en progreso/sin calcular, faltantes y vacíos por paso (`FILTER (WHERE filled_steps IS NOT NULL AND filled_steps & 4 = 0)` para el paso 3, etc.). Pasos con datos = `bit_count((filled_steps & 127)::int::bit(8))` (PG ≥ 14). Nunca se carga `content`.
- **Zona horaria** (`docs/backend.md §8.2`): `created_at` es `TIMESTAMPTZ` (UTC). El inicio del mes en curso y de los 6 meses se calcula en Java con el `Clock` (zona de la app) y se pasa como `Instant` a la consulta; `perMonth` agrupa con `date_trunc('month', created_at AT TIME ZONE :zone)`, con `:zone` = la zona del `Clock`. Los meses sin historias se rellenan con 0 en Java. Los tests usan `Clock.fixed` con zona explícita (`America/Lima`).
- **Quién cuenta dónde**: `users` = todas las cuentas según `status`. Totales de historias, completitud y `perMonth` = **todas** las historias (también las de autor `ADMIN` o de cuentas deshabilitadas). `topAuthors` = solo cuentas `USER` (activas y deshabilitadas, con `status` en la respuesta para marcarlas), hasta 5, por cantidad desc y nombre asc. `quotas` = solo cuentas `USER` **activas** con cupo (las deshabilitadas no pueden crear historias).
- `quotas`: condición `used >= limit OR used >= ceil(0.8 * limit)` (cupo 0 y cupo reducido por debajo de lo creado = lleno). Orden: llenas primero, luego por razón de uso `CASE WHEN limit = 0 THEN 1 ELSE used::numeric / limit END` desc, luego nombre; hasta 10, más `total` de las que cumplen. Sin división por cero.
- Los DTOs solo exponen `userId` y `fullName` de las cuentas (nunca el correo). Listas siempre presentes (vacías, nunca `null`); nullable solo `averageFilledSteps`, `quota.limit`, `lastStep` y `filledSteps` de cada historia para retomar.
- DTOs con `operationId` (`getMyDashboard`, `getAdminDashboard`) registrados en `OpenApiContractIT`.

### Frontend (`modules/dashboard`)
- `DashboardFeature` elige por rol: `UserDashboard` o `AdminDashboard`. Hooks `useMyDashboard` / `useAdminDashboard` (React Query, `dashboardKeys`), estados de carga/error/reintento como el resto.
- Componentes, **uno por archivo** (`react/no-multi-comp`), incluidos sus skeletons y estados vacíos: `UserDashboard`, `AdminDashboard`, tarjetas con `StatCard`, `ResumeList` (enlaces `recordPath(id, lastStep ?? 1)`), `EmptyStepsList` (nombre del paso desde `RECORD_STEPS`), `MonthlyBars`, `TopAuthorsList`, `QuotaAlerts`, `DashboardLoading`, `DashboardEmpty`.
- **Sin tablas anchas**: tratantes y cupos se muestran como listas de filas (nombre + valor + barra), que caben a 375 px sin desplazamiento horizontal; si alguna creciera a tabla, va dentro de `ScrollableX` (`docs/frontend.md`).
- **Accesibilidad**: cada barra muestra su valor como texto (no solo largo o color), las listas son `<ul>`/`<ol>` con rótulos, los enlaces de "Para retomar" tienen nombre accesible ("Retomar historia AEO-003 en el paso 6") y foco visible.
- Barras proporcionales con CSS: divisor `Math.max(...valores, 1)` (sin `NaN%` con todo en cero); cada barra con texto accesible (`aria-label` / valor visible).
- Meses: `"2026-05"` se rotula con `split("-")` y una tabla fija `["ene", "feb", …]`, **nunca** `new Date("2026-05")` (se interpreta como UTC y en Perú mostraría "abr").
- Guardar o crear una historia, cambiar un cupo o el estado de una cuenta invalidan `dashboardKeys.all`.
- Se borran `data/sampleData.ts`, `SampleDataBanner`, `RecentActivity` y sus tests.

## Risks / Trade-offs

- [El cliente informa `filledSteps`] → Un cliente modificado podría mentir; solo afecta métricas. Se valida rango y formato.
- [Historias viejas sin calcular] → Mientras no se vuelvan a guardar, completitud y pasos vacíos las excluyen; Inicio lo dice junto a la completitud ("N sin calcular: se calculan al volver a guardarlas"). Si esa categoría domina por meses, un change futuro puede recalcularlas (p. ej. al abrirlas). Fuera de alcance aquí.
- [Consultas sobre todas las historias del ADMIN] → Agregadas con índices existentes (`author_id`, `updated_at`); volumen esperado bajo (cientos/miles).
- [Zona de la app] → El corte de mes usa la zona del `Clock` (hoy la del servidor); si se despliega en otra zona, se fija la del `Clock` a la de la clínica.

## Migration Plan

V13 agrega `filled_steps` nullable con CHECK; no toca datos. Contrato y cliente regenerados en el mismo PR. Rollback: la columna se ignora.
