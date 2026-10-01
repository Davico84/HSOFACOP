## Why

El repo se usará como **plantilla** para arrancar proyectos nuevos, pero su identidad visible ("OdontoRisas": nombre, textos del login, logos, colores, título de OpenAPI y de la pestaña) y los datos de la base de datos están escritos a mano en varios sitios. Al hacer una copia nueva hay que buscarlos y cambiarlos uno a uno. Se quiere **configurar esos datos de forma amigable** en un solo paso, **sin tocar nada que pueda afectar la estabilidad** del proyecto.

## What Changes

- **Nueva capacidad `template-bootstrap`** (técnica/plataforma), **solo superficial**:
  - **`project.config.json`** en la raíz (con JSON Schema para autocompletado): nombre visible, tagline, descripción, base de datos (nombre, usuario, puerto, contenedor), JWT issuer, logos, favicon y colores de marca. **Sin secretos** (la clave de BD y el `JWT_SECRET` solo van al `secrets.properties` local).
  - **`pnpm project:setup`**: **asistente en consola** que pregunta cada dato mostrando el valor actual (Enter = mantener), valida al momento, copia los logos desde la ruta que indiques, acepta colores en hex o `hsl()`, muestra un resumen de cambios y pide confirmación antes de aplicar.
  - **`pnpm project:apply`** (`--dry-run`): aplica `project.config.json` sin preguntas (para editar el JSON a mano o en CI).
  - Qué aplica: textos y logos de la UI, título de la pestaña y favicon, título y descripción de OpenAPI (contrato y cliente generado), el campo `description` (texto, no identificador) de `pom.xml` y del `package.json` raíz, colores de marca en `globals.css`, valores por defecto de BD/JWT en `secrets.properties.example` y `compose.yaml`, `secrets.properties` y `.env` locales (los crea si faltan, con `JWT_SECRET` aleatorio), y el **nombre** en README, `docs/`, `CLAUDE.md`, `SETUP-OPENSPEC.md` y OpenSpec (salvo el historial `changes/archive/`).
  - Seguro y repetible: se niega a correr con cambios sin commitear (salvo la propia config y los logos), idempotente, y guarda lo aplicado en `.template/applied.json`.
- **Refactor previo** para que la identidad visible **no esté en el código**: la UI lee nombre/tagline/descripción/logos de la config, `index.html` toma título y favicon por un plugin de Vite, OpenAPI lee `app.name`/`app.description` de `application.yml`, los colores de marca quedan entre marcadores en `globals.css`, y se quita el nombre de los comentarios del código.
- **Al final, la plantilla queda con identidad neutra** ("Mi Proyecto"), aplicada con el propio asistente/script, logos genéricos y `vision.md`/`domain.md` como esqueleto genérico.

## Capabilities

### New Capabilities
- `template-bootstrap`: configuración de la identidad visible y los datos de BD del proyecto en un solo archivo, con asistente en consola y aplicación segura al repositorio.

### Modified Capabilities
_(ninguna)_ — la UI cambia de dónde lee su marca; ningún requirement de `authentication`, `app-shell` ni `project-foundation` cambia de comportamiento.

## Non-goals

- **No se renombra nada técnico**: paquete Java `com.odontorisas`, clase `OdontorisasApplication`, `groupId`/`artifactId` del `pom.xml`, `name` de los `package.json`, `spring.application.name`, clave de `orval.config.ts`, nombres de tablas/migraciones. Son identificadores internos que no se ven en la app; cambiarlos arriesga la estabilidad.
- **Contenido de negocio** de `vision.md`/`domain.md`: se reemplaza el nombre, no se reescribe (salvo el esqueleto genérico final de esta plantilla).
- Derivar una paleta completa desde un color; formulario web.

## Impact

- **Nuevo**: `project.config.json`, `scripts/project/` (asistente, apply, schema, tests), `.template/applied.json`, `.github/workflows/template.yml`, scripts `project:setup`, `project:apply` y `test:template` en el `package.json` raíz.
- **Frontend**: `src/config/project.ts`, `LoginFeature`/`RegisterFeature` (screens de una línea), `AuthLayout`, `Logo`, logos a `public/brand/`, plugin de `index.html` en `vite.config.ts`, marcadores en `globals.css`, alias + `resolveJsonModule` en tsconfig/Vite/Vitest.
- **Backend**: `ProjectProperties` (`@ConfigurationProperties`) usado por `OpenApiConfig`; `application.yml` con `app.name`/`app.description`. Sin cambios de paquetes ni clases principales.
- **Docs**: `readme.md` ("Crear un proyecto desde la plantilla"), `docs/tooling-setup.md`, `docs/vision.md`.
