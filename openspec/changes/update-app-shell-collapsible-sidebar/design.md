## Context

`Sidebar` tiene dos variantes:
- **`rail`:** fija. Es `w-16 lg:w-60`: solo íconos en tablet y expandida en escritorio.
- **`drawer`:** el cajón del celular.

`NavItem` y `SidebarLogoutButton` reciben `compact` y entonces muestran el nombre en un tooltip. Ese `TooltipContent` lleva hoy `lg:hidden`, porque en escritorio la barra siempre estaba expandida. El logo se oculta en tablet. Los stores de cliente viven en `src/store` (Zustand).

## Goals / Non-Goals

**Goals:** ganar ancho en escritorio a voluntad del usuario, reusando el modo de solo íconos, sin tocar tablet ni celular.

**Non-Goals:** ver proposal.

## Decisions

### D1. Estado: `useSidebarStore` (Zustand + `persist`)
- **Store:** `src/store/useSidebarStore.ts`, con `collapsed: boolean`, `toggle()` y `setCollapsed(v)`.
- **Persistencia:** middleware `persist` con la clave `hsfacop.sidebar` y `createJSONStorage(() => localStorage)`.
- **Si no hay almacenamiento** (modo privado estricto o bloqueado): `persist` no rompe y el estado queda en memoria.
- **Valor inicial:** `collapsed = false` (expandida), igual que hoy.

**Sin reglas por ruta:** el shell no sabe en qué pantalla está, así que `core` sigue sin depender de los módulos.

### D2. Variantes de la barra
`Sidebar` (variante `rail`) recibe `collapsed`:
- **Expandida (`collapsed = false`):** `w-16 lg:w-60`, como hoy.
- **Contraída (`collapsed = true`):** `w-16` en todos los anchos. Los ítems quedan en modo ícono también en escritorio.

En el código, los ítems pasan de `compact` a una prop `iconOnly` con dos niveles:
- `"below-lg"`: solo íconos bajo `lg` (tablet, como hoy).
- `"always"`: solo íconos también en escritorio, para la barra contraída.

La variante `drawer` no cambia: siempre expandida.

### D3. Tooltips
El `TooltipContent` deja de llevar `lg:hidden` fijo:
- con `iconOnly="below-lg"` conserva `lg:hidden`, porque en escritorio los textos se ven;
- con `iconOnly="always"` se muestra en todos los anchos.

En los dos casos el tooltip es solo visual, como hoy (`aria-describedby={undefined}`): el nombre accesible ya está en `aria-label`.

### D4. Botón conmutador
- **Lugar:** en la cabecera de la barra, junto al logo (o en su lugar, contraída). Es `hidden lg:flex`.
- **Nombre accesible:** "Contraer barra lateral" o "Expandir barra lateral". Lleva `aria-expanded` y `aria-controls` hacia el `aside`.
- **Íconos:** `PanelLeftClose` / `PanelLeftOpen` de lucide.
- **Tooltip:** con el mismo texto, solo visual.
- **Foco:** al pulsarlo, queda en el botón.

### D5. Logo
- **Expandida:** `Logo` completo, como hoy.
- **Contraída:** el ícono de la marca, `<img src={project.brand.favicon}>` de 32 px con `alt={project.name}`. Así la plantilla lo sigue configurando con `pnpm project:apply`.

### D6. Transición
- **`aside`:** `transition-[width] duration-200 motion-reduce:transition-none overflow-x-hidden`.
- **Textos de los ítems:** `truncate whitespace-nowrap`, para que no salten de renglón mientras cambia el ancho.

### D7. Pruebas
- **Store:** estado inicial, `toggle` y persistencia (lee y escribe en `localStorage`).
- **`AppLayout`, en escritorio** (`matchMedia` o las clases de la barra): el botón contrae y expande, `aria-expanded` y su nombre cambian, los textos pasan a `sr-only`, aparecen los tooltips y el ícono de la marca reemplaza al logo.
- **Recarga:** con la preferencia guardada, la barra arranca contraída.
- **Tablet y celular:** el botón no se ve en tablet (`hidden lg:flex`) y el cajón móvil no cambia (los tests existentes siguen pasando).

## Risks / Trade-offs

- **[Usuario que contrae la barra y no recuerda cómo volver]** → El botón queda visible arriba de la barra, con su tooltip.
- **[Preferencia por navegador, no por cuenta]** → Es suficiente para una preferencia de presentación; no merece backend.
- **[Ancho fijo de 64 px con logos de marca anchos]** → Contraída se usa el favicon, que es cuadrado.

## Migration Plan

No aplica (solo frontend; sin preferencia guardada, la barra arranca expandida como hoy).
