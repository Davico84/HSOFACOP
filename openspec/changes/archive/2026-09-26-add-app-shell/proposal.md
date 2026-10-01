## Why

El proyecto se usará como **plantilla base** para proyectos pequeños: ya trae registro e inicio de sesión (`authentication`), pero tras autenticarse el usuario aterriza en un `HomeScreen` provisional (saludo + botón de salir) sin estructura de aplicación. Falta el **marco privado** (navegación, cabecera con usuario, cierre de sesión) y una **página de inicio tipo dashboard** que sirva de punto de partida para cualquier módulo futuro.

## What Changes

- **Nueva capacidad `app-shell`** (técnica/plataforma, solo frontend):
  - **Layout privado** (`layouts/AppLayout`) que envuelve todas las rutas autenticadas: **sidebar** con navegación declarada por configuración (Inicio + ítems de ejemplo), **header** con nombre y rol del usuario y conmutador de tema; **cerrar sesión al pie de la sidebar**.
  - **Responsive** según `docs/frontend.md §4.3`: sidebar expandida en escritorio, barra de iconos en tablet y **cajón (drawer)** con botón de menú en móvil.
  - **Dashboard de inicio** (`screens/dashboard/DashboardScreen`) en la ruta raíz privada: saludo al usuario, tarjetas KPI y lista de "actividad reciente" con **datos estáticos de ejemplo**, marcados visiblemente como "Datos de ejemplo".
  - Página genérica **"Próximamente"** para los ítems de navegación de ejemplo (demuestra el enrutado anidado dentro del shell).
- **Se elimina** el `HomeScreen` provisional (y su test), sustituido por el dashboard.
- Sin nuevas dependencias: se reutilizan `lucide-react`, Tailwind y los componentes de `modules/core/ui/`.

## Capabilities

### New Capabilities
- `app-shell`: marco de la zona privada — layout con sidebar/header responsive, navegación por configuración, cierre de sesión desde la cabecera y dashboard de inicio con datos de ejemplo.

### Modified Capabilities
_(ninguna)_ — `authentication` ya especifica "redirige al panel correspondiente a su rol" y el logout; este change solo materializa ese panel sin cambiar esos requirements.

## Non-goals

- **Métricas reales** / endpoint `/api/dashboard/*` → capacidad de negocio `dashboard` (roadmap #9), que sigue planeada.
- **Backend**: ningún endpoint, migración ni cambio en el contrato OpenAPI.
- **Navegación por rol** (ocultar ítems según `ADMIN`/`USER`) y paneles diferenciados por rol → cuando existan módulos reales (`roleHome` queda igual).
- **Perfil de usuario / menú de cuenta** (editar datos, cambiar contraseña) → capacidad `users`.
- Gráficas (`recharts`) y animaciones (`framer-motion`): no se añaden dependencias para la plantilla.

## Impact

- **Frontend** (`modules/frontend/src`):
  - Nuevos: `layouts/AppLayout.tsx`, `modules/core/components/shell/` (sidebar/header del shell + config de navegación), `modules/core/components/StatCard.tsx` y `ComingSoon.tsx` (genéricos), `modules/dashboard/` (feature del dashboard + datos de ejemplo), `screens/dashboard/DashboardScreen.tsx` y `screens/ComingSoonScreen.tsx` (de una línea), nuevas constantes en `routes/paths.ts`.
  - Modificados: `routes/index.tsx` (rutas privadas anidadas bajo `AppLayout`).
  - Eliminados: `screens/HomeScreen.tsx` y `HomeScreen.test.tsx`.
  - Tests Vitest + RTL derivados de los Scenario (ver `docs/testing.md`).
- **Backend / contrato / CI**: sin cambios. Gate: `pnpm validate`.
- **Docs vivos**: al proponer, enlazar el change en `docs/vision.md §3`; al archivar, marcar `app-shell` construida. `docs/domain.md` no cambia (no toca dominio).
