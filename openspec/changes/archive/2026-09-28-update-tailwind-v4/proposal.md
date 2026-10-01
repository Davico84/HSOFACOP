## Why

El frontend usa **Tailwind CSS 3**, pero el registro actual de **shadcn/ui** genera componentes para **Tailwind v4**. Cada componente que se añada (el primero será `tooltip`, para la barra de iconos del `app-shell`) habría que adaptarlo a mano a v3. Como el proyecto es una **plantilla** y el frontend aún es pequeño, migrar ahora es lo más barato y evita que cada proyecto derivado herede la migración pendiente.

Hoy **ninguna spec protege el sistema de tema** (tokens de color en `globals.css`, modo oscuro por clase), así que la migración no tendría un contrato verificable. Este change lo añade.

## What Changes

- **Migración a Tailwind v4** (solo frontend, sin cambio visual intencionado):
  - `tailwindcss` 4 + plugin `@tailwindcss/vite`; se eliminan `tailwind.config.cjs`, `postcss.config.cjs`, `autoprefixer` y `tailwindcss-animate` (→ `tw-animate-css`).
  - Configuración **CSS-first** en `src/styles/globals.css`: `@import "tailwindcss"`, `@theme inline` que mapea los tokens, `@custom-variant dark` (modo oscuro por clase `dark`, como hoy).
  - Tokens con **color completo** (`--primary: hsl(292 72% 36%)`) en lugar de canales sueltos (`292 72% 36%`). Los **valores** de la paleta no cambian.
  - Utilidades renombradas por v4 (`shadow-sm`→`shadow-xs`, `rounded-sm`→`rounded-xs`, `outline-none`→`outline-hidden`, ancho de `ring`…) vía `@tailwindcss/upgrade` + revisión manual.
- **Colores literales → tokens**: el gradiente de marca y los acentos de `auth` (hoy `hsl(...)` escritos a mano en 4 archivos) pasan a tokens (`--brand-start`/`--brand-end`, y `success`/`warning` existentes).
- **Nuevo requirement en `project-foundation`**: "Tema definido por tokens CSS", con tests que compilan el CSS real y vigilan colores literales.
- **Docs**: `frontend.md §4.5` (nuevo formato de tokens), `architecture.md` y ADR 0001 (Tailwind 4), `docs/future/multi-tenant-template.md §3` (`deriveTheme` debe emitir color completo).

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `project-foundation`: **ADDED** requirement "Tema definido por tokens CSS" (tokens en `globals.css` expuestos a Tailwind, modo oscuro por clase, sin colores literales en componentes). El resto de requirements no cambia.

## Non-goals

- **Rediseño visual** o cambio de paleta: la UI debe verse igual (salvo diferencias sub-píxel inevitables del cambio de motor).
- Pasar la paleta a **OKLCH** (formato por defecto de shadcn v4): se mantiene HSL para no alterar colores; se puede evaluar después.
- **Añadir componentes shadcn** (`tooltip`, `components.json`): va en el change siguiente, `update-app-shell-tooltips`.
- Backend, contrato OpenAPI y CI: sin cambios.

## Impact

- **Frontend** (`modules/frontend`): `package.json`/`pnpm-lock.yaml` (deps), `vite.config.ts` (plugin), `src/styles/globals.css` (reescrito), clases renombradas en `core/ui`, `core/components/shell` y `modules/auth`; se borran `tailwind.config.cjs` y `postcss.config.cjs`.
- **Tests**: nuevo test de tema (compila `globals.css` con el compilador de Tailwind) y test de colores literales. Vitest sigue con `css: false`.
- **Navegadores**: v4 requiere Safari 16.4+, Chrome 111+, Firefox 128+ (aceptable para una app de gestión).
- **Docs vivos**: al proponer, enlazar en `docs/vision.md §3`; al archivar, marcar construido. `docs/domain.md` no cambia.
