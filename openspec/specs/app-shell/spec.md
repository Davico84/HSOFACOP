# app-shell Specification

## Purpose
Marco de la zona privada de la plantilla: layout con barra lateral y cabecera responsive, navegación declarada por configuración, identidad del usuario, cierre de sesión y un dashboard de inicio con datos de ejemplo. Capacidad técnica/plataforma (solo frontend); las métricas reales pertenecen a la futura capacidad `dashboard`.
## Requirements
### Requirement: Layout privado común
El sistema SHALL renderizar todas las rutas autenticadas dentro de un layout común compuesto por una barra lateral de navegación (`<aside>`/`<nav>`), una cabecera (`<header>`) y un área de contenido principal (`<main>`). Las rutas de invitado (login, registro) MUST NOT mostrar este layout.

#### Scenario: Ruta privada dentro del shell
- **WHEN** un usuario autenticado navega a una ruta privada
- **THEN** el sistema muestra la barra lateral de navegación, la cabecera y el contenido de la ruta en el área principal

#### Scenario: Rutas de invitado sin shell
- **WHEN** un usuario sin sesión abre la pantalla de login o de registro
- **THEN** el sistema muestra la pantalla de autenticación sin barra lateral ni cabecera del shell

### Requirement: Navegación declarada por configuración
El sistema SHALL construir los ítems de la barra lateral y el árbol de rutas privadas a partir de una única configuración de secciones (ruta y, opcionalmente, los roles que pueden verla) más su presentación (etiqueta e icono), mostrar solo los ítems permitidos para el rol del usuario, aplicar a cada sección restringida —incluidas sus subrutas— la regla de acceso por rol de `authentication` ("Rol sin permiso") con esos mismos roles, resaltar el ítem correspondiente a la ruta activa y enrutar cada ítem de ejemplo a una página "Próximamente" dentro del shell.

#### Scenario: Ítem activo resaltado
- **WHEN** el usuario está en la ruta de un ítem de navegación
- **THEN** ese ítem se marca como activo (`aria-current="page"`) y ningún otro lo está

#### Scenario: Navegar a un ítem de ejemplo
- **WHEN** el usuario selecciona un ítem de navegación de ejemplo
- **THEN** el sistema muestra la página "Próximamente" con el nombre de la sección, manteniendo el shell visible

#### Scenario: Ruta privada inexistente
- **WHEN** un usuario autenticado navega a una ruta que no existe
- **THEN** el sistema muestra la página de error/no encontrado existente

#### Scenario: Ítem sin roles visible para todos
- **WHEN** una sección no declara roles
- **THEN** su ítem lo ven todos los usuarios autenticados, sea cual sea su rol

#### Scenario: Ítem restringido oculto para otros roles
- **WHEN** un usuario cuyo rol no está entre los roles de una sección abre el shell (barra lateral fija o cajón móvil)
- **THEN** el ítem de esa sección no aparece en la navegación
- **AND** un usuario con un rol permitido sí lo ve, y se marca como activo cuando está en esa sección

#### Scenario: Acceso denegado dentro del shell
- **WHEN** un usuario cuyo rol no está permitido navega directamente a la ruta de una sección restringida o a cualquiera de sus subrutas
- **THEN** el estado de acceso denegado de `authentication` se muestra dentro del contenido principal del shell (sin anidar otro `<main>`), recibe el foco y ofrece volver al inicio
- **AND** no se renderiza el contenido de la sección ni se cargan sus datos

#### Scenario: Cambio de rol en caliente
- **WHEN** el rol del usuario cambia mientras está en una sección restringida
- **THEN** la navegación y la ruta se actualizan al nuevo rol sin recargar la página

#### Scenario: Menú y rutas derivados de la misma configuración
- **WHEN** una sección declara roles en la configuración
- **THEN** su ítem de menú y su subárbol de rutas aplican exactamente esos roles, sin declararlos en otro sitio

### Requirement: Identidad en la cabecera y cierre de sesión en la barra lateral
La cabecera SHALL mostrar el nombre completo del usuario (o su correo si no tiene nombre), su rol y un conmutador de tema claro/oscuro. La acción de cerrar sesión SHALL ubicarse al pie de la barra lateral (también en el cajón móvil), no en la cabecera, y reutiliza el logout de `authentication`.

#### Scenario: Identidad del usuario con nombre
- **WHEN** el usuario autenticado tiene nombre completo
- **THEN** la cabecera muestra su nombre completo y su rol

#### Scenario: Identidad del usuario sin nombre
- **WHEN** el usuario autenticado no tiene nombre completo
- **THEN** la cabecera muestra su correo electrónico y su rol

#### Scenario: Cerrar sesión desde la barra lateral
- **WHEN** el usuario pulsa "Cerrar sesión" al pie de la barra lateral
- **THEN** el sistema ejecuta el logout y el botón queda deshabilitado mientras la petición está en curso

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

### Requirement: Dashboard de inicio con datos de ejemplo
La ruta raíz privada SHALL mostrar un dashboard con un saludo al usuario, tarjetas KPI y una lista de actividad reciente alimentadas por datos estáticos locales, sin llamadas al backend, e indicar visiblemente que son "Datos de ejemplo".

#### Scenario: Dashboard tras iniciar sesión
- **WHEN** un usuario autenticado abre la ruta raíz
- **THEN** el sistema muestra un saludo con su nombre, las tarjetas KPI y la actividad reciente de ejemplo

#### Scenario: Datos marcados como ejemplo
- **WHEN** se muestra el dashboard
- **THEN** la página muestra el aviso "Datos de ejemplo" y no realiza peticiones HTTP para obtener esos datos

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

