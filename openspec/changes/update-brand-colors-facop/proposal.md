## Why

La app usa la paleta genérica de la plantilla: un morado parecido pero no oficial (`hsl(292 72% 36%)`), un turquesa que no pertenece a FACOP (color secundario, acentos y el degradado del login) y grises teñidos de morado. La marca FACOP tiene una paleta oficial (manual de marca) y la app debe usarla para que se reconozca como herramienta de la institución.

Paleta oficial:

| Color | PANTONE | RGB | HEX | Uso en la marca |
|---|---|---|---|---|
| Roxo (morado) | 2612 C | 131 / 44 / 135 | `#832C87` | Color insignia: isotipo y fondos principales |
| Grafite (grafito) | 447 C | 60 / 60 / 59 | `#3C3C3B` | Nombre "FACOP" del logotipo: textos y estructura |
| Preto (negro) | — | 0 / 0 / 0 | `#000000` | Lecturas secundarias, versión monocromática |
| Cinza (gris) | — | 128 / 128 / 128 | `#808080` | Lecturas secundarias, versión monocromática |

## What Changes

- **Color principal = Roxo `#832C87`** en modo claro (botones, enlaces, foco, elementos activos); en modo oscuro, un Roxo aclarado legible sobre fondo oscuro.
- **Textos en Grafite** `#3C3C3B`; textos secundarios en gris neutro. El Gris oficial `#808080` no alcanza el contraste mínimo de lectura (3,9:1 sobre blanco; WCAG AA pide 4,5:1), así que para texto se usa un gris neutro más oscuro y el `#808080` queda para bordes e íconos decorativos.
- **Fuera el turquesa**: secundario, acentos y el degradado del login pasan a tonos de Roxo (tintes claros) y Grafite.
- **Grises neutros** (sin tinte morado) en fondos, bordes y superficies, claros y oscuros, derivados de Grafite/Preto.
- **Impresión**: el texto y las líneas de la hoja impresa salen en Preto (`#000000`), como el PDF de la clínica; el sombreado de encabezados de tabla, en gris neutro. Sin cambios de diseño de la hoja.
- `project.config.json` (`brand.colors`) actualizado para que `pnpm project:apply` escriba los mismos valores.
- Test de contraste: los pares de texto/fondo del tema cumplen WCAG AA en claro y oscuro.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `project-foundation`: nuevo requisito "Paleta de la marca FACOP" (el requisito "Tema definido por tokens CSS" no cambia: sigue siendo la única fuente de color).

## Impact

- `modules/frontend/src/styles/globals.css` (tokens claros y oscuros; nuevo token `--ink` para la impresión) y `src/styles/theme.test.ts` (contraste).
- `project.config.json` → bloque `@template:brand` regenerado con `pnpm project:apply`.
- Hoja impresa (`records/components/print`): texto y líneas con el token de tinta en vez de `foreground`; verificar fidelidad con Edge headless + PyMuPDF.
- Pantallas con turquesa: login y registro (degradado, punto, ícono), estados de `secondary`/`accent`.
- Sin cambios de backend, contrato ni datos.

## Non-goals

- **Logos y favicon**: hoy son los genéricos de la plantilla (morado + turquesa). Cambiarlos requiere los archivos oficiales de FACOP (SVG o PNG transparente en versiones clara, oscura y blanca); se hace con `pnpm project:setup` en un cambio aparte cuando estén.
- Tipografía de la marca.
- Colores semánticos (error, éxito, aviso): se mantienen, no son de marca.
- Cambiar el diseño de la hoja impresa.
