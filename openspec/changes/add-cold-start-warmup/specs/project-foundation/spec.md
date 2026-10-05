## ADDED Requirements

### Requirement: Endpoint de ping para mantener el backend despierto
El backend SHALL exponer `GET /actuator/health/liveness` sin autenticación, respondiendo `200` con `status` `UP` mientras la aplicación esté viva, sin consultar la base de datos. El nivel de detalle del health SHALL configurarse con la variable `HEALTH_SHOW_DETAILS` (por defecto `always`).

#### Scenario: Ping sin sesión
- **WHEN** un servicio externo llama a `GET /actuator/health/liveness` sin credenciales
- **THEN** recibe `200` con un JSON cuyo `status` es `UP`

#### Scenario: El ping no depende de la base de datos
- **WHEN** se consulta el grupo de liveness
- **THEN** su respuesta no incluye el indicador de la base de datos (`db`)

#### Scenario: Detalle oculto en despliegue
- **WHEN** la aplicación arranca con `HEALTH_SHOW_DETAILS=never` y se llama a `GET /actuator/health`
- **THEN** la respuesta solo trae `status`, sin `components` ni detalles

### Requirement: Aviso de arranque en frío al cargar la app
Mientras la app espera la primera respuesta del backend al cargar (restauración de la sesión), SHALL mostrar "Cargando…" durante los primeros 4 segundos y, si la espera se prolonga, SHALL mostrar el mensaje "Estamos preparando tu consultorio digital para iniciar el día, esto puede tomar un minuto…" anunciado a lectores de pantalla, hasta que el backend responda.

#### Scenario: Respuesta rápida
- **WHEN** el backend responde la restauración de la sesión antes de 4 segundos
- **THEN** solo se ve "Cargando…" y luego la app, sin el mensaje de arranque en frío

#### Scenario: Servidor despertando
- **WHEN** la restauración de la sesión sigue pendiente a los 4 segundos
- **THEN** el splash muestra el mensaje de arranque en frío en una región `status`

#### Scenario: El servidor termina de despertar
- **WHEN** el backend responde después de mostrarse el mensaje
- **THEN** el mensaje desaparece y la app continúa (a Inicio con sesión o al login sin ella)
