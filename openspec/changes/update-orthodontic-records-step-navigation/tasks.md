> Solo frontend. Antes de tocar el frontend, skill `frontend-guard`. Commits separados por scope (docs/commits.md).

## 1. Componentes base

- [ ] 1.1 `pnpm dlx shadcn@latest add sheet progress`: corregir import `cn` y quitar el paquete `cn`; primitivos desde `radix-ui` (sin `@radix-ui/react-*` sueltos); sin `Button asChild` (usar `buttonVariants`); `git diff` sin cambios en `globals.css`; `docs/frontend.md` (estado de `core/ui`)

## 2. Estado de los pasos

- [ ] 2.1 `hasAnyData` (corta en la primera hoja con valor) y `useStepStatus` con la salida de design D2 (`steps`, `withData`, `progressText`; error > con datos > vacío) + tests (vacío, con datos, error del servidor en otro paso, actualización al escribir). Solo se usa dentro de `RecordStepNav`

## 3. Navegación

- [ ] 3.1 `RecordStepList`: botones con número, título, página y estado (ícono `aria-hidden` + `sr-only` con el estado, sin `aria-label`; `aria-current`) y barra de progreso (`aria-valuetext`)
- [ ] 3.2 `RecordStepNav` (`useMediaQuery(..., true)`): columna lateral fija desde `lg` con alto máximo y scroll propio; bajo `lg`, encabezado "Paso N de 8 · título" + progreso + botón "Pasos" (`SheetTrigger` con `buttonVariants`) y `sheet` con `SheetTitle`; reemplaza a `RecordStepper`
- [ ] 3.5 `goTo` devuelve `Promise<boolean>`; en celular el panel se cierra sin devolver el foco al botón y, si la validación falló, enfoca el primer campo inválido y avisa (design D6)
- [ ] 3.3 `RecordForm` en dos columnas desde `lg`
- [ ] 3.4 Tests de `RecordStepNav` (escritorio y celular con `matchMedia` simulado; pasos deshabilitados en historia nueva y al guardar; error de validación desde el panel); ajustar tests que usaban el indicador

## 4. Regresión y cierre

- [ ] 4.1 E2E responsive ajustado a la nueva navegación (375, 768 y 1280 px); `pnpm validate` verde
- [x] 4.2 `docs/vision.md`: estado 🚧; al archivar, ✅
