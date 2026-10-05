## Context

- `RecordForm.goTo(target)` valida los campos del paso (`form.trigger`), guarda la historia completa (`useSaveRecord`, `PUT` con `version`) y al terminar hace `form.reset(toFormValues(saved))`, que reemplaza **todos** los valores por los del servidor. Hoy solo se llama al cambiar de paso o con "Guardar".
- `useLeaveGuard` avisa al salir con cambios (navegación interna y `beforeunload`); en móviles `beforeunload` no es fiable y el sistema puede descartar la pestaña sin aviso.
- La historia se abre en `?paso=N` (`parseStep`, sin parámetro = 1). Los enlaces del listado: número (`recordPath(id)`) y "Editar" (`recordPath(id, 1)`).
- Un `409 stale-record` muestra `StaleRecordBanner` con "Recargar".

## Goals / Non-Goals

**Goals:** no perder lo escrito al cambiar de app o cerrar en móviles; retomar en el paso donde se trabajó, en cualquier dispositivo; sin ruido (sin toasts por cada guardado).

**Non-Goals:** autoguardar historias nuevas, modo sin conexión, historial de versiones, edición colaborativa en tiempo real.

## Decisions

### Autoguardado (frontend)
- **Hook `useAutosave`** en `modules/records/hooks`, usado por `RecordForm` solo si `record` existe. Se suscribe a los cambios del formulario (`form.watch` / `useWatch`) y, con `isDirty`, programa un guardado a los **3 s** del último cambio (debounce), con un **mínimo de 10 s entre autoguardados** (si toca antes, se espera hasta cumplirlos). También guarda de inmediato, sin respetar el mínimo, en `visibilitychange` → `hidden` y en `pagehide`; cambiar de paso y "Guardar" tampoco esperan.
  - *Por qué 3 s + 10 s*: cada guardado envía la historia completa (decenas de KB, 2 consultas: `SELECT` + `UPDATE`). Con pausas cortas frecuentes, el mínimo limita a 6 autoguardados por minuto por usuario; perder como máximo ~10 s de trabajo es aceptable y al cambiar de app se guarda igual. Estimación: 30 tratantes llenando a la vez ≈ 3 guardados/s, carga despreciable para PostgreSQL; lo que más se ahorra son datos móviles.
- **Misma ruta de guardado que hoy** (`save.mutate` con `version`), extraída de `goTo` a una función `persist({ lastStep, silent })` que comparten el autoguardado, "Guardar" y el cambio de paso. Validación del paso actual con `form.trigger(fields)` (sin mover el foco en el autoguardado); si no pasa → estado `invalid`, no se envía.
- **No pisar lo escrito durante el guardado**: al terminar se hace `form.reset(toFormValues(saved), { keepDirtyValues: true })`. Los campos que el usuario cambió (sucios) conservan su valor; los demás toman lo normalizado por el servidor; los nuevos valores por defecto pasan a ser los guardados, así que solo queda sucio lo escrito después del envío y el siguiente autoguardado lo envía.
  - *Alternativa descartada*: bloquear el formulario mientras guarda (molesto al escribir rápido en el celular).
- **Un guardado a la vez**: si llega un cambio mientras uno está en curso, se reprograma para cuando termine (no se envían dos `PUT` con la misma versión, que daría un falso 409).
- **Estado e indicador** (`idle | saving | saved | invalid | failed`), en la línea bajo el título junto al nombre del paciente (reemplaza "· Cambios sin guardar"): "Guardando…", "Guardado", "Sin guardar: corrige los campos marcados", "No se pudo guardar" + botón "Reintentar". Con `aria-live="polite"` para lectores de pantalla.
- **Errores**: red/servidor → `failed`, se reintenta al siguiente cambio y en el evento `online`; `409` → `StaleRecordBanner` (como hoy) y el autoguardado queda en pausa hasta recargar; `400` por campo → se marcan los campos (como hoy) y estado `invalid`.
- **Sin toast** en el autoguardado; "Guardar" y el cambio de paso conservan el comportamiento actual (el toast de "Historia guardada" se mantiene solo en "Guardar").
- `useLeaveGuard` no cambia: con un guardado pendiente o fallido sigue avisando al salir.

### Último paso (backend + frontend)
- **Columna `last_step INTEGER NULL`** con `CHECK (last_step BETWEEN 1 AND 8)` (V12). Nula = historias anteriores → paso 1.
- **`UpdateRecordRequest.lastStep`** opcional (`@Min(1) @Max(8)`); ausente = no cambia. `RecordResponse.lastStep` (nullable). Crear (`POST`) no lo recibe: la historia nueva queda con `null` (se abre en el paso 1, donde se trabajó) hasta su primer guardado con cambios.
- **Qué paso se envía**: al cambiar de paso, el destino; al autoguardar o "Guardar", el paso actual. Recorrer pasos sin cambios no guarda, así que no lo cambia (decisión: "donde se dejó" = donde se trabajó, no donde se miró).
- **Abrir en el último paso**: `RecordFormFeature`, si la URL no trae `paso`, reemplaza la URL por `?paso=<lastStep ?? 1>` (`replace`, sin entrada nueva en el historial). Los enlaces del listado ("Editar" incluido) dejan de fijar `paso=1`.

## Risks / Trade-offs

- [Más peticiones `PUT` con la historia completa] → Debounce de 3 s, mínimo 10 s entre autoguardados y solo con cambios. Cada `UPDATE` deja una versión muerta de la fila que limpia el autovacuum; a este volumen no es un problema. Enviar solo lo cambiado (parche) se descartó: exige rehacer el guardado del backend y no se justifica con estos números.
- [`keepDirtyValues` y campos condicionados que el servidor descarta] → Si el usuario no tocó el campo, toma el valor del servidor; si lo tocó, conserva el suyo y se reenvía (el servidor lo vuelve a descartar si su condición no se cumple). Sin pérdida de datos.
- [Guardar al ocultar la pestaña puede no completarse si el sistema mata la pestaña de inmediato] → Es el mejor esfuerzo; el autoguardado periódico ya guardó casi todo antes.
- [Dos dispositivos con la misma historia abierta] → Más 409 que hoy (antes solo al cambiar de paso); el aviso existente permite recargar. Documentado como non-goal.
- [Autoguardar valida y marca errores mientras se escribe] → Solo tras el debounce y solo los campos del paso actual; es el mismo mensaje que al cambiar de paso.

## Migration Plan

V12 agrega una columna nullable con CHECK; no toca datos existentes. Contrato y cliente regenerados en el mismo PR. Rollback: la columna se ignora si el frontend anterior no envía `lastStep`.
