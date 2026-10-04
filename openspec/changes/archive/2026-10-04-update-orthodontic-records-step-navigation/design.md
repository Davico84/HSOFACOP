## Context

`RecordStepper` es una tira de 8 botones con el paso actual resaltado: en celular muestra solo números y arriba "Paso N de 8". El usuario eligió una opción revisada con previsualizaciones: columna lateral en escritorio y menú en celular, con estado por paso (con datos / vacío / con errores) y barra de progreso. Ya existen las piezas para calcular el estado:
- `RECORD_STEPS[].fields`: los campos de cada paso.
- `countFilled`: el conteo de datos que usan los paneles del paso 5.
- `formState.errors`: incluye los errores del servidor, que aplica `applyServerFieldErrors`.

## Goals / Non-Goals

**Goals:** ver de un vistazo el avance de la historia y dónde hay problemas, y moverse entre pasos con claridad en cualquier pantalla.

**Non-Goals:** ver proposal.

## Decisions

### D1. Componentes
- **`core/ui/sheet` y `core/ui/progress`:** se agregan con `pnpm dlx shadcn@latest add sheet progress`. Después:
  - se corrige el import `cn` y se quita el paquete `cn`, como con el accordion;
  - se comprueba que los primitivos se importen de `radix-ui`, el paquete unificado (el accordion ya salió así), y que no se agreguen `@radix-ui/react-*` sueltos; si aparecen, se cambian y se quitan;
  - se revisa con `git diff` que `globals.css` siga intacto;
  - nuestro `Button` no admite `asChild`: el disparador "Pasos" es `SheetTrigger` con `buttonVariants`, como hace `alert-dialog`, sin `<Button>` dentro.
- **`records/components/RecordStepList`:** la lista de los 8 pasos (botones con número, título, página y estado) más la barra de progreso. Se usa en la columna lateral y dentro del `sheet`, así que hay una sola implementación.
- **`records/components/RecordStepNav`:** reemplaza a `RecordStepper`.
  - Desde `lg`: `aside` fijo (`sticky top-20`) con `RecordStepList`. Lleva `max-h-[calc(100dvh-5.5rem)] overflow-y-auto` para no salirse de la pantalla en laptops chicas o con zoom del sistema.
  - Bajo `lg`: encabezado con "Paso N de 8 · título", la barra de progreso y un botón "Pasos" que abre el `sheet` con `RecordStepList`. El panel lleva un `SheetTitle` "Pasos de la historia clínica", que también exige Radix para el lector de pantalla. Al elegir un paso se aplica D6.
  - Se renderiza una sola de las dos vistas según `useMediaQuery("(min-width: 1024px)", true)`, para no duplicar los botones en el DOM. El `fallback` en `true` hace que, sin `matchMedia` (jsdom), los tests del formulario sigan viendo la vista de escritorio, igual que el listado.

### D2. Estado de cada paso (`useStepStatus`)
Hook del módulo con esta salida:

```ts
type StepStatus = "error" | "filled" | "empty";
interface StepStatusResult {
  /** Por número de paso (1–8). */
  steps: Record<number, { status: StepStatus; hasData: boolean; hasErrors: boolean }>;
  /** Pasos con algún dato, tengan o no errores (0–8). */
  withData: number;
  /** "N de 8 pasos con datos". */
  progressText: string;
}
```

- **`hasErrors`:** algún error de `formState.errors` cuya ruta pertenece al paso. Se aplanan las rutas de los errores y se ubica cada una con `stepOfField`.
- **`hasData`:** el paso tiene al menos una hoja no vacía. Lee los campos de `RECORD_STEPS[].fields` con `useWatch` y usa un helper nuevo `hasAnyData(value)` que corta en la primera hoja con valor, sin contar todo el árbol como `countFilled`.
- **`status`:** `error` si `hasErrors`; si no, `filled` si `hasData`; si no, `empty`.
- **Progreso:** `withData` cuenta los pasos con `hasData`. Un paso con errores y datos también cuenta.

**Rendimiento:**
- `useStepStatus` solo se llama dentro de `RecordStepNav`, **nunca en `RecordForm`** ni en los pasos. Así, escribir redibuja la navegación y no el formulario.
- `hasAnyData` sale en la primera hoja con valor, así que en un paso con datos el recorrido es corto.

### D3. Presentación del estado
- **⚠ con errores:** ícono `CircleAlert`, tono `destructive` y borde rojo.
- **✔ con datos:** ícono `CircleCheck`, tono `success`.
- **○ vacío:** ícono `Circle`, tono `muted`.
- **Lector de pantalla:** el botón no lleva `aria-label`, porque reemplazaría el texto visible y dificultaría el control por voz (WCAG 2.5.3). El nombre accesible sale del contenido: el número, el título y la página visibles, más un `<span className="sr-only"> · con datos | vacío | con errores</span>`. El ícono del estado lleva `aria-hidden`. El paso actual usa `aria-current="step"`.
- **Barra de progreso:** `progress` con `aria-label="Progreso de la historia"` y `aria-valuetext="N de 8 pasos con datos"`.

### D4. Maquetación del formulario
- **Desde `lg`:** `RecordForm` pasa a grilla `lg:grid-cols-[16rem_minmax(0,1fr)]`, con `RecordStepNav` en la primera columna y el encabezado del paso, su contenido y la barra de acciones en la segunda.
- **Bajo `lg`:** como hoy, en una columna, con el encabezado de navegación arriba.
- La barra de acciones (Anterior / Guardar / Siguiente) no cambia.

### D6. Elegir un paso: validación, foco y cierre del panel
`goTo(target)` en `RecordForm` pasa a devolver `Promise<boolean>`:
- `false` si la validación del paso actual falla (`form.trigger` con `shouldFocus`);
- `true` si no hacía falta guardar, o cuando el guardado termina bien;
- `false` si el guardado falla. El aviso con "Reintentar" ya existe.

`RecordStepNav` recibe `onSelect: (step) => Promise<boolean>`.
- **Escritorio:** no hay panel; el resultado no cambia nada.
- **Celular:** el panel se cierra siempre al elegir, para que el usuario vea el formulario, pero sin devolver el foco al botón "Pasos" (`onCloseAutoFocus` con `preventDefault`).
  - Si `goTo` resolvió `false` por validación, el foco va al primer campo con error (`form.setFocus`) y se muestra el aviso "Corrige los campos marcados del paso actual antes de cambiar de paso". Hoy un error local solo marca el campo, y en celular el usuario no vería qué pasó.
  - Si resolvió `false` por un fallo del guardado, se mantiene el aviso existente y el foco queda en el formulario.

### D5. Pruebas
- **Vitest:**
  - `useStepStatus`, con un paso vacío, uno con datos y uno con un error del servidor en un campo de otro paso. También `hasAnyData`.
  - Pasos deshabilitados en historia nueva y mientras se guarda.
  - En celular, elegir otro paso con un error en el actual: el panel se cierra, el foco va al campo inválido y aparece el aviso.
  - `RecordStepNav` en escritorio: lista lateral, estados y progreso.
  - `RecordStepNav` en celular, con `matchMedia` simulado: abrir el panel, elegir un paso y que se cierre.
- **E2E responsive:** se cambia la comprobación del indicador. En celular se verifica el encabezado "Paso N de 8" y el botón "Pasos"; en escritorio, el paso actual en la columna lateral.

## Risks / Trade-offs

- **[El paso 1 casi siempre tiene datos]** → Es correcto: una historia creada tiene paciente.
- **[Un error que llega del servidor en un paso que no es el actual]** → Se marca ⚠ en ese paso, y es justo lo que busca el cambio. Ya se avisa con un toast, que se mantiene.
- **[Ancho del formulario en escritorio]** → La columna lateral resta 16 rem. Los pasos con tablas anchas siguen usando `ScrollableX`.

## Migration Plan

No aplica (solo frontend).
