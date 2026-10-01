## Context

`app-shell` construido: `Sidebar` con variante `rail` (tablet: iconos, etiqueta `sr-only` + `aria-label`; escritorio `lg`: etiqueta visible) y `drawer` (móvil). `NavItem` y `SidebarLogoutButton` reciben `compact`. No existe `components.json`, `core/ui` no tiene `Tooltip` ni primitivos Radix, y `docs/frontend.md §4.1` prohíbe `init` (reescribiría `globals.css`, donde viven los tokens y los marcadores `@template:brand`). Tailwind 4 ya migrado (`update-tailwind-v4`); el registro actual de shadcn genera código v4.

## Goals / Non-Goals

**Goals:** tooltip accesible en la barra compacta; incorporar shadcn de forma reproducible (`components.json`) sin tocar el tema; base para futuros `add`.

**Non-Goals:** tooltips fuera del shell, otros componentes shadcn, Base UI.

## Decisions

### D1. `components.json` a mano (sin `init`)
```json
{
  "$schema": "https://ui.shadcn.com/schema.json",
  "style": "new-york",
  "rsc": false,
  "tsx": true,
  "tailwind": { "config": "", "css": "src/styles/globals.css", "baseColor": "neutral", "cssVariables": true, "prefix": "" },
  "aliases": {
    "components": "@/modules/core/components",
    "ui": "@/modules/core/ui",
    "utils": "@/modules/core/utils/cn",
    "lib": "@/modules/core/utils",
    "hooks": "@/modules/core/hooks"
  },
  "iconLibrary": "lucide"
}
```
- `new-york` = variante Radix (paquete unificado `radix-ui` desde 2026-02). `tailwind.config` vacío = Tailwind v4.
- `utils` apunta a nuestro `cn` (`@/modules/core/utils/cn`), así el componente generado importa `cn` de ahí.
- El `tsconfig.json` de `modules/frontend` es una *solution* (`files: []`) sin `paths`: el CLI no resolvería `@/` y escribiría en una carpeta literal `@/`. Se añaden `compilerOptions.baseUrl` + `paths["@/*"]` solo para el tooling (no afecta a `tsc -b`, que usa los proyectos referenciados).
- `components.json` vive en `modules/frontend/` (sus rutas son relativas a ese archivo); el CLI se ejecuta desde ahí.
- Tras el `add`, `git diff` debe mostrar solo `tooltip.tsx`, `package.json` y `pnpm-lock.yaml`; ni `globals.css` (tokens, `@theme inline`, marcadores `@template:brand`) ni una carpeta literal `modules/frontend/@/`. Si el CLI toca `globals.css`, se revierte ese archivo. El `paths` del tsconfig solución evita la carpeta `@/`, pero **no** protege `globals.css`: por eso la revisión del diff es obligatoria.
- El `tooltip.tsx` generado debe usar solo tokens (`bg-foreground`/`text-background` o similares); `no-literal-colors.test.ts` y `theme.test.ts` lo vigilan.

### D2. Tooltip solo en la barra compacta
- `NavItem` y `SidebarLogoutButton`: si `compact`, envuelven el trigger en `Tooltip` → `TooltipTrigger asChild` → `TooltipContent side="right"`. Sin `compact` (cajón móvil) no hay tooltip.
- En escritorio (`lg`) la barra `rail` ya muestra la etiqueta: `TooltipContent` lleva `lg:hidden` para no duplicar el texto. Radix sigue montando el tooltip, pero no se ve.
- Nunca `title`. En el botón de logout el `aria-label` sigue fijo ("Cerrar sesión") aunque el texto visible pase a "Cerrando sesión…"; un botón `disabled` no recibe foco, así que no hay tooltip durante el logout (aceptado).

### D3. `TooltipProvider` explícito (revisión de Codex)
La documentación actual de shadcn indica montar `<TooltipProvider>` en la raíz tras añadir el tooltip. Se monta **explícitamente** en `RootLayout` (app real) y en el wrapper de `renderApp()` de `AppLayout.test.tsx` (que monta `appRoutes` sin `RootLayout`), con `delayDuration={0}` en tests para no depender del retardo. Si el componente generado envuelve además cada `Tooltip` en su propio provider, no hay conflicto.

### D4. Tooltip solo visual: sin anuncio duplicado (revisión de Codex)
El nombre accesible del ítem es su `aria-label` (y en tablet el texto `sr-only`). Radix, al abrir, añade `aria-describedby` → el tooltip, cuyo texto es **el mismo nombre**: un lector de pantalla anunciaría "Inicio, Inicio". Como el tooltip no aporta información nueva, es **solo visual**: el hijo del `TooltipTrigger` fija `aria-describedby={undefined}` para anular la descripción (en `Slot`, las props del hijo prevalecen). Un test verifica que el trigger abierto no tiene `aria-describedby`. Si la versión de Radix no permitiera anularlo limpiamente, se acepta la redundancia y se documenta (preferible a quitar el `aria-label`).

### D5. Tests
Vitest + RTL sobre el árbol de rutas real (`layouts/AppLayout.test.tsx`), uno por Scenario nuevo:
- "Tooltip en la barra compacta": **foco** (`user.tab`/`focus`) y **hover** (`user.hover`) sobre un ítem de la barra `rail` → `findByRole("tooltip", { name })`; el ítem mantiene `aria-label`, no tiene `title` ni `aria-describedby` (D4).
- "Tooltip de cerrar sesión": foco → tooltip "Cerrar sesión"; `aria-label` presente; sin `title`.
- "Sin tooltip en el cajón móvil": abrir el cajón, enfocar un ítem → `queryByRole("tooltip")` es `null`.
Los Scenario existentes del requirement se mantienen verdes. Sin sleeps: `findBy*`/`waitFor`.

## Risks / Trade-offs

- [El CLI de shadcn modifica `globals.css` o escribe en `@/`] → paths en `tsconfig.json` + revisión de `git diff` tras el `add` (tarea explícita).
- [Tooltip en jsdom (pointer events, portales)] → `test/setup.ts` ya tiene shims de pointer capture / `ResizeObserver`; se prueba con foco de teclado, que Radix abre sin retardo.
- [Tooltip invisible pero montado en escritorio] → coste mínimo; alternativa (media query en JS) descartada por complejidad.

## Migration Plan

Solo frontend. Merge = disponible. Rollback = revertir el PR.
