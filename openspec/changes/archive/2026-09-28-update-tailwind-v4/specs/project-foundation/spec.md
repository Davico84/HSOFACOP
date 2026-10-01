## ADDED Requirements

### Requirement: Tema definido por tokens CSS
El frontend SHALL definir su paleta (colores y radio) como variables CSS en un único archivo, `src/styles/globals.css`: valores claros en `:root` y oscuros en `.dark`. Tailwind SHALL generar las utilidades de color (`bg-*`, `text-*`, `border-*`, incluidos los modificadores de opacidad como `bg-primary/10`) a partir de esas variables. El modo oscuro SHALL activarse con la clase `dark` en el elemento raíz. Los componentes y hooks MUST NOT contener colores literales (hex, `rgb()`, `hsl()`); cambiar la marca SHALL requerir editar solo `globals.css`.

#### Scenario: Utilidades generadas desde los tokens
- **WHEN** se compila `globals.css` con Tailwind pidiendo utilidades de tokens (`bg-primary`, `text-muted-foreground`, `bg-primary/10`, `from-brand-start`)
- **THEN** el CSS resultante resuelve cada utilidad a partir de la variable correspondiente (`--primary`, `--muted-foreground`, `--brand-start`)

#### Scenario: Valores claros y oscuros de la paleta
- **WHEN** se inspecciona `globals.css`
- **THEN** cada token de color está definido en `:root` y en `.dark`

#### Scenario: Modo oscuro por clase
- **WHEN** se compila una utilidad con la variante `dark:` (p. ej. `dark:hidden`)
- **THEN** el selector generado depende de un ancestro con la clase `dark`, no de `prefers-color-scheme`

#### Scenario: Sin colores literales en componentes
- **WHEN** se inspeccionan los archivos `.ts`/`.tsx` de `src/` (excepto el cliente generado y los tests)
- **THEN** ninguno contiene colores literales (hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`)
