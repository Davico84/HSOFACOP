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

## 4. Pendiente (revisión del usuario, antes de archivar)

- [ ] 4.1 Decidir el alcance del ancho máximo. Hoy (D8) limita solo el contenido: en pantallas muy anchas (p. ej. 2679 px) queda un hueco entre la barra lateral, pegada al borde, y el contenido centrado. Opciones:
  - **A (recomendada):** limitar el marco completo de la app (barra + cabecera + contenido, ~1920 px) y centrarlo; la barra viaja con el contenido.
  - **B:** contenido de 1536 px como máximo alineado a la izquierda, junto a la barra; el sobrante queda a la derecha.

  Al decidir: actualizar el requirement "Ancho máximo del contenido", D8, `AppLayout`/`Header` y el E2E a 2560 px.
