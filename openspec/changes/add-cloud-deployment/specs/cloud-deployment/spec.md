## ADDED Requirements

### Requirement: Imagen de contenedor del backend
El backend SHALL construirse como imagen de contenedor desde `modules/backend/Dockerfile`. La imagen final SHALL contener solo el jar ejecutable, sin fuentes ni secretos, y ejecutarse como usuario sin privilegios, escuchando en el puerto de la variable `PORT` (8080 si no está). Toda la configuración SHALL llegar por variables de entorno, y la JVM SHALL quedar acotada para funcionar con 512 MB de memoria.

#### Scenario: Arranque en el puerto asignado
- **WHEN** la imagen se ejecuta con `PORT=10000` y las variables de base de datos y JWT
- **THEN** `GET /actuator/health/liveness` en el puerto 10000 responde `200` con `status` `UP`

#### Scenario: Imagen sin fuentes ni secretos
- **WHEN** se inspecciona el sistema de archivos de la imagen final
- **THEN** no contiene `secrets.properties`, archivos `.env`, `src/` ni `mvnw`
- **AND** el proceso corre con un usuario distinto de `root`

#### Scenario: Funciona con 512 MB
- **WHEN** el contenedor corre con un límite de 512 MB de memoria y 0,1 CPU
- **THEN** arranca, migra la base y responde el liveness sin ser terminado por falta de memoria

### Requirement: Blueprint de Render versionado
El repositorio SHALL incluir un `render.yaml` que declare el servicio web del backend (Docker, plan gratuito, rama `main`, health check a `/actuator/health/liveness`) con sus variables: los valores no secretos fijos en el archivo y las credenciales sin valor, para cargarlas en el panel de Render.

#### Scenario: Variables del servicio
- **WHEN** se lee `render.yaml`
- **THEN** fija `HEALTH_SHOW_DETAILS=never`, `SWAGGER_ENABLED=false` y `COOKIE_SECURE=true`
- **AND** declara `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET` y `CORS_ALLOWED_ORIGINS` sin valor (`sync: false`)
- **AND** despliega la rama `main`

### Requirement: Frontend con la API en el mismo origen
El frontend desplegado SHALL servir la API bajo su propio origen: `/api/*` y `/auth/*` SHALL reenviarse al backend, y cualquier otra ruta sin archivo estático SHALL devolver la aplicación. Las páginas de acceso SHALL vivir fuera de `/auth/*` (`/ingresar`, `/registro`). En producción, sin `VITE_API_URL`, el cliente SHALL usar rutas relativas; en desarrollo, por defecto `http://localhost:8080`. El build SHALL definirse en el repositorio (`vercel.json` en la raíz).

#### Scenario: URL base por entorno
- **WHEN** se resuelve la URL base de la API sin `VITE_API_URL`
- **THEN** es `http://localhost:8080` en desarrollo y `""` (mismo origen) en producción
- **AND** con `VITE_API_URL` definida se usa ese valor en ambos

#### Scenario: Páginas de acceso fuera de la API
- **WHEN** un usuario sin sesión entra a una ruta privada
- **THEN** la app lo lleva a `/ingresar`
- **AND** desde ahí navega a `/registro` y vuelve

#### Scenario: Reglas de reenvío
- **WHEN** se lee `vercel.json`
- **THEN** `/api/*` y `/auth/*` van al backend antes del fallback de la SPA
- **AND** `/actuator/*` no se reenvía
- **AND** el build instala con el lockfile de la raíz y publica `modules/frontend/dist`

#### Scenario: La sesión sobrevive a recargar en producción
- **WHEN** un usuario inicia sesión en la URL pública y recarga la página (Chrome y Safari)
- **THEN** sigue con la sesión iniciada (el refresh recibe la cookie de primera parte)

#### Scenario: Recargar una página de la SPA
- **WHEN** se recarga `/ingresar`, `/registro` o `/historias` en la URL pública
- **THEN** se muestra la página de la app

#### Scenario: Arranque en frío en la ruta crítica
- **WHEN** el backend estuvo suspendido y un usuario abre la URL pública, inicia sesión y recarga
- **THEN** ve la pantalla de espera, luego entra, y el refresh mantiene la sesión

### Requirement: Origen del frontend permitido en el backend
En despliegue, `CORS_ALLOWED_ORIGINS` SHALL contener exactamente el origen público de producción del frontend (sin `/` final ni comodines), porque el proxy reenvía el `Origin` del navegador al backend.

#### Scenario: Refresh a través del proxy
- **WHEN** el navegador hace `POST /auth/refresh` en la URL pública con `CORS_ALLOWED_ORIGINS` igual a ese origen
- **THEN** el backend responde `200` y renueva la sesión (no `403`)
