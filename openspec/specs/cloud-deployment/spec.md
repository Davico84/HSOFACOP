# cloud-deployment Specification

## Purpose
Cómo se empaqueta y publica el sistema en planes gratuitos: imagen de contenedor del backend (Render), blueprint versionado, frontend en Vercel con la API en el mismo origen (cookie de sesión de primera parte) el origen del frontend permitido en el backend y las copias de seguridad diarias de la base, cifradas y verificadas. Guía y verificación: `docs/deployment.md`.
## Requirements
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

### Requirement: Copia diaria cifrada de la base fuera del proveedor
El repositorio SHALL incluir un workflow que una vez al día (mientras GitHub lo mantenga habilitado) y a pedido haga un volcado completo de la base de producción con una credencial de solo lectura, lo cifre con la clave pública configurada y lo guarde fuera del proveedor como artifact con 90 días de retención. Si falta la configuración, SHALL omitir la copia sin fallar.

#### Scenario: Copia diaria
- **WHEN** se cumple la hora programada y el secreto de conexión y la clave pública están configurados
- **THEN** el workflow guarda un artifact con el volcado cifrado y la fecha en el nombre, retenido 90 días

#### Scenario: Copia a pedido
- **WHEN** el responsable ejecuta el workflow manualmente
- **THEN** se genera una copia igual que la programada

#### Scenario: Credencial de solo lectura
- **WHEN** se usa la credencial de la copia para modificar la base
- **THEN** la base la rechaza

#### Scenario: Proyecto sin configurar
- **WHEN** el workflow corre en un repositorio sin el secreto de conexión o sin la clave pública
- **THEN** omite la copia, lo indica en el resumen del job y termina sin error

#### Scenario: Workflow programado desactivado
- **WHEN** GitHub desactiva el workflow programado tras 60 días sin actividad en el repositorio
- **THEN** no hay copias nuevas hasta reactivarlo
- **AND** la guía indica cómo detectarlo (correo de GitHub y fecha del último artifact) y reactivarlo desde la pestaña Actions o con `gh workflow enable`

### Requirement: Copia sin datos expuestos
Ningún volcado sin cifrar ni dato de la base SHALL subirse ni aparecer en los logs del workflow, y el volcado sin cifrar SHALL borrarse del runner al terminar el job, también cuando falla.

#### Scenario: Nada legible sin la clave privada
- **WHEN** alguien descarga el artifact de la copia sin la clave privada
- **THEN** solo obtiene un archivo cifrado con `age`
- **AND** los logs del workflow no muestran la cadena de conexión ni datos de la base

#### Scenario: Falla de la copia
- **WHEN** la base no responde o el volcado falla
- **THEN** el workflow falla y no sube ningún artifact
- **AND** el volcado sin cifrar, si llegó a escribirse, se borra del runner

### Requirement: Restauración de la copia verificada
Cada copia SHALL restaurarse, antes de subirse, en una PostgreSQL vacía de la misma versión mayor, y el workflow SHALL fallar si la restauración no termina, si la mayor versión aplicada con éxito en la tabla de migraciones (comparada como número) no es la de la última migración del repositorio, o si falta en la base restaurada alguna tabla de la copia. Si no puede determinar lo esperado, SHALL fallar en lugar de dar la copia por buena.

#### Scenario: Copia que se restaura
- **WHEN** el volcado se restaura en la base vacía del job
- **THEN** la mayor versión aplicada con éxito en la tabla de migraciones es la de la última migración del repositorio en orden numérico (p. ej. `V15` y no `V9`)
- **AND** cada tabla incluida en la copia existe en la base restaurada
- **AND** recién entonces se sube el artifact

#### Scenario: Copia que no se restaura
- **WHEN** la restauración falla, la base de la copia está atrasada respecto de las migraciones del repositorio o falta alguna de esas tablas
- **THEN** el workflow falla y no sube el artifact

#### Scenario: Sin referencia para verificar
- **WHEN** el directorio de migraciones no existe o no tiene migraciones versionadas, la copia no tiene tabla de migraciones o no incluye ninguna tabla
- **THEN** el workflow falla y no sube el artifact

### Requirement: Guía de restauración de la copia
El repositorio SHALL documentar cómo descifrar una copia y restaurarla en una base nueva, sin tocar la de producción.

#### Scenario: Restauración documentada
- **WHEN** el responsable sigue la guía con un artifact y su clave privada
- **THEN** obtiene una base con los datos de la copia, sin tocar la de producción

