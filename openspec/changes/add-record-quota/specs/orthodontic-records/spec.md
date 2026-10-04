## ADDED Requirements

### Requirement: Límite de historias por tratante
Al crear una historia clínica, si el autor es un `USER` con cupo y ya creó tantas historias como su cupo, el sistema SHALL rechazar la creación con `409` y el mensaje "Alcanzaste el máximo de N historias clínicas.", sin crear nada. La verificación SHALL hacerse de forma que dos creaciones simultáneas no superen el cupo. Editar, imprimir y buscar las historias existentes SHALL seguir igual. Un `ADMIN` no tiene cupo. En el listado, el tratante con cupo SHALL ver cuántas historias usó de su cupo ("N de M historias"), y, si llegó al tope, "Nueva historia" SHALL estar deshabilitado con el aviso visible.

#### Scenario: Crear dentro del cupo
- **WHEN** un `USER` con cupo 5 y 4 historias crea una historia
- **THEN** se crea normalmente y el listado muestra "5 de 5 historias"

#### Scenario: Crear con el cupo lleno
- **WHEN** un `USER` con cupo 5 y 5 historias intenta crear otra
- **THEN** la API responde `409` (`/errors/record-quota-reached`) con "Alcanzaste el máximo de 5 historias clínicas." y no crea la historia

#### Scenario: Botón deshabilitado al llegar al tope
- **WHEN** un `USER` con el cupo lleno abre el listado de historias
- **THEN** "Nueva historia" está deshabilitado y se ve el aviso "Alcanzaste el máximo de 5 historias clínicas. Pide al administrador ampliar tu cupo."

#### Scenario: Cupo cero sin historias
- **WHEN** un `USER` con cupo 0 y ninguna historia abre el listado
- **THEN** el estado vacío muestra "Nueva historia" deshabilitado con el aviso de que alcanzó el máximo

#### Scenario: Abrir el formulario nuevo con el cupo lleno
- **WHEN** un `USER` con el cupo lleno abre directamente la pantalla de nueva historia
- **THEN** ve el aviso desde el inicio y "Crear historia" está deshabilitado
- **AND** si el servidor rechaza una creación por cupo, el formulario muestra el aviso y no navega

#### Scenario: Editar con el cupo lleno
- **WHEN** un `USER` con el cupo lleno edita, guarda o imprime una de sus historias
- **THEN** todo funciona como siempre

#### Scenario: Sin límite por defecto
- **WHEN** un `USER` sin cupo asignado crea historias
- **THEN** puede crear todas las que quiera y el listado no muestra "N de M"

#### Scenario: Creaciones simultáneas
- **WHEN** un `USER` con cupo 5 y 4 historias envía dos creaciones al mismo tiempo
- **THEN** se crea una sola y la otra recibe `409`

#### Scenario: El ADMIN no tiene cupo
- **WHEN** un `ADMIN` crea historias
- **THEN** nunca se le aplica un límite
