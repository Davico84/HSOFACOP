> Solo frontend (`modules/frontend`). Sin tareas de backend.

## 1. Migración asistida

- [x] 1.1 Ejecutar `npx @tailwindcss/upgrade` en `modules/frontend` sobre árbol limpio y revisar el diff completo (D4)
- [x] 1.2 Dependencias: `tailwindcss` 4, `@tailwindcss/vite`, `tw-animate-css`, `@tailwindcss/node` (dev, para tests); quitar `autoprefixer`, `postcss`, `tailwindcss-animate` si ya no se usan; `pnpm-lock.yaml` actualizado
- [x] 1.3 `vite.config.ts` con el plugin `@tailwindcss/vite`; borrar `postcss.config.cjs` y `tailwind.config.cjs` (D1)

## 2. Tokens y tema (globals.css)

- [x] 2.1 `@import "tailwindcss"` + `@import "tw-animate-css"` + `@custom-variant dark` (D3)
- [x] 2.2 Tokens con color completo `hsl(...)` en `:root` y `.dark` (mismos valores) + `@theme inline` con colores y radios (D2)
- [x] 2.3 Tokens `--brand-start`/`--brand-end` en `:root` y `.dark` y su mapeo en `@theme` (D5)

## 3. Componentes

- [x] 3.1 Revisar utilidades renombradas por el tool en `core/ui`, `core/components/shell` y `modules/auth` (`shadow`, `rounded`, `outline-hidden`, `ring`, `backdrop-blur`, gradientes `bg-linear-*`) (D4)
- [x] 3.2 Sustituir los colores literales de `AuthLayout`, `LoginForm`, `RegisterForm` y `usePasswordStrength` por tokens (`brand-start`/`brand-end`, `success`, `warning`) (D5)

## 4. Tests (derivados de los Scenario de `project-foundation`)

- [x] 4.1 Test de tema con `@tailwindcss/node`: "Utilidades generadas desde los tokens" y "Modo oscuro por clase" (D6)
- [x] 4.2 Test de paridad: "Valores claros y oscuros de la paleta" (D6)
- [x] 4.3 Test de literales: "Sin colores literales en componentes" (D6)

## 5. Docs

- [x] 5.1 `docs/frontend.md §4.5`: nuevo formato de tokens (color completo + `@theme inline`), dónde se cambia la marca; quitar la advertencia de canales HSL; §4.1 (shadcn apunta a v4)
- [x] 5.2 `docs/architecture.md` y `docs/adr/0001-stack-y-estructura.md`: Tailwind CSS 4
- [x] 5.3 `docs/future/multi-tenant-template.md §3`: `deriveTheme`/`ThemeManager` deben emitir color completo, no canales

## 6. Verificación

- [x] 6.1 `pnpm validate` y `pnpm build` en verde
- [x] 6.2 Revisión visual manual (`pnpm dev`): login, registro, shell y dashboard en claro/oscuro y en móvil/tablet/escritorio — sin cambios visibles
- [x] 6.3 `openspec validate update-tailwind-v4 --strict`
