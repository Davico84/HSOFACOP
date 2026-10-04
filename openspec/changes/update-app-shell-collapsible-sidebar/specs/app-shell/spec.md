## ADDED Requirements

### Requirement: Barra lateral contraíble en escritorio
En pantallas de 1024 px o más, el sistema SHALL permitir contraer la barra lateral a una barra de solo íconos y volver a expandirla con un botón. Contraída, SHALL mostrar solo los íconos de las secciones y del cierre de sesión, conservando su nombre accesible y mostrándolo en un tooltip al pasar el ratón o al enfocarlos con el teclado, y el ícono de la marca en lugar del logo completo. La preferencia SHALL ser del usuario, igual en todas las pantallas, y recordarse en el navegador entre recargas y visitas; el sistema SHALL NOT contraerla ni expandirla por su cuenta según la pantalla. En pantallas de menos de 1024 px el comportamiento existente SHALL NOT cambiar.

#### Scenario: Contraer la barra lateral
- **WHEN** en una pantalla de 1024 px o más el usuario pulsa "Contraer barra lateral"
- **THEN** la barra muestra solo los íconos de las secciones y del cierre de sesión, y el ícono de la marca en lugar del logo
- **AND** el botón pasa a "Expandir barra lateral" con `aria-expanded="false"`
- **AND** el contenido principal ocupa el ancho liberado

#### Scenario: Expandir la barra lateral
- **WHEN** con la barra contraída el usuario pulsa "Expandir barra lateral"
- **THEN** la barra vuelve a mostrar los nombres de las secciones y el logo completo
- **AND** el botón pasa a "Contraer barra lateral" con `aria-expanded="true"`

#### Scenario: La preferencia se recuerda
- **WHEN** el usuario contrae la barra y luego recarga la página o va a otra sección
- **THEN** la barra sigue contraída

#### Scenario: Sin cambios automáticos por pantalla
- **WHEN** el usuario con la barra expandida abre una historia clínica u otra sección
- **THEN** la barra sigue expandida; solo cambia cuando el usuario pulsa el botón

#### Scenario: Tooltips en la barra contraída
- **WHEN** con la barra contraída en escritorio el usuario pasa el ratón o enfoca con el teclado un ítem de navegación o el cierre de sesión
- **THEN** aparece un tooltip con su nombre, el ítem conserva su `aria-label` y el lector de pantalla no anuncia el nombre dos veces

#### Scenario: Tablet y celular no cambian
- **WHEN** la aplicación se abre en una pantalla de menos de 1024 px
- **THEN** el botón para contraer o expandir no se muestra, y siguen la barra compacta en tablet y el cajón en celular

### Requirement: Ancho máximo de la app y del contenido
En pantallas anchas, el marco de las pantallas privadas (barra lateral, cabecera y contenido) SHALL medir como máximo 1920 px y quedar centrado, con la barra lateral junto al contenido; fuera del marco SHALL verse el fondo. Dentro del marco, el contenido SHALL medir como máximo 1536 px, y la cabecera SHALL alinear su contenido (usuario, tema) a ese mismo ancho. En pantallas de hasta 1536 px el contenido SHALL seguir ocupando el ancho disponible, como hasta ahora.

#### Scenario: App centrada en una pantalla muy ancha
- **WHEN** el usuario abre una pantalla privada en un monitor de 2560 px de ancho
- **THEN** la app (barra lateral, cabecera y contenido) mide como máximo 1920 px y queda centrada, con el mismo margen a ambos lados
- **AND** la barra lateral empieza en el borde de la app, junto al contenido, y no en el borde de la pantalla
- **AND** el contenido mide como máximo 1536 px y el usuario y el tema de la cabecera quedan alineados con su borde derecho

#### Scenario: Igual con la barra contraída
- **WHEN** en esa pantalla el usuario contrae la barra lateral
- **THEN** la app sigue midiendo como máximo 1920 px y centrada, y el contenido como máximo 1536 px

#### Scenario: Pantallas comunes sin cambios
- **WHEN** el usuario abre una pantalla privada a 1280 px de ancho
- **THEN** la app ocupa toda la pantalla y el contenido todo el ancho disponible junto a la barra lateral, como hasta ahora

## MODIFIED Requirements

### Requirement: Navegación responsive
El sistema SHALL adaptar la barra lateral al ancho de pantalla: en escritorio, expandida o contraída según la preferencia del usuario (ver "Barra lateral contraíble en escritorio"); compacta (solo iconos, con `aria-label`) en tablet y oculta tras un botón de menú en móvil, donde se abre como cajón superpuesto que se cierra al navegar, al pulsar fuera o con la tecla `Escape`. En la barra compacta, cada ítem de navegación y la acción de cerrar sesión SHALL mostrar su nombre en un tooltip al pasar el ratón o al recibir el foco con el teclado, sin usar el atributo `title` y conservando el `aria-label`.

#### Scenario: Abrir el cajón en móvil
- **WHEN** en móvil el usuario pulsa el botón de menú
- **THEN** el cajón de navegación se abre y el botón refleja el estado con `aria-expanded="true"`

#### Scenario: Cerrar el cajón al navegar
- **WHEN** con el cajón abierto el usuario selecciona un ítem de navegación
- **THEN** el sistema navega a la ruta y cierra el cajón

#### Scenario: Cerrar el cajón con Escape o clic fuera
- **WHEN** con el cajón abierto el usuario pulsa `Escape` o hace clic en el fondo superpuesto
- **THEN** el cajón se cierra sin navegar

#### Scenario: Tooltip en la barra compacta
- **WHEN** en la barra compacta el usuario pasa el ratón sobre un ítem de navegación o lo enfoca con el teclado
- **THEN** aparece un tooltip con el nombre de la sección, el ítem conserva su `aria-label` y no tiene atributo `title`

#### Scenario: Tooltip de cerrar sesión
- **WHEN** en la barra compacta el usuario enfoca la acción de cerrar sesión
- **THEN** aparece un tooltip "Cerrar sesión"

#### Scenario: Sin tooltip en el cajón móvil
- **WHEN** el usuario enfoca un ítem dentro del cajón móvil (etiquetas visibles)
- **THEN** no aparece tooltip
