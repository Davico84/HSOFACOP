> Solo frontend. Antes de tocar el frontend, skill `frontend-guard`. Commits separados por scope (docs/commits.md).

## 1. Componentes base

- [ ] 1.1 `pnpm dlx shadcn@latest add sheet progress`: corregir import `cn` y quitar el paquete `cn`; `git diff` sin cambios en `globals.css`; `docs/frontend.md` (estado de `core/ui`)

## 2. Estado de los pasos

- [ ] 2.1 `useStepStatus` (error > con datos > vacío, por `RECORD_STEPS[].fields` y `formState.errors`; progreso "N de 8 pasos con datos") + tests (vacío, con datos, error del servidor en otro paso, actualización al escribir)

## 3. Navegación

- [ ] 3.1 `RecordStepList`: botones con número, título, página y estado (ícono + texto accesible, `aria-current`) y barra de progreso
- [ ] 3.2 `RecordStepNav`: columna lateral fija desde `lg`; bajo `lg`, encabezado "Paso N de 8 · título" + progreso + botón "Pasos" con `sheet` que se cierra al elegir; reemplaza a `RecordStepper`
- [ ] 3.3 `RecordForm` en dos columnas desde `lg`
- [ ] 3.4 Tests de `RecordStepNav` (escritorio y celular con `matchMedia` simulado); ajustar tests que usaban el indicador

## 4. Regresión y cierre

- [ ] 4.1 E2E responsive ajustado a la nueva navegación (375, 768 y 1280 px); `pnpm validate` verde
- [x] 4.2 `docs/vision.md`: estado 🚧; al archivar, ✅
