## ADDED Requirements

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
El código base SHALL seguir la arquitectura definida en `docs/architecture.md`: capas en backend y pantallas/módulos en frontend.

#### Scenario: Capas del backend
- **WHEN** se inspecciona el árbol de paquetes del backend
- **THEN** existen los paquetes `presentation`, `infra` y `persistence`
- **AND** `presentation` no importa directamente de `persistence`

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
