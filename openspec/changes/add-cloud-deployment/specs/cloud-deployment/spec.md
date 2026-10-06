## ADDED Requirements

### Requirement: Imagen de contenedor del backend
El backend SHALL construirse como imagen de contenedor desde `modules/backend/Dockerfile`, sin secretos dentro de la imagen, ejecutándose como usuario sin privilegios y escuchando en el puerto indicado por la variable `PORT` (8080 si no está). Toda la configuración SHALL llegar por variables de entorno. La JVM SHALL quedar acotada para funcionar con 512 MB de memoria.

#### Scenario: Arranque en el puerto asignado
- **WHEN** la imagen se ejecuta con `PORT=10000` y las variables de base de datos y JWT
- **THEN** `GET /actuator/health/liveness` en el puerto 10000 responde `200` con `status` `UP`

#### Scenario: Sin secretos en la imagen
- **WHEN** se inspecciona el sistema de archivos de la imagen
- **THEN** no contiene `secrets.properties` ni archivos `.env`

#### Scenario: Funciona con 512 MB
- **WHEN** el contenedor corre con un límite de 512 MB de memoria
- **THEN** arranca, migra la base y responde el liveness sin ser terminado por falta de memoria

### Requirement: Blueprint de Render versionado
El repositorio SHALL incluir un `render.yaml` que declare el servicio web del backend (Docker, plan gratuito, health check a `/actuator/health/liveness`) con sus variables. Los valores no secretos van fijos en el archivo; las credenciales SHALL declararse sin valor para cargarlas en el panel de Render.

#### Scenario: Variables del servicio
- **WHEN** se lee `render.yaml`
- **THEN** fija `HEALTH_SHOW_DETAILS=never`, `SWAGGER_ENABLED=false` y `COOKIE_SECURE=true`
- **AND** declara `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` y `CORS_ALLOWED_ORIGINS` sin valor (`sync: false`)

### Requirement: Frontend con la API en el mismo origen
El frontend desplegado SHALL servir la API bajo su propio origen: las peticiones del cliente a `/api/*` y `/auth/*` SHALL reenviarse al backend, y las navegaciones del navegador a rutas de la SPA (incluidas `/auth/login` y `/auth/register`) SHALL devolver la aplicación. En producción, sin `VITE_API_URL`, el cliente SHALL usar rutas relativas; en desarrollo, por defecto `http://localhost:8080`.

#### Scenario: URL base por entorno
- **WHEN** se resuelve la URL base de la API sin `VITE_API_URL`
- **THEN** es `http://localhost:8080` en desarrollo y `""` (mismo origen) en producción
- **AND** con `VITE_API_URL` definida se usa ese valor en ambos

#### Scenario: Reglas de reenvío en orden
- **WHEN** se lee `modules/frontend/vercel.json`
- **THEN** las navegaciones que piden HTML a `/auth/*` van a `index.html` antes que la regla de `/auth/*` hacia el backend
- **AND** `/api/*` y `/auth/*` van al backend antes del fallback de la SPA
- **AND** `/actuator/*` no se reenvía

#### Scenario: La sesión sobrevive a recargar en producción
- **WHEN** un usuario inicia sesión en la URL pública y recarga la página (también en Safari)
- **THEN** sigue con la sesión iniciada (el refresh recibe la cookie de primera parte)

#### Scenario: Recargar una página de la SPA
- **WHEN** se recarga `/auth/login` o `/historias` en la URL pública
- **THEN** se muestra la página de la app, no una respuesta del backend

### Requirement: Origen del frontend permitido en el backend
En despliegue, `CORS_ALLOWED_ORIGINS` SHALL contener exactamente el origen público del frontend, porque el proxy reenvía el `Origin` del navegador al backend.

#### Scenario: Refresh a través del proxy
- **WHEN** el navegador hace `POST /auth/refresh` en la URL pública con `CORS_ALLOWED_ORIGINS` igual a ese origen
- **THEN** el backend responde `200` y renueva la sesión (no `403`)
