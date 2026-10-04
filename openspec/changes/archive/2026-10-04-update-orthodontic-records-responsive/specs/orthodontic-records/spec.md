## ADDED Requirements

### Requirement: Uso en celular y tablet
El módulo de historia clínica (listado, formulario de 8 pasos y vista previa) SHALL poder usarse desde 375 px de ancho sin desplazamiento horizontal de la página. Las acciones de cada historia y del formulario SHALL quedar visibles sin desplazarse de lado. Las tablas que no caben en el ancho SHALL desplazarse dentro de su propia caja, con un indicador visual de que hay más contenido. La hoja impresa SHALL NOT cambiar.

#### Scenario: Sin desplazamiento horizontal de página
- **WHEN** el usuario abre el listado, cualquiera de los 8 pasos (con todos los paneles del paso 5 abiertos) o la vista previa en una pantalla de 375 px o de 768 px de ancho
- **THEN** la página no se desplaza horizontalmente

#### Scenario: Listado en tarjetas
- **WHEN** el usuario abre el listado en una pantalla de menos de 1024 px de ancho
- **THEN** cada historia aparece como una tarjeta con número, paciente, documento, tratante, inicio y fecha de modificación
- **AND** los botones "Editar" y "Vista previa" de cada historia están visibles sin desplazarse

#### Scenario: Listado en tabla en escritorio
- **WHEN** el usuario abre el listado en una pantalla de 1024 px o más
- **THEN** las historias aparecen en la tabla, como hasta ahora

#### Scenario: Paso actual visible
- **WHEN** el usuario abre un paso en una pantalla de celular
- **THEN** el paso actual está visible en el indicador de pasos y se muestra "Paso N de 8" con su título

#### Scenario: Vista previa escalada
- **WHEN** el usuario abre la vista previa en una pantalla más angosta que una hoja A4
- **THEN** las hojas se reducen para caber en el ancho y el botón "Imprimir" queda visible
- **AND** al imprimir, las hojas salen en tamaño A4 real, iguales que antes

#### Scenario: Tablas anchas del paso 5
- **WHEN** una grilla de piezas (Nance o Bolton) o una tabla de espacios no cabe en el ancho
- **THEN** se desplaza dentro de su caja con la columna de etiquetas fija, y un degradado en el borde indica que hay más contenido hasta llegar al final

#### Scenario: Puntos 1 y 2 de Nance en celular
- **WHEN** el usuario abre el análisis de Nance en una pantalla de celular
- **THEN** cada punto (SA y ST) se muestra como un bloque con su etiqueta completa y los campos "Superior" e "Inferior" visibles, sin columnas cortadas

#### Scenario: Barra de acciones compacta
- **WHEN** el usuario está en un paso del formulario en una pantalla de celular
- **THEN** "Anterior", "Guardar" y "Siguiente" caben en una sola fila, y "Anterior" y "Siguiente" conservan su nombre para el lector de pantalla
