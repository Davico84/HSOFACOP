> Solo frontend. Comandos desde `modules/frontend/` salvo que se indique. Revisado por Codex.

## 1. shadcn

- [x] 1.1 `openspec validate update-app-shell-tooltips --strict` (gate previo) y `git status` limpio como punto de partida
- [x] 1.2 `modules/frontend/components.json` a mano (D1) y `baseUrl` + `paths["@/*"]` en el `tsconfig.json` solución (solo para el CLI)
- [x] 1.3 `pnpm dlx shadcn@latest add tooltip` → `core/ui/tooltip.tsx` + `radix-ui`; revisar `git diff`: solo `tooltip.tsx`, `package.json`, `pnpm-lock.yaml`; `globals.css` intacto; no existe `modules/frontend/@/`
- [x] 1.4 `TooltipProvider` explícito en `RootLayout` y en el wrapper de `renderApp()` de `AppLayout.test.tsx` (`delayDuration={0}`) (D3)

## 2. Barra compacta

- [x] 2.1 `NavItem`: tooltip con el nombre cuando `compact` (`side="right"`, `lg:hidden`), `aria-label` conservado, sin `aria-describedby` (D2, D4)
- [x] 2.2 `SidebarLogoutButton`: tooltip "Cerrar sesión" cuando `compact` (D2, D4)

## 3. Tests (Scenarios de `app-shell` → "Navegación responsive", D5)

- [x] 3.1 "Tooltip en la barra compacta": por foco y por hover; `aria-label` presente; sin `title`; sin `aria-describedby`
- [x] 3.2 "Tooltip de cerrar sesión": foco → tooltip; `aria-label` presente; sin `title`
- [x] 3.3 "Sin tooltip en el cajón móvil"

## 4. Docs y verificación

- [x] 4.1 `docs/frontend.md §4.1`: `Tooltip` en `core/ui` y `TooltipProvider` en la raíz; `components.json` existe (en `modules/frontend/`); cómo añadir componentes (`add` + revisar `git diff` de `globals.css`)
- [x] 4.2 `pnpm validate` (typecheck + lint, incl. `react-refresh`, + tests, incl. `theme.test` y `no-literal-colors`) y `pnpm build` en verde
- [x] 4.3 Prueba manual en tablet (DevTools, 640–1023 px): tooltip al pasar el ratón y al tabular; ninguno en escritorio (≥ 1024 px) ni en el cajón móvil
- [x] 4.4 `openspec validate update-app-shell-tooltips --strict` (cierre)
