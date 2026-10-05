## ADDED Requirements

### Requirement: Endpoint de ping para mantener el backend despierto
El backend SHALL exponer `GET /actuator/health/liveness` sin autenticación. La respuesta SHALL ser `200` con `status` `UP` mientras la aplicación esté viva, y SHALL NOT incluir el indicador de la base de datos, de modo que el ping no consulte la base.

#### Scenario: Ping sin sesión
- **WHEN** un servicio externo llama a `GET /actuator/health/liveness` sin credenciales
- **THEN** recibe `200`
- **AND** el JSON contiene `status` `UP`
- **AND** la respuesta no contiene el indicador `db`

#### Scenario: Liveness independiente de otros indicadores
- **WHEN** un indicador de salud ajeno a liveness (como el de la base) está `DOWN`
- **THEN** `GET /actuator/health/liveness` sigue respondiendo `200` con `status` `UP`

### Requirement: Superficie pública de Actuator mínima
El detalle del health SHALL configurarse con la variable `HEALTH_SHOW_DETAILS` (por defecto `always`). Las únicas rutas de Actuator sin autenticación SHALL ser las de health; `/actuator/info` SHALL requerir autenticación.

#### Scenario: Detalle oculto en despliegue
- **WHEN** la aplicación arranca con `HEALTH_SHOW_DETAILS=never` y se llama a `GET /actuator/health`
- **THEN** la respuesta solo trae `status`, sin `components` ni detalles

#### Scenario: Info no es pública
- **WHEN** se llama a `GET /actuator/info` sin credenciales
- **THEN** recibe `401`

### Requirement: Pool de conexiones que permite suspender la base
El pool de conexiones del backend SHALL permitir retirar todas las conexiones ociosas tras el tiempo configurado, sin mantener un mínimo de conexiones ni ejecutar keepalive, de modo que una base que se suspende por inactividad (Neon) pueda dormir cuando no hay peticiones. `minimum-idle`, `idle-timeout` y `maximum-pool-size` SHALL configurarse por variables (`DB_POOL_MIN_IDLE`, `DB_POOL_IDLE_TIMEOUT_MS`, `DB_POOL_MAX_SIZE`).

#### Scenario: Configuración por defecto del pool
- **WHEN** la aplicación arranca sin esas variables
- **THEN** el pool tiene `minimumIdle` 0, `keepaliveTime` 0 (desactivado), `idleTimeout` de 60 s y `maximumPoolSize` 5

#### Scenario: Retiro de conexiones ociosas
- **WHEN** el pool abrió conexiones, quedan ociosas y pasa el `idleTimeout` (más la tolerancia de la revisión periódica de Hikari)
- **THEN** el pool queda sin conexiones

#### Scenario: La base responde tras quedar sin conexiones
- **WHEN** el pool no tiene conexiones y llega una petición que consulta la base
- **THEN** el pool abre una conexión nueva y la petición responde con normalidad

### Requirement: Pantalla de arranque en frío al cargar la app
Mientras la app espera el intento de restaurar la sesión al cargar (la primera petición al backend), SHALL mostrar una pantalla de espera con la marca del proyecto, cuyo estado depende del tiempo transcurrido y de la conexión, hasta que el intento termine, con éxito o con error:
- 0–4 s: "Cargando…";
- 4–90 s: el título "Preparando tu consultorio digital", el mensaje "Estamos preparando tu consultorio digital para iniciar el día, esto puede tomar un minuto…" y una barra de progreso estimada que no llega al 100 %;
- más de 90 s: "Está tardando más de lo normal" con un botón "Reintentar";
- sin conexión a internet: "Sin conexión a internet", en cualquier momento.

Cada cambio de estado SHALL anunciarse a lectores de pantalla una sola vez.

#### Scenario: Respuesta rápida
- **WHEN** el intento de restaurar la sesión termina antes de 4 segundos
- **THEN** solo se ve "Cargando…" y luego la app, sin la pantalla de arranque en frío

#### Scenario: Servidor despertando
- **WHEN** el intento de restaurar la sesión sigue pendiente a los 4 segundos
- **THEN** se muestra "Preparando tu consultorio digital" con el mensaje de arranque en frío en una región `status`
- **AND** una barra de progreso (`progressbar`) con un valor menor que 100

#### Scenario: Espera demasiado larga
- **WHEN** el intento sigue pendiente a los 90 segundos
- **THEN** se muestra "Está tardando más de lo normal" con el botón "Reintentar", que recibe el foco
- **AND** al pulsarlo la app se recarga

#### Scenario: Llega la respuesta durante la espera larga
- **WHEN** el intento termina después de los 90 segundos, sin que el usuario pulse "Reintentar"
- **THEN** la pantalla desaparece y la app continúa

#### Scenario: Sin conexión a internet
- **WHEN** el navegador no tiene conexión mientras el intento está pendiente
- **THEN** se muestra "Sin conexión a internet" en lugar de los estados de arranque
- **AND** al volver la conexión la app se recarga

#### Scenario: Restauración exitosa tras la espera
- **WHEN** la sesión se restaura después de mostrarse la pantalla de arranque
- **THEN** la pantalla desaparece y la app continúa con la sesión

#### Scenario: Restauración fallida tras la espera
- **WHEN** el intento de restaurar la sesión sigue pendiente más de 4 segundos y termina con error
- **THEN** la pantalla desaparece
- **AND** la sesión queda limpia
- **AND** se muestra el login sin la pantalla de arranque

#### Scenario: Montaje doble en StrictMode
- **WHEN** el layout se monta, se desmonta y se vuelve a montar bajo React StrictMode
- **THEN** no se dispara una petición adicional de restauración
- **AND** la pantalla de arranque aparece una sola vez a los 4 segundos
- **AND** al terminar no quedan timers pendientes
