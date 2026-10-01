## Why

En tablet la barra lateral del `app-shell` es **solo iconos**: la etiqueta de cada sección queda como `aria-label`/`sr-only`, útil para lectores de pantalla pero **invisible** para quien usa ratón o teclado. `docs/frontend.md §4.1` pide un `Tooltip` en estos casos (nunca el atributo `title`), y el change `add-app-shell` lo dejó pendiente porque faltaba `components.json` y el proyecto usaba Tailwind 3. Con Tailwind 4 ya migrado, el registro de shadcn encaja sin adaptar.

## What Changes

- **`components.json`** (escrito a mano, **nunca `shadcn init`**) para Tailwind v4: estilo `new-york` (Radix), `tailwind.config` vacío, CSS `src/styles/globals.css`, alias a `@/modules/core/{ui,components,utils,hooks}`. Paths del alias también en el `tsconfig.json` solución para que el CLI resuelva `@/`.
- **`core/ui/tooltip.tsx`** generado con `pnpm dlx shadcn@latest add tooltip` (dependencia `radix-ui`), verificando con `git diff` que no toca `globals.css`.
- **Barra compacta con tooltips**: cada ítem de navegación y "Cerrar sesión" muestran su nombre en un tooltip al pasar el ratón o al recibir el foco con teclado. Solo en tablet (en escritorio la etiqueta ya es visible; en el cajón móvil también). El `aria-label` se mantiene.
- **Docs**: `docs/frontend.md §4.1` (Tooltip disponible, `components.json` existe y cómo añadir componentes).

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `app-shell`: **MODIFIED** requirement "Navegación responsive" — la barra compacta (tablet) muestra el nombre de cada ítem en un tooltip al pasar el ratón o enfocar.

## Non-goals

- Tooltips en otros componentes (botones solo icono de la cabecera, etc.): se añadirán cuando cada pantalla lo necesite.
- Añadir más componentes shadcn (`dialog`, `sheet`…): solo `tooltip`.
- `@base-ui/react`: se usa la variante Radix (`docs/frontend.md §4.1`: Base UI solo si Radix no cubre algo).

## Impact

- **Frontend**: `components.json`, `tsconfig.json` (paths para el CLI), `package.json`/`pnpm-lock.yaml` (`radix-ui`), `core/ui/tooltip.tsx`, `NavItem`, `SidebarLogoutButton`, tests del layout.
- **Backend / contrato / CI**: sin cambios.
- **Docs vivos**: `docs/vision.md §3` al proponer y al archivar; `docs/domain.md` no cambia.
