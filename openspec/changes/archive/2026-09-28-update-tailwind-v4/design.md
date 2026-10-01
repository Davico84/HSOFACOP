## Context

Frontend en Tailwind **3.4** con configuración JS (`tailwind.config.cjs` mapea `colors.primary = "hsl(var(--primary))"`), PostCSS + `autoprefixer`, y plugin `tailwindcss-animate`. Los tokens viven en `src/styles/globals.css` como **canales HSL** (`--primary: 292 72% 36%`), en `:root` (claro) y `.dark`; `darkMode: ["class"]`. Vitest corre con `css: false`, así que ningún test ejercita hoy el CSS. Hay 9 colores literales `hsl(...)` en `modules/auth` (gradiente de marca teal→púrpura y acentos del medidor de contraseña). Referencias: guía oficial de upgrade de Tailwind v4 y la guía "Tailwind v4" de shadcn/ui.

## Goals / Non-Goals

**Goals:** Tailwind 4 con config CSS-first; UI visualmente igual; tokens compatibles con el registro actual de shadcn; contrato de tema cubierto por tests; cero colores literales en componentes.

**Non-Goals:** rediseño, OKLCH, añadir componentes shadcn (ver proposal).

## Decisions

### D1. Plugin de Vite, sin PostCSS
`@tailwindcss/vite` en `vite.config.ts`; se borran `postcss.config.cjs` y `autoprefixer` (v4 incluye prefijos vía Lightning CSS).
*Alternativa descartada*: `@tailwindcss/postcss` — solo tiene sentido si otra herramienta exige PostCSS; aquí todo pasa por Vite.

### D2. Tokens con color completo + `@theme inline` (patrón shadcn v4)
- `:root`/`.dark` pasan de `--primary: 292 72% 36%` a `--primary: hsl(292 72% 36%)` (mismos valores).
- `@theme inline { --color-primary: var(--primary); … }` crea las utilidades. `inline` hace que la utilidad referencie `var(--primary)` directamente, así el cambio `:root`↔`.dark` funciona en runtime y los modificadores de opacidad (`bg-primary/10`) se resuelven con `color-mix()`.
- Radios: `--radius-lg: var(--radius)`, `--radius-md: calc(var(--radius) - 2px)`, `--radius-sm: calc(var(--radius) - 4px)` (equivalente exacto al v3 actual).
*Alternativa descartada*: mantener canales y escribir `--color-primary: hsl(var(--primary))` — funciona, pero diverge del formato que emite shadcn y obligaría a adaptar cada componente/tema que llegue del registro.

### D3. Modo oscuro por clase
`@custom-variant dark (&:where(.dark, .dark *));` — mantiene el comportamiento actual (clase `dark` en `<html>`, gestionada por `ThemeToggle` y `main.tsx`), aplicando también al propio elemento con la clase.

### D4. Migración asistida + revisión manual
Ejecutar `npx @tailwindcss/upgrade` (renombra utilidades en `src/`, convierte la config JS a CSS y actualiza deps), y después **revisar el diff** a mano: el tool no conoce nuestros tokens (hay que dejar el `@theme inline` de D2) ni los valores por defecto que cambian:
- **Borde por defecto** `currentColor`: ya cubierto por `* { @apply border-border }` en `globals.css`.
- **Ring por defecto** 1px y `currentColor`: el código usa siempre `ring-2 ring-ring` explícito; verificar que no queden `ring` sueltos.
- `outline-none` → `outline-hidden` donde se use para ocultar el foco nativo junto a `focus-visible:ring-*`.
`tailwindcss-animate` → `tw-animate-css` (`@import "tw-animate-css"`).

### D5. Colores literales → tokens de marca
Nuevos tokens `--brand-start: hsl(174 70% 40%)` (teal) y `--brand-end: hsl(292 72% 42%)` (púrpura), iguales en claro y oscuro (el gradiente de marca no depende del tema), expuestos como `brand-start`/`brand-end`:
- Gradientes de `AuthLayout`, `LoginForm`, `RegisterForm` → `bg-linear-to-r from-brand-start to-brand-end` (en `AuthLayout`, clase en lugar de `style`).
- Acento teal (icono de `RegisterForm`, punto de `LoginForm`, nivel "Buena" del medidor) → `brand-start`.
- Verde y ámbar del medidor → tokens existentes `success`/`warning` (mismos valores HSL).

### D6. Tests del contrato de tema (el CSS nunca se había probado)
- **Compilación real**: un test Vitest (entorno `node`) compila `globals.css` con `compile()` de `@tailwindcss/node` y pide candidatos (`bg-primary`, `bg-primary/10`, `text-muted-foreground`, `from-brand-start`, `dark:hidden`), verificando que referencian `var(--token)` y que `dark:` genera un selector `.dark`. `@tailwindcss/node` se añade como devDependency explícita (misma versión que `tailwindcss`).
- **Paridad claro/oscuro**: el mismo test extrae los tokens de `:root` y `.dark` y comprueba que todo token de color existe en ambos.
- **Sin literales**: un test recorre `src/**/*.{ts,tsx}` (excluye `services/generated` y `*.test.*`) y falla ante `#rgb`/`#rrggbb`, `rgb(`, `hsl(`.

## Risks / Trade-offs

- [Diferencias visuales sutiles (sombras/radios reescalados, `color-mix` vs `hsl/α`)] → revisión manual de login, registro, shell y dashboard en claro/oscuro y 3 anchos (tarea explícita).
- [El upgrade tool reescribe de más o de menos] → se ejecuta sobre árbol limpio en rama propia; diff revisado archivo por archivo.
- [Navegadores antiguos sin `@property`/`color-mix`] → requisito v4 aceptado (Safari 16.4+, Chrome 111+, Firefox 128+).
- [`@tailwindcss/node` es API de bajo nivel] → solo en tests; si cambia, el test falla ruidosamente, no en silencio.

## Migration Plan

Solo frontend. Merge = despliegue. Rollback = revertir el PR (vuelven config JS, PostCSS y deps v3).

## Open Questions

- ¿Paleta a OKLCH más adelante? Fuera de este change; el formato de token completo lo permite sin tocar componentes.
