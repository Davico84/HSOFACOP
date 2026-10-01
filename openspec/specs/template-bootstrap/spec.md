# template-bootstrap Specification

## Purpose
Reutilizar la plantilla en un proyecto nuevo sin buscar y reemplazar a mano: la identidad visible (nombre, textos, logos, colores, títulos de OpenAPI y de la pestaña) y los datos de la base de datos se declaran en `project.config.json` y se aplican con un asistente en consola (`pnpm project:setup`) o sin preguntas (`pnpm project:apply`), de forma segura, repetible y sin tocar identificadores técnicos. Capacidad técnica/plataforma.
## Requirements
### Requirement: Configuración única de la identidad visible
El repositorio SHALL declarar en `project.config.json` (raíz, validable con un JSON Schema versionado) el nombre visible, tagline, descripción, datos de base de datos (nombre, usuario, puerto, contenedor), JWT issuer, rutas de logos y favicon, y colores de los tokens de marca (claro y oscuro). El archivo MUST NOT contener secretos. El frontend SHALL leer de él el nombre, tagline, descripción, logos, favicon y título de la pestaña; el backend SHALL exponer el nombre y la descripción en OpenAPI desde su configuración. Los identificadores técnicos (paquete Java, nombres de artefactos Maven/npm) MUST NOT depender de esta configuración.

#### Scenario: La UI muestra la identidad configurada
- **WHEN** se renderizan las pantallas completas de login y de registro
- **THEN** muestran el nombre, el tagline y la descripción de `project.config.json`, sus subtítulos incluyen el nombre, y los logos usan las rutas configuradas con el nombre como texto alternativo

#### Scenario: Título de la pestaña desde la configuración
- **WHEN** se procesa el `index.html` del frontend (en desarrollo o en el build)
- **THEN** el `<title>` es el nombre de `project.config.json` y el favicon es la ruta configurada

#### Scenario: Configuración inválida
- **WHEN** `project.config.json` tiene un nombre vacío o demasiado largo, un nombre o usuario de base de datos con formato inválido, un nombre de contenedor que no esté en minúsculas, un puerto fuera de rango, un color fuera de la gramática admitida, una clave de color que no es un token de marca, o le falta un campo obligatorio
- **THEN** `project:apply` termina con un error que indica el campo, antes de cualquier otra comprobación, y no modifica ningún archivo

### Requirement: Asistente de configuración en consola
`pnpm project:setup` SHALL pedir por consola cada dato de la configuración mostrando su valor actual como predeterminado, validar cada respuesta al momento, y aplicar los cambios solo tras mostrar un resumen y recibir confirmación.

#### Scenario: Mantener valores con Enter
- **WHEN** el usuario responde con Enter vacío a una pregunta
- **THEN** se conserva el valor actual de ese dato

#### Scenario: Respuesta inválida
- **WHEN** el usuario responde con un valor inválido (p. ej. un puerto `abc` o un color `rojo`)
- **THEN** el asistente muestra el motivo y vuelve a preguntar el mismo dato

#### Scenario: Colores en hex o hsl
- **WHEN** el usuario indica un color como `#1D4ED8`, `#abc`, `hsl(221 76% 48%)` o `hsl(221, 76%, 48%)`
- **THEN** se acepta y se guarda sin pérdida: el hex tal cual en minúsculas y el `hsl` normalizado a `hsl(H S% L%)`; colores con alpha, fuera de rango u otros formatos se rechazan y se vuelve a preguntar

#### Scenario: Logo desde un archivo
- **WHEN** el usuario indica la ruta de un archivo de imagen existente (png, svg o webp) como logo
- **THEN** al confirmar, el archivo se copia a `modules/frontend/public/brand/logo-<variante>.<ext>` y la configuración apunta a esa copia (un mismo archivo puede usarse para varias variantes, y si cambia la extensión se retira la copia anterior no referenciada); si la ruta no existe o no es una imagen admitida, vuelve a preguntar

#### Scenario: Valores locales como predeterminados
- **WHEN** ya existe `modules/backend/secrets.properties` y el asistente pregunta los datos de base de datos
- **THEN** propone como valor actual los de ese archivo (Enter no los cambia) y el resumen muestra, clave por clave, qué cambiará en él

#### Scenario: Puerto ocupado por otro programa
- **WHEN** el usuario indica un puerto de base de datos que ya usa otro programa de la máquina (p. ej. un Postgres instalado)
- **THEN** el asistente lo rechaza explicando que el backend se conectaría a ese otro Postgres, y vuelve a preguntar el puerto

#### Scenario: Puerto publicado por el contenedor del proyecto
- **WHEN** el puerto indicado ya está en uso pero lo publica el contenedor Docker de este mismo proyecto
- **THEN** el asistente lo acepta sin avisar

#### Scenario: Aviso de datos existentes
- **WHEN** el usuario cambia el nombre de la base de datos o el usuario y el proyecto ya tiene datos en Docker (volumen `<contenedor>_pgdata` o contenedor existente)
- **THEN** el asistente advierte que esos datos no se aplicarán a la base existente y cómo recrearla (`docker compose … down -v`, que borra sus datos) o que elija otro nombre de contenedor

#### Scenario: Cambio de contraseña sincronizado
- **WHEN** el usuario cambia la contraseña, el proyecto ya tiene datos en Docker y su contenedor está en marcha
- **THEN** al aplicar, el asistente cambia también la contraseña dentro del Postgres del contenedor (`ALTER USER`, sin exponer la clave en la línea de comandos); si el contenedor está parado, advierte que hay que levantarlo y repetir, porque si no la conexión fallará

#### Scenario: Clave de base de datos solo en local
- **WHEN** el usuario indica una clave de base de datos
- **THEN** se escribe únicamente en `modules/backend/secrets.properties` y no aparece en `project.config.json`

#### Scenario: Cancelar en el resumen
- **WHEN** el usuario no confirma en el resumen final
- **THEN** no se modifica ningún archivo ni se copia ningún logo, y no quedan archivos temporales ni copias parciales

### Requirement: Aplicación segura de la configuración
`pnpm project:apply` (y el asistente al confirmar) SHALL aplicar la configuración a partir de la última aplicada (`.template/applied.json`) sin modificar identificadores técnicos, y SHALL proteger el trabajo del usuario.

#### Scenario: Identidad visible, contrato y documentación
- **WHEN** se cambian `name` o `description` y se aplica
- **THEN** `application.yml` (`app.name`/`app.description`), el título y la descripción de `contracts/openapi.json` y de la cabecera del cliente generado (coherentes entre sí), el campo `description` de `pom.xml` y del `package.json` raíz, y el nombre en README, `docs/`, `CLAUDE.md`, `SETUP-OPENSPEC.md` y `openspec/` (sin `changes/archive/`) usan los nuevos valores

#### Scenario: Identificadores técnicos intactos
- **WHEN** se aplica cualquier cambio de configuración
- **THEN** no cambian el paquete Java ni sus carpetas, la clase `OdontorisasApplication`, `groupId`/`artifactId`/`name` del `pom.xml`, el `name` de los `package.json`, `spring.application.name`, la clave de `orval.config.ts` ni el slug técnico en los comandos de la documentación (`odontorisas-frontend`)

#### Scenario: Base de datos y seguridad
- **WHEN** se cambian los datos de `database` o `jwtIssuer` y se aplica
- **THEN** `secrets.properties.example` y `compose.yaml` usan los nuevos valores por defecto (en `compose.yaml`, el nombre del contenedor es también el nombre del proyecto de Compose, de modo que cada proyecto tiene su propio volumen de datos); si existe `secrets.properties` local, solo se actualizan sus claves de BD y JWT issuer que aún tienen el valor por defecto anterior (las que personalizaste se conservan y se informan), conservando además orden, comentarios, claves desconocidas, la `DB_PASSWORD` existente y el `JWT_SECRET`

#### Scenario: Secretos locales inexistentes
- **WHEN** se aplica y no existen `modules/backend/secrets.properties` ni `modules/frontend/.env`
- **THEN** se crean desde sus `.example` con los valores de la config y un `JWT_SECRET` aleatorio

#### Scenario: Colores de marca
- **WHEN** se cambian los colores de `brand.colors` y se aplica
- **THEN** los tokens correspondientes de `globals.css` toman esos valores en `:root` y `.dark`, y el contrato de tema de `project-foundation` sigue cumpliéndose

#### Scenario: Sin restos del nombre anterior
- **WHEN** termina de aplicarse un cambio de `name`
- **THEN** un escáner recorre los archivos de texto del repositorio (sin `changes/archive/` ni la migración aplicada `V1__init.sql`) y, si queda el nombre anterior (coincidencia exacta y sensible a mayúsculas), termina con error listando archivo y línea

#### Scenario: Árbol de trabajo con cambios sin commitear
- **WHEN** se aplica con cambios sin commitear en archivos distintos de `project.config.json` y `modules/frontend/public/brand/`
- **THEN** termina con error pidiendo commitear o descartar, y no modifica ningún archivo

#### Scenario: Copia sin git
- **WHEN** se aplica en una copia de la plantilla que no es un repositorio git (p. ej. descargada como ZIP)
- **THEN** aplica la configuración recorriendo los archivos del disco (sin `node_modules`, `target`, `dist` ni archivos locales como `secrets.properties`/`.env`) y avisa de que no habrá forma automática de deshacer

#### Scenario: Ensayo sin escritura
- **WHEN** se ejecuta `project:apply --dry-run`
- **THEN** lista los archivos que cambiaría, sin escribir nada

#### Scenario: Re-aplicar sin cambios
- **WHEN** se aplica sin haber cambiado la configuración desde la última aplicación
- **THEN** no modifica ningún archivo e informa que no hay cambios

