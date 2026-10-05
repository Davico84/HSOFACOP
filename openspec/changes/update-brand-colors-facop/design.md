## Context

- `globals.css` define todos los colores como tokens (`:root` claro, `.dark` oscuro); los componentes no tienen colores literales (`no-literal-colors.test.ts`). El bloque `@template:brand` (`--primary`, `--ring`, `--brand-start`, `--brand-end`) lo escribe `pnpm project:apply` desde `project.config.json`; el resto se edita a mano.
- Hoy: primario `hsl(292 72% 36%)`, `secondary`/`accent` turquesa, degradado del login turquesa → morado, neutrales con tinte morado (tono 289–290).
- La vista de impresión fuerza el tema claro y usa `text-foreground`, `border-foreground` y `bg-muted` (encabezados de tabla).

## Goals / Non-Goals

**Goals:** paleta oficial FACOP en toda la app, contraste AA comprobado por test, impresión en negro como el PDF.

**Non-Goals:** logos/favicon (faltan los archivos oficiales), tipografía, colores semánticos, diseño de la hoja.

## Decisions

### Valores (claro)
| Token | Valor | Nota |
|---|---|---|
| `primary` | `hsl(297 51% 35%)` = `#832C87` | Roxo oficial; con blanco encima: 7,8:1 |
| `primary-foreground` | blanco | |
| `ring` | `hsl(297 51% 45%)` | Roxo aclarado para el anillo de foco |
| `foreground`, `card-foreground`, `popover-foreground` | `hsl(60 1% 23%)` = `#3C3C3B` | Grafite; 11:1 sobre blanco |
| `muted-foreground` | `hsl(0 0% 40%)` = `#666666` | gris neutro AA (5,7:1); el `#808080` no llega |
| `background`, `card`, `popover` | blanco | |
| `muted` | `hsl(0 0% 96%)` | gris neutro (también el sombreado de tablas impresas) |
| `border`, `input` | `hsl(0 0% 87%)` | |
| `secondary` / `secondary-foreground` | `hsl(297 45% 95%)` / Roxo | tinte de Roxo en lugar del turquesa |
| `accent` / `accent-foreground` | `hsl(297 40% 93%)` / `hsl(297 51% 28%)` | hover de menús y listas |
| `brand-start` = `brand-end` | Roxo `hsl(297 51% 35%)` | panel del login en Roxo liso (como el manual); `brand-start` también tiñe el punto y el ícono de los formularios |
| `ink` (nuevo) | `#000000` | Preto: texto y líneas de la hoja impresa |

### Valores (oscuro)
Neutrales oscuros sin tinte (`background` `hsl(0 0% 9%)`, `card`/`popover` `hsl(0 0% 12%)`, `muted` `hsl(0 0% 16%)`, `border`/`input` `hsl(0 0% 22%)`, `foreground` `hsl(0 0% 94%)`, `muted-foreground` `hsl(0 0% 66%)`); `primary` Roxo aclarado `hsl(297 45% 72%)` con `primary-foreground` Roxo muy oscuro `hsl(297 50% 12%)`; `secondary`/`accent` en Roxo oscuro desaturado con texto claro; el panel del login igual que en claro (Roxo con texto blanco); `ink` igual (la impresión fuerza el tema claro). Los valores finales se ajustan hasta que el test de contraste pase.

### Cómo se aplica
- `project.config.json` → `brand.colors` con los nuevos `primary`, `ring`, `brand-start`, `brand-end` y `pnpm project:apply` para regenerar el bloque `@template:brand` (no se edita a mano, el script lo sobrescribiría).
- El resto de tokens, a mano en `globals.css` (con el hex en comentario, como hoy).
- `--ink` se registra en `@theme inline` (`--color-ink`) para tener `text-ink` / `border-ink`; la hoja impresa los usa en lugar de `text-foreground` / `border-foreground`. Así el Grafite de la interfaz no aclara la impresión.
- Semánticos (`destructive`, `success`, `warning`) sin cambios.

### Logos (desde el manual)
- El PDF del manual está en curvas (vectores, sin imágenes). Con PyMuPDF se recorta cada versión (`get_svg_image` con `clip`) y se limpia el SVG: solo los trazos del logo, `viewBox` ajustado y colores reemplazados por los oficiales (el PDF los trae convertidos de CMYK: `#803594` → `#832C87`, `#404041` → `#3C3C3B`).
- Versiones: `logo-light.svg` = positiva resumida chapada horizontal (pág. 16); `logo-dark.svg` y `logo-white.svg` = negativa resumida horizontal en blanco (págs. 28/36); `favicon.svg` = el escudo chapado en Roxo (sin texto). Mismas rutas → `project.config.json` (`brand.logo`, `brand.favicon`) no cambia; no hace falta `pnpm project:setup` (asistente interactivo de la plantilla para elegir logos), basta copiar los archivos.
- Se respeta el área de protección del manual (margen de x/3 en el `viewBox`) y no se alteran proporciones, colores ni la posición de los elementos ("o que não fazer").
- Verificación visual: renderizar cada SVG a PNG y compararlo con la página del manual.

### Test de contraste
`theme.test.ts` lee los tokens de `:root` y `.dark`, convierte `hsl()` a sRGB y calcula la razón de contraste WCAG de los pares del scenario; además comprueba que `--primary` claro es `#832C87`, `--foreground` claro `#3C3C3B` y que ningún token no semántico tiene un tono fuera del Roxo (≈297°) salvo grises (saturación 0 o ≤ 2 %).

## Risks / Trade-offs

- [El Gris oficial `#808080` se descarta] → Se lee peor (3,9:1); decisión del usuario. El texto secundario usa `#666666` (5,7:1). Se anota en `docs/frontend.md`.
- [La impresión cambia de `#241727` a `#000000`] → Más fiel al PDF; se verifica con Edge headless + PyMuPDF que solo cambia el color.
- [Extraer el SVG del PDF puede arrastrar trazos vecinos (textos de la página, guías)] → Recorte por el rectángulo del logo y revisión visual de cada archivo; el SVG final solo contiene los trazos del logo.
- [Uso de los logos] → Son de FACOP, para la app que se hace para FACOP; se usan sin modificar, como indica el manual.
- [Pantallas con capturas o tests visuales] → No hay tests de captura; los tests de tema y de colores literales cubren los tokens.
