> Solo frontend. Antes de tocar el frontend, skill `frontend-guard`. Commits separados por scope (docs/commits.md).

## 1. Estado

- [ ] 1.1 `src/store/useSidebarStore.ts` (Zustand + `persist`, clave `hsfacop.sidebar`, inicial expandida; sin almacenamiento, en memoria) + tests

## 2. Barra lateral

- [ ] 2.1 `NavItem` y `SidebarLogoutButton`: `iconOnly` (`"below-lg"` | `"always"`); tooltip sin `lg:hidden` fijo cuando es `"always"`; textos `truncate`
- [ ] 2.2 `Sidebar`: `collapsed` → `w-16` en todos los anchos; transición del ancho con `motion-reduce:transition-none`; ícono de la marca (`brand.favicon`) cuando está contraída
- [ ] 2.3 Botón conmutador (`hidden lg:flex`, `aria-expanded`, `aria-controls`, nombre "Contraer/Expandir barra lateral", ícono y tooltip) conectado al store en `AppLayout`

## 3. Pruebas y cierre

- [ ] 3.1 Tests de `AppLayout`: contraer/expandir, `aria-expanded` y nombre, textos ocultos y tooltips, logo → ícono, preferencia recordada al recargar; los tests existentes de tablet y cajón siguen verdes; `pnpm validate` y E2E verdes
- [ ] 3.2 `docs/frontend.md` (patrón de barra contraíble y `useSidebarStore`); `docs/vision.md`: 🚧 al proponer, ✅ al archivar
