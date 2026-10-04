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

### D8. Ancho máximo del contenido
- **`<main>`** (`AppLayout`) envuelve el `Outlet` en `mx-auto w-full max-w-screen-2xl` (1536 px). El padding (`p-4 sm:p-6 lg:p-8`) se queda en `<main>`, así que el contenido mide hasta 1536 px menos el padding.
- **Cabecera:** el borde y el fondo siguen a todo el ancho; su contenido (botón de menú, usuario, tema) va en un contenedor `mx-auto w-full max-w-screen-2xl` con el mismo padding horizontal que `<main>`. Así el usuario queda alineado con el borde derecho del contenido.
- **La barra lateral** sigue pegada a la izquierda; el contenido se centra en el espacio que deja libre.
- **Una sola regla en el shell:** las pantallas no fijan anchos propios. Con 1536 px, la columna del paso de la historia clínica queda en unos 1.180 px, suficiente para sus tablas (que además tienen `ScrollableX`) y cómodo para leer los campos de texto. Si en el futuro una pantalla necesita todo el ancho, se agregará una opción explícita del layout; hoy ninguna la necesita.
- **Vista previa de impresión:** está fuera del shell y no se ve afectada. Sus hojas ya se centran solas.
- **Anchos resultantes** (barra expandida / contraída): a 1280 px, el contenido mide ~976 / ~1.152 px; a 1920 px y a 2560 px, 1.536 px centrados en ambos casos.
- Bajo 1536 px no cambia nada: tablet y celular siguen igual.

### D7. Pruebas
- **Store:** estado inicial, `toggle` y persistencia (lee y escribe en `localStorage`).
- **`AppLayout`, en escritorio** (`matchMedia` o las clases de la barra): el botón contrae y expande, `aria-expanded` y su nombre cambian, los textos pasan a `sr-only`, aparecen los tooltips y el ícono de la marca reemplaza al logo.
- **Recarga:** con la preferencia guardada, la barra arranca contraída.
- **Tablet y celular:** el botón no se ve en tablet (`hidden lg:flex`) y el cajón móvil no cambia (los tests existentes siguen pasando).
- **Ancho máximo:** en el E2E, a 2560 px, el contenido de `<main>` mide como máximo 1536 px y está centrado (márgenes izquierdo y derecho iguales, ±1 px) con la barra expandida y contraída.

## Risks / Trade-offs

- **[Usuario que contrae la barra y no recuerda cómo volver]** → El botón queda visible arriba de la barra, con su tooltip.
- **[Preferencia por navegador, no por cuenta]** → Es suficiente para una preferencia de presentación; no merece backend.
- **[Ancho fijo de 64 px con logos de marca anchos]** → Contraída se usa el favicon, que es cuadrado.

## Migration Plan

No aplica (solo frontend; sin preferencia guardada, la barra arranca expandida como hoy).
