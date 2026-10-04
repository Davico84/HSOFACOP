> Solo frontend. Antes de tocar el frontend, skill `frontend-guard`. Commits separados por scope (docs/commits.md).

## 1. Estado

- [x] 1.1 `src/store/useSidebarStore.ts` (Zustand + `persist`, clave `hsfacop.sidebar`, inicial expandida; sin almacenamiento, en memoria) + tests

## 2. Barra lateral

- [x] 2.1 `NavItem` y `SidebarLogoutButton`: `iconOnly` (`"below-lg"` | `"always"`); tooltip sin `lg:hidden` fijo cuando es `"always"`; textos `truncate`
- [x] 2.2 `Sidebar`: `collapsed` → `w-16` en todos los anchos; transición del ancho con `motion-reduce:transition-none`; ícono de la marca (`brand.favicon`) cuando está contraída
- [x] 2.3 Botón conmutador (`hidden lg:flex`, `aria-expanded`, `aria-controls`, nombre "Contraer/Expandir barra lateral", ícono y tooltip) conectado al store en `AppLayout`
- [x] 2.4 Ancho máximo: `<main>` con `mx-auto w-full max-w-screen-2xl` alrededor del `Outlet`; contenido de `Header` alineado al mismo ancho y padding (el borde y el fondo a todo el ancho)

## 3. Pruebas y cierre

- [x] 3.1 Tests de `AppLayout`: contraer/expandir, `aria-expanded` y nombre, textos ocultos y tooltips, logo → ícono, preferencia recordada al recargar; los tests existentes de tablet y cajón siguen verdes; E2E a 2560 px: contenido ≤ 1536 px y centrado con la barra expandida y contraída; `pnpm validate` y E2E verdes
- [x] 3.2 `docs/frontend.md` (patrón de barra contraíble y `useSidebarStore`); `docs/vision.md`: 🚧 al proponer, ✅ al archivar

## 4. Revisión del usuario

- [x] 4.1 Alcance del ancho máximo: el usuario eligió limitar el marco completo de la app (opción A): marco de 1920 px centrado con la barra junto al contenido, contenido de 1536 px; requirement, D8, `AppLayout` y E2E a 2560 px actualizados
