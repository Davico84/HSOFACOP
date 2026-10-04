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
- **`core/ui/sheet` y `core/ui/progress`:** se agregan con `pnpm dlx shadcn@latest add sheet progress`. Después se corrige el import `cn` y se quita el paquete `cn`, como con el accordion, y se revisa con `git diff` que `globals.css` siga intacto.
- **`records/components/RecordStepList`:** la lista de los 8 pasos (botones con número, título, página y estado) más la barra de progreso. Se usa en la columna lateral y dentro del `sheet`, así que hay una sola implementación.
- **`records/components/RecordStepNav`:** reemplaza a `RecordStepper`.
  - Desde `lg`: `aside` fijo (`sticky top-20`) con `RecordStepList`.
  - Bajo `lg`: encabezado con "Paso N de 8 · título", la barra de progreso y un botón "Pasos" que abre el `sheet` con `RecordStepList`. Al elegir un paso, el panel se cierra.
  - Se renderiza una sola de las dos vistas según `useMediaQuery("(min-width: 1024px)")`, para no duplicar los botones en el DOM.

### D2. Estado de cada paso (`useStepStatus`)
Hook del módulo que devuelve, por paso, `"error" | "filled" | "empty"`:
- **`error`:** algún error de `formState.errors` cuya ruta pertenece al paso. Se calcula con `stepOfField` sobre las rutas aplanadas de los errores.
- **`filled`:** `countFilled` de los valores del paso es mayor que 0. Lee los campos de `RECORD_STEPS[].fields` con `useWatch`.
- **`empty`:** ninguno de los anteriores.

Prioridad: `error` > `filled` > `empty`. El progreso es la cantidad de pasos `filled` o `error` con datos ("N de 8 pasos con datos").

Rendimiento: solo `RecordStepNav` usa el hook, no el paso, así que escribir redibuja la navegación pero no el formulario. El cálculo es barato: 8 conteos sobre objetos chicos.

### D3. Presentación del estado
- **⚠ con errores:** ícono `CircleAlert`, tono `destructive` y borde rojo.
- **✔ con datos:** ícono `CircleCheck`, tono `success`.
- **○ vacío:** ícono `Circle`, tono `muted`.
- **Lector de pantalla:** cada botón tiene como nombre accesible "N. Título · con datos | vacío | con errores". El paso actual usa `aria-current="step"`.
- **Barra de progreso:** `progress` con `aria-label="Progreso de la historia"` y `aria-valuetext="N de 8 pasos con datos"`.

### D4. Maquetación del formulario
- **Desde `lg`:** `RecordForm` pasa a grilla `lg:grid-cols-[16rem_minmax(0,1fr)]`, con `RecordStepNav` en la primera columna y el encabezado del paso, su contenido y la barra de acciones en la segunda.
- **Bajo `lg`:** como hoy, en una columna, con el encabezado de navegación arriba.
- La barra de acciones (Anterior / Guardar / Siguiente) no cambia.

### D5. Pruebas
- **Vitest:**
  - `useStepStatus`, con un paso vacío, uno con datos y uno con un error del servidor en un campo de otro paso.
  - `RecordStepNav` en escritorio: lista lateral, estados y progreso.
  - `RecordStepNav` en celular, con `matchMedia` simulado: abrir el panel, elegir un paso y que se cierre.
- **E2E responsive:** se cambia la comprobación del indicador. En celular se verifica el encabezado "Paso N de 8" y el botón "Pasos"; en escritorio, el paso actual en la columna lateral.

## Risks / Trade-offs

- **[El paso 1 casi siempre tiene datos]** → Es correcto: una historia creada tiene paciente.
- **[Un error que llega del servidor en un paso que no es el actual]** → Se marca ⚠ en ese paso, y es justo lo que busca el cambio. Ya se avisa con un toast, que se mantiene.
- **[Ancho del formulario en escritorio]** → La columna lateral resta 16 rem. Los pasos con tablas anchas siguen usando `ScrollableX`.

## Migration Plan

No aplica (solo frontend).
