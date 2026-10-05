## Context

- La historia (`RecordForm`) tiene una cabecera con el título a la izquierda y "Vista previa" (`RecordPrintLink` / `RecordPrintPending`) a la derecha. No hay enlace de vuelta.
- El listado guarda su búsqueda y página en la URL (`/historias?q=…&pagina=N`).
- La vista previa recuerda de dónde se vino con `location.state.returnTo`, pero ese estado no sobrevive a la navegación dentro del formulario: cambiar de paso (`setSearchParams`) y la redirección al crear (`/historias/nueva` → `/historias/{id}?paso=2`) lo pierden.
- `useLeaveGuard` (bloqueador de React Router) ya confirma cualquier navegación con cambios sin guardar.

## Goals / Non-Goals

**Goals:**
- Un enlace de vuelta visible, en la posición estándar de navegación (arriba a la izquierda, sobre el título).
- Volver al listado exacto (búsqueda y página) sin depender del historial del navegador.

**Non-Goals:**
- Migas de pan generales ni componente compartido entre módulos (se generaliza cuando otra pantalla lo necesite).
- Cambiar el "Volver" de la vista previa.

## Decisions

- **Recordar la URL del listado en un store Zustand** (`src/store/useRecordsListStore.ts`, `listUrl: string | null`, `setListUrl`, `clear`), con `persist` sobre `sessionStorage` (`hsfacop.records-list`). `RecordsFeature` lo actualiza en un efecto cada vez que cambia su `search` (`/historias` + `?q…&pagina…`).
  - *Por qué no `location.state`*: se pierde al cambiar de paso y al crear; habría que reenviarlo en cada navegación del formulario.
  - *Por qué no `navigate(-1)`*: el historial incluye cada paso visitado (y la vista previa); volver podría tardar varios "atrás" o salir de la app si se entró por enlace directo.
  - *Por qué `sessionStorage`*: sobrevive a recargar la historia, es por pestaña (dos pestañas con búsquedas distintas no se pisan) y se borra al cerrar la pestaña. Es estado de cliente (UI), no datos del servidor: cabe en Zustand según `docs/frontend.md §3`.
- **Borrar al cerrar sesión**: la búsqueda puede contener nombres o documentos de pacientes; `useAuth` llama a `clear()` junto con `queryClient.clear()` para que otra cuenta en la misma pestaña no la herede.
- **Componente `RecordsBackLink`** (`modules/records/components`): `Link` con `ArrowLeft` y el texto "Historias clínicas", estilo de enlace discreto (`text-sm text-muted-foreground hover:text-foreground`, anillo de foco del tema), destino `listUrl ?? PATHS.RECORDS`. Va dentro del `<header>` de `RecordForm`, en una línea propia encima del `h1`, para edición y nueva. `RecordNotFound` usa el mismo destino en su botón.
- **Cambios sin guardar**: no se agrega lógica; el `Link` navega y `useLeaveGuard` bloquea y muestra `LeaveConfirmDialog`.
- Solo se aceptan destinos que empiezan con `/historias` (el valor viene de `sessionStorage`; si no cumple se usa `/historias`).

## Risks / Trade-offs

- [Listado recordado desactualizado: la historia abierta ya no coincide con la búsqueda o la página quedó vacía] → El listado ya maneja página vacía ("Volver a la página anterior") y la búsqueda se vuelve a consultar al entrar.
- [`sessionStorage` bloqueado] → `persist` queda en memoria; el enlace funciona dentro de la sesión de la app y, tras recargar, vuelve a `/historias`.
- [Un store global para un dato de un módulo] → Sigue la convención de `src/store/`; es pequeño y se elimina sin efectos si se cambia el enfoque.
