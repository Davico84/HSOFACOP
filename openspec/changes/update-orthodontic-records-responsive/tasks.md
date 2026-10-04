> Solo frontend. Antes de tocar el frontend, skill `frontend-guard`. Commits separados por scope (docs/commits.md).

## 1. Componentes reutilizables

- [ ] 1.1 `core/components/ScrollableX`: desplazamiento horizontal con degradado en el borde con contenido oculto + test (clases según la posición del scroll)

## 2. Listado

- [ ] 2.1 `RecordsCardList` (tarjetas < `lg`: número, paciente, documento, tratante, inicio, modificada, "Editar" y "Vista previa"); `RecordsTable` desde `lg` + tests

## 3. Formulario

- [ ] 3.1 `RecordStepper`: paso actual a la vista (`scrollIntoView`, sin animación con `prefers-reduced-motion`) y "Paso N de 8 · título" en celular + test
- [ ] 3.2 Barra de acciones compacta en celular (Anterior/Siguiente solo icono con nombre accesible y tooltip)
- [ ] 3.3 Paso 5: `ScrollableX` con primera columna fija en WALA–EV, espacios de Moyers, anchos de Nance y grilla de Bolton
- [ ] 3.4 Nance: puntos 1 y 2 y tabla de discrepancia como grilla CSS con roles de tabla (bloques en celular, columnas desde `sm`)
- [ ] 3.5 Fórmula de Bolton apilada en celular

## 4. Vista previa

- [ ] 4.1 Escala en pantalla (`zoom` = ancho disponible ÷ 794 px, máx. 1, con `ResizeObserver`); `zoom: 1` al imprimir; barra superior ordenada en celular + test del cálculo
- [ ] 4.2 Verificar con Edge headless que la impresión sigue idéntica (13 hojas, mismos márgenes)

## 5. Regresión y cierre

- [ ] 5.1 `e2e/records.responsive.backend.spec.ts` a 375 y 768 px (sin desplazamiento horizontal de página, acciones visibles, paso actual visible, "Imprimir" visible); `pnpm validate` verde
- [ ] 5.2 `docs/vision.md`: estado 🚧 del change; al archivar, ✅ y `docs/frontend.md` (`ScrollableX`, patrón de listado en tarjetas)
