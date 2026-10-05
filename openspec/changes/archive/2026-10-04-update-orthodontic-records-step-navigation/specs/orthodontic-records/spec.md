## ADDED Requirements

### Requirement: Navegación entre pasos con estado y progreso
El formulario de la historia SHALL mostrar la lista de sus 8 pasos con el estado de cada uno y el progreso general. El estado de un paso SHALL ser, por prioridad: "con errores" si algún campo del paso es inválido (por la validación del formulario o por un error del servidor marcado en un campo), "con datos" si tiene algún dato registrado, y "vacío" en otro caso. Cada estado SHALL mostrarse con un ícono propio y no solo con el color, y anunciarse al lector de pantalla. El progreso SHALL indicar cuántos de los 8 pasos tienen datos. En pantallas de 1024 px o más la lista SHALL ir en una columna lateral junto al formulario; en pantallas más angostas, en un panel que se abre desde el encabezado del paso. Elegir un paso SHALL seguir guardando antes los cambios, como cualquier cambio de paso.

#### Scenario: Estado de cada paso
- **WHEN** el usuario abre una historia con datos en los pasos 1, 2 y 4 y sin datos en los demás
- **THEN** los pasos 1, 2 y 4 aparecen "con datos" y los pasos 3, 5, 6, 7 y 8 "vacíos"
- **AND** el progreso indica "3 de 8 pasos con datos"

#### Scenario: Paso con errores
- **WHEN** al guardar, el servidor marca como inválido un campo del paso 7 mientras el usuario está en el paso 2
- **THEN** el paso 7 aparece "con errores", resaltado como alerta, aunque tenga otros datos

#### Scenario: El estado se actualiza al escribir
- **WHEN** el usuario escribe el primer dato de un paso vacío
- **THEN** ese paso pasa a "con datos" y el progreso aumenta en uno, sin guardar todavía

#### Scenario: Columna lateral en escritorio
- **WHEN** el usuario abre un paso en una pantalla de 1024 px o más
- **THEN** a la izquierda del formulario se ven los 8 pasos con su número, título, página del PDF y estado, el paso actual resaltado y la barra de progreso

#### Scenario: Panel de pasos en celular
- **WHEN** el usuario, en una pantalla de menos de 1024 px, pulsa "Pasos" en el encabezado y elige otro paso
- **THEN** se abre un panel con los 8 pasos, sus estados y el progreso; al elegir el paso, el panel se cierra y se abre ese paso (guardando antes si hay cambios)

#### Scenario: Estado accesible
- **WHEN** el lector de pantalla recorre la lista de pasos
- **THEN** cada paso se anuncia con su número, su título y su estado ("con datos", "vacío" o "con errores"), y el paso actual como paso actual

#### Scenario: Pasos deshabilitados en historia nueva
- **WHEN** el usuario está creando una historia que todavía no se guardó
- **THEN** los pasos de la lista (en la columna lateral o en el panel) están deshabilitados hasta crearla

#### Scenario: Navegación deshabilitada durante el guardado
- **WHEN** se está guardando la historia
- **THEN** los pasos de la lista están deshabilitados hasta que termine

#### Scenario: Error de validación al cambiar de paso desde el panel
- **WHEN** en una pantalla de celular el usuario elige otro paso en el panel y el paso actual tiene un campo inválido
- **THEN** el panel se cierra, no cambia de paso, el foco va al campo inválido y un aviso pide corregir los campos marcados

## MODIFIED Requirements

### Requirement: Formulario por pasos con guardado de borrador
El sistema SHALL presentar la historia como un formulario de 8 pasos en el orden del PDF (Paciente y anamnesis · Análisis facial · Análisis funcional · Análisis oclusal y extra · Análisis de modelos · Análisis radiográfico · Diagnóstico y planes · Firmas). Salvo el nombre del paciente, ningún campo SHALL ser obligatorio: la historia es un borrador que se completa en varias sesiones. Al pasar a otro paso, si hay cambios, el sistema SHALL guardarlos antes de cambiar; si el guardado falla, SHALL quedarse en el paso actual mostrando el error.

#### Scenario: Avanzar guarda los cambios
- **WHEN** el usuario edita campos del paso 2 y pulsa "Siguiente"
- **THEN** el sistema guarda la historia y muestra el paso 3
- **AND** al reabrir la historia más tarde, los valores del paso 2 siguen ahí

#### Scenario: Saltar a un paso desde la lista de pasos
- **WHEN** el usuario pulsa el paso 7 en la lista de pasos estando en el paso 1 con cambios
- **THEN** el sistema guarda y abre el paso 7 (los pasos intermedios pueden quedar vacíos)

#### Scenario: Sin cambios no se guarda
- **WHEN** el usuario cambia de paso sin haber modificado nada
- **THEN** el sistema cambia de paso sin enviar ninguna petición de guardado

#### Scenario: Error de validación al guardar
- **WHEN** un campo supera su longitud máxima o un número está fuera de rango y el usuario intenta cambiar de paso
- **THEN** el sistema no cambia de paso y muestra el error junto al campo

#### Scenario: Fallo de red al guardar
- **WHEN** el guardado falla por un error del servidor o de red
- **THEN** el sistema se queda en el paso actual, conserva lo escrito y muestra un aviso con opción de reintentar

#### Scenario: Salir con cambios sin guardar
- **WHEN** el usuario intenta salir de la historia (otra sección, cerrar o recargar la pestaña) con cambios sin guardar
- **THEN** el sistema pide confirmación antes de abandonar y, si confirma, descarta los cambios

#### Scenario: Análisis de modelos después del análisis oclusal
- **WHEN** el usuario termina el análisis oclusal (paso 4) y pulsa "Siguiente"
- **THEN** se abre el paso 5 "Análisis de modelos", y el análisis radiográfico pasa a ser el paso 6

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
- **THEN** el encabezado muestra "Paso N de 8" con su título y el botón "Pasos" para abrir la lista

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
