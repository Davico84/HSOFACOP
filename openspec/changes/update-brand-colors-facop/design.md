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
| `brand-start` → `brand-end` | Roxo `hsl(297 51% 35%)` → Roxo profundo `hsl(297 55% 20%)` | degradado del login sin turquesa; texto blanco encima |
| `ink` (nuevo) | `#000000` | Preto: texto y líneas de la hoja impresa |

### Valores (oscuro)
Neutrales oscuros sin tinte (`background` `hsl(0 0% 9%)`, `card`/`popover` `hsl(0 0% 12%)`, `muted` `hsl(0 0% 16%)`, `border`/`input` `hsl(0 0% 22%)`, `foreground` `hsl(0 0% 94%)`, `muted-foreground` `hsl(0 0% 66%)`); `primary` Roxo aclarado `hsl(297 45% 72%)` con `primary-foreground` Roxo muy oscuro `hsl(297 50% 12%)`; `secondary`/`accent` en Roxo oscuro desaturado con texto claro; el degradado del login igual que en claro (es un panel con texto blanco); `ink` igual (la impresión fuerza el tema claro). Los valores finales se ajustan hasta que el test de contraste pase.

### Cómo se aplica
- `project.config.json` → `brand.colors` con los nuevos `primary`, `ring`, `brand-start`, `brand-end` y `pnpm project:apply` para regenerar el bloque `@template:brand` (no se edita a mano, el script lo sobrescribiría).
- El resto de tokens, a mano en `globals.css` (con el hex en comentario, como hoy).
- `--ink` se registra en `@theme inline` (`--color-ink`) para tener `text-ink` / `border-ink`; la hoja impresa los usa en lugar de `text-foreground` / `border-foreground`. Así el Grafite de la interfaz no aclara la impresión.
- Semánticos (`destructive`, `success`, `warning`) sin cambios.

### Test de contraste
`theme.test.ts` lee los tokens de `:root` y `.dark`, convierte `hsl()` a sRGB y calcula la razón de contraste WCAG de los pares del scenario; además comprueba que `--primary` claro es `#832C87`, `--foreground` claro `#3C3C3B` y que ningún token no semántico tiene un tono fuera del Roxo (≈297°) salvo grises (saturación 0 o ≤ 2 %).

## Risks / Trade-offs

- [El Gris oficial `#808080` no se usa para texto] → Desviación consciente por accesibilidad; se usa para bordes/decoración si hace falta. Se anota en el design y en `docs/frontend.md`.
- [La impresión cambia de `#241727` a `#000000`] → Más fiel al PDF; se verifica con Edge headless + PyMuPDF que solo cambia el color.
- [Los logos genéricos (morado + turquesa) conviven con la nueva paleta hasta tener los oficiales] → Fuera de alcance; se sugiere el cambio con `pnpm project:setup`.
- [Pantallas con capturas o tests visuales] → No hay tests de captura; los tests de tema y de colores literales cubren los tokens.
