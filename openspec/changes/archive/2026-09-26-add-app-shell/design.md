## Context

Tras `add-authentication`, el router tiene dos zonas bajo `RootLayout` (bootstrap de sesión + toasts): `RequireGuest` (login/registro) y `RequireAuth` (hoy solo `/` → `HomeScreen` provisional). El frontend usa Tailwind + componentes propios en `modules/core/ui/` (`Button`, `Card`, `ThemeToggle`, `Logo`…); **no** están instalados Radix, `framer-motion` ni `recharts`, aunque `docs/frontend.md` los menciona como stack. Estándares aplicables: `docs/frontend.md §1` (screens/modules/layouts), `§4.3` (breakpoints y comportamiento de Sidebar), `§4.4` (accesibilidad), `§4.6` (slots vs lista de configuración).

## Goals / Non-Goals

**Goals:**
- Shell privado reutilizable como base de plantilla, accesible y responsive.
- Añadir una sección nueva = una entrada en la config de navegación + una ruta.
- Dashboard de ejemplo autocontenido (sin backend), fácil de sustituir por datos reales.

**Non-Goals:** métricas reales, endpoints, navegación por rol, perfil de usuario, nuevas dependencias (ver proposal).

## Decisions

### D1. `AppLayout` como ruta de layout anidada bajo `RequireAuth`
`RequireAuth` → `AppLayout` (sidebar + header + `<Outlet/>`) → pantallas privadas. Así los guards siguen decidiendo acceso y el layout solo aporta estructura; las rutas de invitado no lo heredan.
*Alternativa descartada*: meter el shell dentro de `RequireAuth` — mezcla autorización con presentación.

### D2. Componentes del shell en `modules/core/components/shell/`
`Sidebar`, `Header`, `NavItem`, `SidebarLogoutButton`, `MobileNavDrawer` y `navItems.ts` (config) viven en `core` porque son transversales y no dependen de otros módulos. Excepción controlada: el logout necesita `useLogout` de `modules/auth`; para respetar "core sin deps a otros módulos", `AppLayout` (en `layouts/`) obtiene `useLogout` y la sesión y los pasa por props: `user` al `Header`, `onLogout`/`isLoggingOut` a la `Sidebar` (y al cajón móvil).
**Cerrar sesión va al pie de la barra lateral** (decisión de revisión): la cabecera queda para identidad + tema. En tablet (barra compacta) es solo icono con `aria-label`.
*Alternativa descartada*: `Header`/`Sidebar` importando `modules/auth` directamente (rompe la regla de `core`).

### D3. Navegación por lista de configuración, no por slots
`navItems: NavItem[] = { label, icon, to }`. La sidebar decide qué renderizar y necesita metadatos por ítem (icono, etiqueta) → `docs/frontend.md §4.6` indica lista de configuración. Ítem activo con `NavLink` de react-router (aporta `aria-current="page"`); `end` en la raíz para no marcar Inicio en todas las rutas.

### D4. Responsive con Tailwind + estado local, sin librería de drawer
- Escritorio (`lg`, >1024px): sidebar fija expandida (icono + etiqueta).
- Tablet (`sm`–`lg`): sidebar fija solo iconos; la etiqueta queda como `aria-label`/texto `sr-only`.
- Móvil (<`sm`): sidebar oculta; botón hamburguesa en header abre un cajón superpuesto (`fixed` + fondo). Estado `open` local en `AppLayout` (no es estado global → no Zustand). Cierre en: cambio de ruta (`useLocation`), clic en fondo, `Escape` (listener `keydown` mientras está abierto).
Breakpoints de Tailwind por defecto (`sm` 640, `lg` 1024) aproximan `§4.3`; se acepta la diferencia 480↔640.
*Alternativa descartada*: añadir Radix `Dialog`/shadcn `Sheet` (+deps) para un único cajón; se reevaluará si aparecen más overlays.

### D5. Dashboard con datos estáticos locales, en su módulo
Las screens son hojas de composición de **una línea** (`frontend-guard`): `screens/dashboard/DashboardScreen.tsx` → `return <DashboardFeature />;`. La feature vive en `modules/dashboard/`:
- `components/DashboardFeature.tsx` (saludo + banner + grid + actividad), `components/RecentActivity.tsx`, `components/SampleDataBanner.tsx` — un componente por archivo.
- `data/sampleData.ts` (KPIs y actividad estáticos).
La tarjeta KPI **no conoce el dominio** → `core/components/StatCard.tsx` genérico (`label`, `value`, `icon`, `hint`), reutilizable por cualquier capacidad.
Sin React Query ni MSW: al no haber servidor, no aplica `§2`. Banner "Datos de ejemplo" visible. Cuando llegue la capacidad `dashboard` (#9) se sustituye `data/sampleData.ts` por un hook de dominio en `modules/dashboard/hooks/` sin tocar la screen.
*Alternativa descartada*: mock con MSW en runtime — añade complejidad y confunde datos de ejemplo con API real.

### D6. "Próximamente" genérico
`core/components/ComingSoon.tsx` (genérico, recibe `title`). `screens/ComingSoonScreen.tsx` es de una línea (`return <ComingSoon title={title} />;`) y la ruta le pasa el título; cada ítem de ejemplo (`/modulo-a`, `/modulo-b`) apunta a él. Rutas en `PATHS`.

### D7. Solo tokens de tema; sin Tooltip por ahora
- Colores exclusivamente vía tokens de `globals.css` (`primary`, `secondary`, `accent`, `muted`, `success`, `warning`…); **ningún hex/tamaño hardcodeado**, porque la paleta es la marca de la empresa y se cambia solo en `globals.css`.
- La barra de solo iconos (tablet) necesitaría `Tooltip` (`docs/frontend.md §4.1`), que no existe en `core/ui`, y el proyecto no tiene `components.json` (añadirlo con `shadcn init` reescribiría `globals.css`). Se usa `aria-label` + texto `sr-only` y **nunca** el atributo `title`. El Tooltip se incorporará en un change propio.
- Un componente por archivo en `screens/**` y `modules/*/components/**` (convención de `frontend-guard`, impuesta por `react/no-multi-comp` en `eslint.config.js`).

## Risks / Trade-offs

- [Cajón casero sin focus-trap completo] → foco al primer enlace al abrir, cierre con `Escape`, `aria-modal`/`role="dialog"`; aceptable para plantilla. Si se añade Radix, migrar a `Sheet`.
- [Breakpoints distintos a `§4.3` (480 vs 640)] → documentado; ajustable en `tailwind.config.cjs` sin tocar componentes.
- [Iconos sin etiqueta visible en tablet, sin Tooltip] → `aria-label` para lectores de pantalla; en escritorio la etiqueta es visible. Tooltip en change posterior.
- [Datos de ejemplo confundidos con reales] → banner explícito + Scenario que lo verifica.
- [Eliminar `HomeScreen.test.tsx` pierde el test del Scenario "Prueba base con MSW" de `project-foundation`] → el nuevo test del dashboard renderiza con `renderWithProviders` (MSW activo) y cubre ese Scenario.

## Migration Plan

Solo frontend; sin datos. Despliegue = merge. Rollback = revertir el commit (vuelve `HomeScreen`).

## Open Questions

- Nombres/iconos definitivos de los ítems de ejemplo: se usan "Módulo A"/"Módulo B" genéricos; cada proyecto derivado los reemplaza.
