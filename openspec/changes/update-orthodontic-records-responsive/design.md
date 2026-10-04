## Context

Auditoría con Playwright a 375 px y 768 px. Recorrió el listado, los 8 pasos (con los 4 paneles del paso 5 abiertos) y la vista previa, y midió el ancho de la página y los elementos que sobresalen:
- **Desplazamiento horizontal de página:** solo en la vista previa (hojas de 794 px).
- **Contenido escondido o roto sin desplazar la página:**
  - las columnas y acciones del listado;
  - el paso actual del indicador;
  - la tabla de puntos 1 y 2 de Nance;
  - la fórmula de Bolton.

El shell ya es responsive (sidebar con barra de iconos en tablet y menú en celular).

## Goals / Non-Goals

**Goals:** usar el módulo completo en celular y tablet sin desplazamiento horizontal de página ni acciones escondidas. La impresión debe quedar idéntica.

**Non-Goals:** ver proposal.

## Decisions

### D1. Puntos de corte
Los de Tailwind: `sm` 640, `md` 768, `lg` 1024.
- **"Celular":** < `sm`.
- **"Tablet":** `sm`–`lg`.
- **Listado en tarjetas:** < `lg`. A 768 px la tabla ya esconde acciones.
- **Bloques apilados del paso 5:** < `sm`.

### D2. Listado en tarjetas (`RecordsCardList`)
Componente nuevo del módulo, con los mismos datos que la tabla:
- **Contenido:** número, paciente (enlace), documento, tratante, inicio y modificada.
- **Acciones:** `RecordEditLink` y `RecordPrintLink` siempre visibles.
- **Responsive:** se renderiza una sola de las dos vistas según `useMediaQuery("(min-width: 1024px)")` (`core/hooks`). Si se ocultaran con CSS, cada enlace quedaría dos veces en el DOM. Comparten datos, paginación y búsqueda. Sin `matchMedia` (jsdom) se muestra la tabla.
- **Accesibilidad:** las tarjetas son una lista (`ul`/`li`) con encabezado por historia.

**Alternativa descartada:** ocultar columnas con breakpoints. A 375 px no caben ni las acciones.

### D3. Vista previa escalada en pantalla
La hoja sigue midiendo 210 mm, para que imprimir no cambie nada.
- **Contenedor:** `core/components/ScaleToFit` mide su ancho de contenido (sin padding, con `ResizeObserver`) y aplica `zoom` = ancho disponible ÷ 794 px (máximo 1; `core/utils/fitScale`).
- **Por qué `zoom`:** a diferencia de `transform: scale`, reduce también el alto del flujo. Hoy lo soportan Chrome, Edge, Safari y Firefox ≥ 126.
- **Impresión:** `@media print` anula el zoom (`zoom: 1`), así que lo impreso es igual.
- **Barra superior:** "Volver" e "Imprimir" en una fila; el texto de ayuda va debajo.

### D4. Indicador de pasos
- **Paso actual a la vista:** al cambiar `current`, el botón activo hace `scrollIntoView({ inline: "center", block: "nearest" })`, con `behavior: "smooth"` salvo con `prefers-reduced-motion`.
- **En celular:** encima de la tira se muestra "Paso N de 8 · título" (`sm:hidden`) y los botones de la tira muestran solo su número.
- **Lector de pantalla:** cada botón conserva su título en el nombre accesible.

### D5. Paso 5 en celular
- **Contenedor de desplazamiento:** `core/components/ScrollableX` (y `min-w-0` en los `fieldset`, que si no impiden encogerse) para todas las tablas anchas (WALA–EV, espacios de Moyers, anchos de Nance, grilla de Bolton). Envuelve la tabla en `overflow-x-auto` y muestra un degradado en el borde por donde queda contenido, que se oculta al llegar al extremo. La primera columna (etiquetas) queda fija con `sticky left-0` y fondo.
- **Nance, puntos 1 y 2** (`NanceSpaceRows`) **y tabla de discrepancia** (`NanceResultTable`): pasan de `<table>` a una sola grilla CSS que se reacomoda: bajo `sm`, cada fila es un bloque con la etiqueta arriba y "Superior [campo]" e "Inferior [campo]" en 2 columnas; desde `sm`, la misma grilla forma las columnas de la tabla actual (etiqueta · Superior · Inferior). Hay un solo DOM: cada campo existe una vez, con el mismo nombre accesible. Las cabeceras de columna llevan `role`/`aria` de tabla (`role="table"`, `row`, `rowheader`, `columnheader`, `cell`) para que se sigan leyendo como tabla.
- **Fórmula de Bolton:** bajo `sm` se apila; la fracción va en un renglón y "= cociente × 100 = relación %" debajo, centrado.

### D6. Barra de acciones
Bajo `sm`, las tres acciones van en una fila:
- "Anterior" y "Siguiente" muestran solo el icono; el texto queda como nombre accesible (`sr-only sm:not-sr-only`). Sin tooltip: en celular no hay hover, y desde `sm` el texto ya se ve.
- "Guardar" conserva el texto.

La barra pasa de ~120 px a ~56 px. No se toca nada desde `sm`.

### D7. Prueba de regresión
`e2e/records.responsive.backend.spec.ts` (con `E2E_BACKEND=1`), por cada ancho de 375 y 768 px:
- **Recorrido:** crea una historia y recorre el listado, los 8 pasos (abriendo los paneles del paso 5) y la vista previa.
- **Comprueba:**
  - `scrollWidth <= clientWidth` del documento;
  - "Editar" y "Vista previa" visibles en el listado;
  - el paso actual visible en el indicador;
  - el botón "Imprimir" visible.

Los tests de Vitest cubren la lógica: el zoom calculado y el `scrollIntoView` llamado.

## Risks / Trade-offs

- **[`zoom` de CSS en navegadores viejos]** → Si no hay soporte, se vuelve a desplazar de lado, como hoy. Es aceptable.
- **[Tabla hecha con grilla CSS en Nance]** → Se conserva la semántica de tabla con roles ARIA. Los tests usan nombres accesibles, que no cambian.
- **[El degradado de desplazamiento se calcula en cada scroll]** → Usa un listener pasivo y solo cambia una clase.

## Migration Plan

No aplica (solo frontend).
