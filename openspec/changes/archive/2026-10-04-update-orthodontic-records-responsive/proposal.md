## Why

El módulo de historia clínica se pensó en escritorio. Una auditoría con Playwright a 375 px (celular) y 768 px (tablet), recorriendo el listado, los 8 pasos (con los 4 paneles de análisis abiertos) y la vista previa, encontró estos problemas:

- **Listado**: la tabla tiene 7 columnas y los botones "Editar" y "Vista previa" quedan fuera de la pantalla, tanto a 375 como a 768 px. Solo se alcanzan desplazando la tabla de lado sin ninguna pista.
- **Vista previa**: las hojas A4 miden 210 mm (794 px) y provocan desplazamiento horizontal de toda la página en celular y tablet. La barra de "Volver / Imprimir" se reparte mal.
- **Indicador de pasos**: en celular el paso actual puede quedar fuera de la vista (en el paso 8 solo se ven el 1 y el 2) y no se indica "paso N de 8".
- **Paso 5 (análisis de modelos)**: la tabla de puntos 1 y 2 de Nance parte las etiquetas en 6–7 renglones y esconde la columna "Inferior". Las grillas de piezas (Nance y Bolton) y las tablas de espacios se desplazan de lado sin pista. La fórmula de Bolton se rompe en renglones sueltos.
- **Barra de acciones** (Anterior / Guardar / Siguiente, fija abajo): en celular ocupa dos renglones (~120 px) y tapa contenido.

## What Changes

- **Listado**: bajo 1024 px cada historia se muestra como tarjeta (número, paciente, documento, tratante, inicio, modificada) con "Editar" y "Vista previa" siempre visibles. Desde 1024 px se mantiene la tabla.
- **Vista previa**: en pantalla las hojas se escalan al ancho disponible sin desplazamiento horizontal. La impresión no cambia: sigue en A4 real. La barra superior se ordena en celular.
- **Indicador de pasos**: el paso actual se desplaza a la vista al cambiar de paso, y en celular se muestra "Paso N de 8 · título".
- **Paso 5**:
  - Los puntos 1 y 2 de Nance y la tabla de discrepancia pasan a bloques apilados en celular.
  - Las grillas de piezas y las tablas anchas siguen desplazándose dentro de su caja, con indicador visual de que hay más contenido y la columna de etiquetas fija.
  - La fórmula de Bolton se apila (fracción y, debajo, "= … × 100 = … %").
- **Barra de acciones**: en celular, una sola fila compacta (iconos con texto corto o solo icono con nombre accesible).
- Prueba E2E de regresión responsive (contra backend) que recorre el módulo a 375 y 768 px y verifica que no hay desplazamiento horizontal de página y que las acciones clave están visibles.

## Non-goals

- Cambiar el contenido, los cálculos o la hoja impresa de la historia.
- Rediseñar el shell de la app (sidebar/header), que ya es responsive.
- Un modo de llenado "solo celular" o una app móvil.

## Capabilities

### New Capabilities
<!-- Ninguna -->

### Modified Capabilities
- `orthodontic-records`: se añade el requisito de uso en celular y tablet (sin desplazamiento horizontal de página, acciones visibles, vista previa escalada).

## Impact

- **Frontend** (solo): `RecordsTable` (+ tarjetas), `RecordPrintFeature`/`PrintPage` (escala en pantalla), `RecordStepper`, `RecordForm` (barra de acciones), componentes de Nance, Moyers y Bolton del paso 5, y un contenedor reutilizable de desplazamiento con indicador en `core/components`.
- **E2E**: `e2e/records.responsive.backend.spec.ts`.
- **Backend / contrato**: sin cambios.
