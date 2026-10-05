# project-foundation Specification

## Purpose

El esqueleto ejecutable y validable del monorepo: un backend Spring Boot que levanta y aplica migraciones, un frontend React + Vite que compila/sirve y pasa `validate`, una estructura arquitectónica establecida y la validación de mensajes de commit. Provee una base estable (sin dominios de negocio) sobre la que nacen las capacidades futuras.
## Requirements
### Requirement: Backend base ejecutable
El backend SHALL arrancar como una aplicación Spring Boot y exponer un endpoint de salud que confirme que el servicio está operativo, sin depender de ninguna capacidad de negocio.

#### Scenario: Arranque de la aplicación
- **WHEN** se ejecuta `./mvnw spring-boot:run` con la configuración provista
- **THEN** la aplicación inicia sin errores
- **AND** una petición GET al endpoint de salud responde `200 OK`

#### Scenario: Configuración única y externalizada
- **WHEN** se inspecciona la configuración del backend
- **THEN** existe una **única** configuración (sin perfiles `dev`/`qa`/`pro`)
- **AND** todos los valores configurables (datasource, credenciales, secretos) se externalizan como variables de entorno/secretos
- **AND** ningún valor sensible está versionado (solo se versiona un archivo de ejemplo)

### Requirement: Migraciones de base de datos gestionadas por Flyway
El backend SHALL gestionar el esquema de base de datos exclusivamente con Flyway, con `spring.jpa.hibernate.ddl-auto=none`.

#### Scenario: Migración inicial en base limpia
- **WHEN** la aplicación arranca contra una base de datos PostgreSQL limpia
- **THEN** Flyway aplica las migraciones de `db/migration`
- **AND** Hibernate no crea ni altera tablas por su cuenta

### Requirement: Frontend base ejecutable y validable
El frontend SHALL compilar, construir y servir una SPA base con React + Vite, y pasar la validación de calidad completa.

#### Scenario: Build de producción
- **WHEN** se ejecuta `pnpm build`
- **THEN** el proyecto compila con TypeScript y genera el bundle sin errores

#### Scenario: Validación de calidad
- **WHEN** se ejecuta `pnpm validate`
- **THEN** typecheck, lint y tests se ejecutan y pasan

#### Scenario: Prueba base con MSW
- **WHEN** se ejecuta la suite de pruebas
- **THEN** existe al menos una prueba con React Testing Library que renderiza la app
- **AND** MSW intercepta las peticiones de red en el entorno de test

### Requirement: Estructura arquitectónica establecida
El código base SHALL seguir la arquitectura definida en `docs/architecture.md`: en el backend, la **lógica de negocio** vive separada de los **adaptadores técnicos** (`infra` es solo para lo técnico); en el frontend, la organización es por pantallas/módulos.

#### Scenario: Capas del backend
- **WHEN** se inspecciona el árbol de paquetes del backend
- **THEN** la lógica de negocio reside en `service.<dominio>` (no bajo `infra`)
- **AND** `infra` contiene únicamente adaptadores técnicos (p. ej. `config`, `security`, `storage`, `mail`)
- **AND** `presentation` no importa directamente de `persistence`
- **AND** `persistence` no depende de `presentation` ni de `service`
- **AND** `service` no depende de `presentation`

#### Scenario: Estructura del frontend
- **WHEN** se inspecciona `modules/frontend/src`
- **THEN** existen los directorios `layouts`, `screens`, `modules`, `store`, `routes` y `styles`
- **AND** `modules/core` no depende de otros módulos

### Requirement: Validación de mensajes de commit
El repositorio SHALL validar que los mensajes de commit cumplen Conventional Commits mediante un hook `commit-msg`.

#### Scenario: Commit con formato inválido
- **WHEN** se intenta crear un commit cuyo mensaje no cumple Conventional Commits
- **THEN** el hook `commit-msg` rechaza el commit con un mensaje de error explicativo

#### Scenario: Commit con formato válido
- **WHEN** se crea un commit con un mensaje del tipo `feat(scope): descripción`
- **THEN** el hook permite completar el commit

### Requirement: Tema definido por tokens CSS
El frontend SHALL definir su paleta (colores y radio) como variables CSS en un único archivo, `src/styles/globals.css`: valores claros en `:root` y oscuros en `.dark`. Tailwind SHALL generar las utilidades de color (`bg-*`, `text-*`, `border-*`, incluidos los modificadores de opacidad como `bg-primary/10`) a partir de esas variables. El modo oscuro SHALL activarse con la clase `dark` en el elemento raíz. Los componentes y hooks MUST NOT contener colores literales (hex, `rgb()`, `hsl()`); cambiar la marca SHALL requerir editar solo `globals.css`.

#### Scenario: Utilidades generadas desde los tokens
- **WHEN** se compila `globals.css` con Tailwind pidiendo utilidades de tokens (`bg-primary`, `text-muted-foreground`, `bg-primary/10`, `from-brand-start`)
- **THEN** el CSS resultante resuelve cada utilidad a partir de la variable correspondiente (`--primary`, `--muted-foreground`, `--brand-start`)

#### Scenario: Valores claros y oscuros de la paleta
- **WHEN** se inspecciona `globals.css`
- **THEN** cada token de color está definido en `:root` y en `.dark`

#### Scenario: Modo oscuro por clase
- **WHEN** se compila una utilidad con la variante `dark:` (p. ej. `dark:hidden`)
- **THEN** el selector generado depende de un ancestro con la clase `dark`, no de `prefers-color-scheme`

#### Scenario: Sin colores literales en componentes
- **WHEN** se inspeccionan los archivos `.ts`/`.tsx` de `src/` (excepto el cliente generado y los tests)
- **THEN** ninguno contiene colores literales (hex, `rgb()`/`rgba()`, `hsl()`/`hsla()`)

### Requirement: Aviso de backend listo al arrancar
Cuando el backend termina de arrancar y ya acepta peticiones, SHALL escribir en el log un aviso destacado y fácil de localizar con el nombre del proyecto, la URL base con el puerto real y el estado de la documentación de la API. El aviso SHALL NOT incluir secretos ni otros valores sensibles de configuración.

#### Scenario: Aviso con la URL real
- **WHEN** la aplicación termina de arrancar
- **THEN** el log muestra un bloque delimitado que incluye el nombre del proyecto (`app.name`) y la URL `http://localhost:<puerto>` con el puerto en el que realmente escucha (incluido el context-path si hay uno)

#### Scenario: Swagger activo
- **WHEN** la aplicación arranca con la documentación habilitada (`SWAGGER_ENABLED=true`)
- **THEN** el aviso incluye la URL de Swagger UI (`<url base>/swagger-ui.html`)

#### Scenario: Swagger desactivado
- **WHEN** la aplicación arranca con la documentación deshabilitada (por defecto)
- **THEN** el aviso indica que Swagger UI está desactivado y cómo activarlo (`SWAGGER_ENABLED=true`)

#### Scenario: Sin secretos en el aviso
- **WHEN** se escribe el aviso
- **THEN** no contiene el secreto JWT, la contraseña de la base de datos ni ningún otro valor de configuración sensible

### Requirement: Paleta de la marca FACOP
El tema SHALL usar la paleta oficial de FACOP: Roxo `#832C87` como color principal en modo claro (botones, enlaces, foco y elementos activos), Grafite `#3C3C3B` como color de texto, y solo grises neutros (sin tinte) para fondos, superficies y bordes. Ningún token SHALL usar tonos fuera de la paleta salvo los colores semánticos de error, éxito y aviso. En modo oscuro el color principal SHALL ser un Roxo aclarado. Todo par de texto sobre su fondo del tema (texto, texto secundario, texto sobre el color principal, sobre secundario y sobre acento) SHALL cumplir contraste WCAG AA (4,5:1) en claro y en oscuro. La hoja impresa SHALL imprimir texto y líneas en Preto `#000000`.

#### Scenario: Color principal en modo claro
- **WHEN** se compila el tema en modo claro
- **THEN** `--primary` es el Roxo `#832C87` y `--foreground` es el Grafite `#3C3C3B`

#### Scenario: Sin turquesa
- **WHEN** se revisan los tokens de color claros y oscuros
- **THEN** ninguno, salvo `destructive`, `success` y `warning`, tiene un tono fuera del Roxo o de los grises neutros (tampoco el degradado del login)

#### Scenario: Contraste de lectura
- **WHEN** se calcula el contraste de cada par texto/fondo del tema (`foreground`/`background`, `muted-foreground`/`background`, `muted-foreground`/`muted`, `primary-foreground`/`primary`, `secondary-foreground`/`secondary`, `accent-foreground`/`accent`) en claro y en oscuro
- **THEN** todos alcanzan al menos 4,5:1

#### Scenario: Gris oficial no usado para texto
- **WHEN** se elige el color de texto secundario
- **THEN** es un gris neutro con contraste AA (el Gris `#808080`, de 3,9:1 sobre blanco, no se usa para texto)

#### Scenario: Modo oscuro
- **WHEN** el usuario activa el modo oscuro
- **THEN** el color principal es un Roxo aclarado legible sobre el fondo oscuro y las superficies son grises neutros oscuros

#### Scenario: Logos oficiales
- **WHEN** se abre la app en modo claro, en modo oscuro o en el login
- **THEN** se ve el logo oficial de FACOP según el fondo: positivo (escudo Roxo y "FACOP" en Grafite) sobre fondo claro, en blanco sobre fondo oscuro o Roxo, y el escudo Roxo como favicon y en la barra contraída

#### Scenario: Panel del login
- **WHEN** se abre el inicio de sesión en escritorio
- **THEN** el panel de marca es Roxo liso con el logo en blanco, sin degradado ni turquesa

#### Scenario: Hoja impresa en negro
- **WHEN** se imprime una historia
- **THEN** el texto y las líneas salen en `#000000` y la hoja conserva su diseño

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

