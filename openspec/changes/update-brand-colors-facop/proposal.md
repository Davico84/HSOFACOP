## Why

La app usa la identidad genérica de la plantilla: un morado parecido pero no oficial (`hsl(292 72% 36%)`), un turquesa que no pertenece a FACOP (color secundario, acentos y el degradado del login), grises teñidos de morado y logos/favicon de ejemplo. La app se hace para FACOP: debe verse armoniosa con su marca y su logo, según el manual de marca oficial (`manual-da-marca-facop-curvas.pdf`, octubre 2021).

Paleta oficial:

| Color | PANTONE | RGB | HEX | Uso en la marca |
|---|---|---|---|---|
| Roxo (morado) | 2612 C | 131 / 44 / 135 | `#832C87` | Color insignia: isotipo y fondos principales |
| Grafite (grafito) | 447 C | 60 / 60 / 59 | `#3C3C3B` | Nombre "FACOP" del logotipo: textos y estructura |
| Preto (negro) | — | 0 / 0 / 0 | `#000000` | Lecturas secundarias, versión monocromática |
| Cinza (gris) | — | 128 / 128 / 128 | `#808080` | Lecturas secundarias, versión monocromática |

## What Changes

- **Color principal = Roxo `#832C87`** en modo claro (botones, enlaces, foco, elementos activos); en modo oscuro, un Roxo aclarado legible sobre fondo oscuro.
- **Textos en Grafite** `#3C3C3B`; textos secundarios en gris neutro. El Gris oficial `#808080` no alcanza el contraste mínimo de lectura (3,9:1 sobre blanco; WCAG AA pide 4,5:1), así que se descarta: el texto secundario usa un gris neutro más oscuro y legible.
- **Fuera el turquesa**: secundario y acentos pasan a tintes claros de Roxo.
- **Panel del login en Roxo liso** con el logo en blanco, como las piezas del manual (portada y página 49), en lugar del degradado.
- **Logos oficiales** extraídos en vectores del manual (SVG exactos, colores de la paleta):
  - barra lateral y login en modo claro: versión positiva resumida "chapada" horizontal (escudo Roxo + "FACOP" en Grafite);
  - modo oscuro: la misma versión en negativo (blanco);
  - panel Roxo del login: versión negativa (blanco);
  - favicon y barra contraída: el escudo "chapado" en Roxo.
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
- `public/brand/logo-{light,dark,white}.svg` y `public/favicon.svg` reemplazados (mismas rutas: `project.config.json` no cambia en `brand.logo`).
- Sin cambios de backend, contrato ni datos.

## Non-goals

- Tipografía de la marca (Intelo, principal, es de pago; Signika, auxiliar, es libre en Google Fonts): cambio aparte si se decide.
- Logo de la hoja impresa: sigue el de la ficha de la clínica (fidelidad al PDF).
- Colores semánticos (error, éxito, aviso): se mantienen, no son de marca.
- Cambiar el diseño de la hoja impresa.
