# Recursos de marca

Logos del proyecto, servidos como archivos estáticos (`/brand/...`). Las rutas activas
están en `project.config.json` (`brand.logo.*` y `brand.favicon`), así que **no hace falta
tocar código** para cambiarlos:

```bash
pnpm project:setup   # pregunta la ruta de cada logo y lo copia aquí
```

Variantes que usa el componente `Logo` (`modules/core/ui`):

- `light` — logo para **fondos claros** (modo claro).
- `dark` — logo para **fondos oscuros** (modo oscuro).
- `white` — silueta blanca para el panel con gradiente de marca del login.

Formatos admitidos: SVG (preferible por nitidez), PNG o WebP, con fondo transparente.
