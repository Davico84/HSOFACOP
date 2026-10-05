## Why

"Inicio" muestra todavía el dashboard de ejemplo de la plantilla (KPIs y actividad inventados). El tratante no ve cuánto lleva, qué le falta ni dónde retomar, y el ADMIN no tiene una vista del uso del sistema (cuentas, historias, cupos). `docs/vision.md` ya prevé la capacidad `dashboard` con métricas reales; con historias, cupos y último paso construidos, hay datos para hacerla.

## What Changes

- **Inicio del tratante (USER)** con métricas de sus historias:
  - **Historias y cupo**: total, creadas este mes y uso del cupo ("3 de 5" o "sin límite").
  - **Completitud**: completas (los 7 pasos clínicos con datos; Firmas no cuenta porque se completa a mano sobre el papel), en progreso y promedio de pasos clínicos con datos.
  - **Datos faltantes**: historias sin documento, sin fecha de nacimiento y sin fecha de inicio de tratamiento; pasos clínicos que más se dejan vacíos.
  - **Para retomar**: sus historias incompletas más recientes, cada una con enlace que abre en el último paso trabajado.
- **Inicio del ADMIN** con métricas globales (solo globales, no las suyas como tratante):
  - **Usuarios**: total de cuentas, activas y deshabilitadas, nuevas este mes.
  - **Historias**: total, creadas este mes, completas, en progreso y sin calcular, y creadas por mes en los últimos 6 meses (barras simples).
  - **Tratantes**: los que más historias tienen, con su completitud promedio.
  - **Cupos**: tratantes con el cupo lleno o al 80 % o más (los 10 más cerca del tope y el total).
- **Pasos con datos guardados con la historia**: el formulario ya sabe qué pasos tienen datos (la navegación de pasos lo muestra); ahora lo envía al crear y al guardar (`filledSteps`) y el servidor lo guarda (migración **V13**), para poder sumarlo en las métricas sin abrir cada historia.
- **BREAKING (solo UI)**: se elimina el dashboard de ejemplo (KPIs, actividad y aviso "Datos de ejemplo").

## Capabilities

### New Capabilities
- `dashboard`: métricas de Inicio por rol (tratante y ADMIN) calculadas en el servidor.

### Modified Capabilities
- `orthodontic-records`: nuevo requisito "Pasos con datos guardados con la historia".
- `app-shell`: se elimina el requisito "Dashboard de inicio con datos de ejemplo" (lo reemplaza `dashboard`).

## Impact

- Backend: `V13__record_filled_steps.sql`; `filledSteps` en `CreateRecordRequest`, `UpdateRecordRequest` y `RecordResponse`; nuevo paquete `dashboard` con `GET /api/dashboard/me` (USER) y `GET /api/dashboard/admin` (ADMIN), consultas agregadas (sin traer historias completas).
- Contrato `contracts/openapi.json` y cliente regenerados.
- Frontend: `modules/dashboard` reescrito (sin `sampleData`, `SampleDataBanner`, `RecentActivity`), `StatCard` de `core` reutilizado; `records` envía `filledSteps` al crear y al guardar; guardar una historia, cambiar un cupo o el estado de una cuenta refrescan las métricas.
- Guías: `docs/domain.md` (`OrthodonticRecord.filledSteps`), `docs/vision.md` (`dashboard` construida).

## Non-goals

- Filtros por rango de fechas, exportar métricas o informes.
- Librería de gráficos (`recharts` está en el stack pero no instalado): las barras por mes se dibujan con CSS.
- Métricas en tiempo real (se recalculan al entrar a Inicio).
- Calcular los pasos con datos de historias viejas sin abrirlas: quedan "sin calcular" hasta su próximo guardado.
- Métricas del ADMIN como tratante.
