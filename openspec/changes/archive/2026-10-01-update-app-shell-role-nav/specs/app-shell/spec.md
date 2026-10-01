## MODIFIED Requirements

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
