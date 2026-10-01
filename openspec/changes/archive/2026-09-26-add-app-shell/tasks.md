> Solo frontend (`modules/frontend`). Sin tareas de backend: el change no toca API, persistencia ni contrato.

## 1. Rutas y configuración de navegación

- [x] 1.1 Añadir `MODULE_A` (`/modulo-a`) y `MODULE_B` (`/modulo-b`) a `routes/paths.ts`
- [x] 1.2 Crear `modules/core/components/shell/navItems.ts` con la lista `NavItem[]` (`label`, `icon` de lucide, `to`): Inicio, Módulo A, Módulo B (D3)

## 2. Componentes del shell (core)

- [x] 2.1 `NavItem` sobre `NavLink` (`end` en la raíz, estilos de activo, etiqueta visible o `sr-only` + `aria-label` según variante compacta; sin atributo `title`, solo tokens de tema) (D7)
- [x] 2.2 `Sidebar` (`<aside>` + `<nav aria-label>`) que recorre `navItems`, con `SidebarLogoutButton` al pie (`onLogout`, `isLoggingOut` por props); variantes: expandida (`lg`), iconos (`sm`–`lg`) y contenido del cajón móvil (D2, D4)
- [x] 2.3 `Header` (`<header>`) con botón de menú solo en móvil (`aria-expanded`, `aria-controls`), identidad (`fullName ?? email` + rol) y `ThemeToggle`; recibe `user`, `onMenuClick`, `menuOpen` por props (D2, sin importar `modules/auth`)

## 3. Layout privado y cajón móvil

- [x] 3.1 `layouts/AppLayout.tsx`: compone `Sidebar` + `Header` + `<main><Outlet/></main>`; obtiene sesión (`useSessionStore`) y `useLogout` y los pasa al `Header` (D1, D2)
- [x] 3.2 Cajón móvil: estado `open` local; `role="dialog"` + `aria-modal`, fondo clicable que cierra, cierre con `Escape`, cierre al cambiar de ruta (`useLocation`), foco al primer enlace al abrir (D4)

## 4. Pantallas

- [x] 4.1 `core/components/StatCard.tsx` genérico (`label`, `value`, `icon`, `hint`) sobre `Card`, solo tokens de tema (D5, D7)
- [x] 4.2 `modules/dashboard/data/sampleData.ts` (KPIs y actividad reciente estáticos)
- [x] 4.3 `modules/dashboard/components/`: `SampleDataBanner`, `RecentActivity` y `DashboardFeature` (saludo con nombre desde `useSessionStore`, banner, grid de `StatCard`, actividad) — un componente por archivo (D5)
- [x] 4.4 `screens/dashboard/DashboardScreen.tsx` de una línea: `return <DashboardFeature />;`
- [x] 4.5 `core/components/ComingSoon.tsx` genérico + `screens/ComingSoonScreen.tsx` de una línea con `title` por prop (D6)
- [x] 4.6 `routes/index.tsx`: `RequireAuth` → `AppLayout` → `ROOT` (Dashboard), `MODULE_A`/`MODULE_B` (ComingSoon)
- [x] 4.7 Eliminar `screens/HomeScreen.tsx` y `screens/HomeScreen.test.tsx`

## 5. Tests (Vitest + RTL, derivados de los Scenario de `app-shell`)

- [x] 5.1 Layout privado: "Ruta privada dentro del shell" y "Rutas de invitado sin shell" (router en memoria con sesión autenticada / sin sesión)
- [x] 5.2 Navegación: "Ítem activo resaltado", "Navegar a un ítem de ejemplo" y "Ruta privada inexistente"
- [x] 5.3 Identidad y logout: "Identidad del usuario con nombre", "Identidad del usuario sin nombre" y "Cerrar sesión desde la barra lateral" (MSW para `/auth/logout`, botón deshabilitado durante la petición)
- [x] 5.4 Responsive/cajón: "Abrir el cajón en móvil", "Cerrar el cajón al navegar" y "Cerrar el cajón con Escape o clic fuera"
- [x] 5.5 Dashboard: "Dashboard tras iniciar sesión" y "Datos marcados como ejemplo" (sin peticiones: handler MSW `onUnhandledRequest` o espía); cubre también el Scenario "Prueba base con MSW" de `project-foundation` que cubría `HomeScreen.test.tsx`

## 6. Verificación y docs

- [x] 6.1 `pnpm validate` en verde (typecheck + lint + test)
- [x] 6.2 Prueba manual en `pnpm dev`: escritorio, tablet y móvil (DevTools), tema claro/oscuro, logout
- [x] 6.3 `openspec validate add-app-shell --strict`
