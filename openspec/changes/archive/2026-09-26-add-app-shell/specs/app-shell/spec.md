## ADDED Requirements

### Requirement: Layout privado común
El sistema SHALL renderizar todas las rutas autenticadas dentro de un layout común compuesto por una barra lateral de navegación (`<aside>`/`<nav>`), una cabecera (`<header>`) y un área de contenido principal (`<main>`). Las rutas de invitado (login, registro) MUST NOT mostrar este layout.

#### Scenario: Ruta privada dentro del shell
- **WHEN** un usuario autenticado navega a una ruta privada
- **THEN** el sistema muestra la barra lateral de navegación, la cabecera y el contenido de la ruta en el área principal

#### Scenario: Rutas de invitado sin shell
- **WHEN** un usuario sin sesión abre la pantalla de login o de registro
- **THEN** el sistema muestra la pantalla de autenticación sin barra lateral ni cabecera del shell

### Requirement: Navegación declarada por configuración
El sistema SHALL construir los ítems de la barra lateral a partir de una lista de configuración (etiqueta, icono y ruta), resaltar el ítem correspondiente a la ruta activa y enrutar cada ítem de ejemplo a una página "Próximamente" dentro del shell.

#### Scenario: Ítem activo resaltado
- **WHEN** el usuario está en la ruta de un ítem de navegación
- **THEN** ese ítem se marca como activo (`aria-current="page"`) y ningún otro lo está

#### Scenario: Navegar a un ítem de ejemplo
- **WHEN** el usuario selecciona un ítem de navegación de ejemplo
- **THEN** el sistema muestra la página "Próximamente" con el nombre de la sección, manteniendo el shell visible

#### Scenario: Ruta privada inexistente
- **WHEN** un usuario autenticado navega a una ruta que no existe
- **THEN** el sistema muestra la página de error/no encontrado existente

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
El sistema SHALL adaptar la barra lateral al ancho de pantalla: expandida en escritorio, compacta (solo iconos, con `aria-label`) en tablet y oculta tras un botón de menú en móvil, donde se abre como cajón superpuesto que se cierra al navegar, al pulsar fuera o con la tecla `Escape`.

#### Scenario: Abrir el cajón en móvil
- **WHEN** en móvil el usuario pulsa el botón de menú
- **THEN** el cajón de navegación se abre y el botón refleja el estado con `aria-expanded="true"`

#### Scenario: Cerrar el cajón al navegar
- **WHEN** con el cajón abierto el usuario selecciona un ítem de navegación
- **THEN** el sistema navega a la ruta y cierra el cajón

#### Scenario: Cerrar el cajón con Escape o clic fuera
- **WHEN** con el cajón abierto el usuario pulsa `Escape` o hace clic en el fondo superpuesto
- **THEN** el cajón se cierra sin navegar

### Requirement: Dashboard de inicio con datos de ejemplo
La ruta raíz privada SHALL mostrar un dashboard con un saludo al usuario, tarjetas KPI y una lista de actividad reciente alimentadas por datos estáticos locales, sin llamadas al backend, e indicar visiblemente que son "Datos de ejemplo".

#### Scenario: Dashboard tras iniciar sesión
- **WHEN** un usuario autenticado abre la ruta raíz
- **THEN** el sistema muestra un saludo con su nombre, las tarjetas KPI y la actividad reciente de ejemplo

#### Scenario: Datos marcados como ejemplo
- **WHEN** se muestra el dashboard
- **THEN** la página muestra el aviso "Datos de ejemplo" y no realiza peticiones HTTP para obtener esos datos
