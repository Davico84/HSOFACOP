## MODIFIED Requirements

### Requirement: Navegación responsive
El sistema SHALL adaptar la barra lateral al ancho de pantalla: expandida en escritorio, compacta (solo iconos, con `aria-label`) en tablet y oculta tras un botón de menú en móvil, donde se abre como cajón superpuesto que se cierra al navegar, al pulsar fuera o con la tecla `Escape`. En la barra compacta, cada ítem de navegación y la acción de cerrar sesión SHALL mostrar su nombre en un tooltip al pasar el ratón o al recibir el foco con el teclado, sin usar el atributo `title` y conservando el `aria-label`.

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
