## Why

Antes de publicar en la nube, el odontólogo que no puede entrar (olvidó su contraseña, su cuenta está deshabilitada, necesita más cupo o el servidor tarda) no tiene a quién escribir: la pantalla de espera dice "avisa al administrador" sin decir cómo. Un contacto de soporte visible en las pantallas de acceso resuelve eso sin backend nuevo.

## What Changes

- **Contacto de soporte en `project.config.json`** (sección `contact`, **opcional**): `whatsapp` (solo dígitos con código de país, p. ej. `51959396384`) y `email`. Validado por el esquema y por `validateConfig`; si falta, la app no muestra el bloque (la plantilla sigue funcionando sin contacto). Valores de FACOP: `51959396384` y `davicova84@gmail.com`.
- **`ContactLinks`** (componente genérico en `core/components`): "¿Necesitas ayuda?" con dos enlaces:
  - "Escríbenos por WhatsApp", que abre `wa.me` en otra pestaña con un mensaje inicial ("Hola, necesito ayuda con <nombre del proyecto>");
  - el correo (`mailto:`).
- **Dónde aparece**:
  - en el **panel de marca** (`BrandPanel`) en escritorio: login, registro y pantalla de espera;
  - **debajo del formulario** de login y registro en móvil, donde el panel no se muestra;
  - en la pantalla de espera, estado **"Está tardando más de lo normal"**: "Si el problema continúa, escríbenos" con los enlaces, en lugar de "avisa al administrador" (si no hay contacto configurado, queda el texto actual).
- Accesible: enlaces con nombre claro, aviso de que WhatsApp se abre en otra pestaña, foco visible sobre el Roxo. Solo tokens de color.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `project-foundation`: nuevo requisito "Contacto de soporte en las pantallas de acceso".

## Impact

- Configuración: `project.config.json`, `scripts/project/project.config.schema.json`, `scripts/project/lib/config.mjs` (+ `config.test.mjs`); `pnpm project:apply` solo actualiza `.template/applied.json` (no hay textos que reemplazar).
- Frontend:
  - `config/project.ts` (tipo con `contact?`);
  - `core/components/ContactLinks` (nuevo);
  - `BrandPanel`, `AuthLayout`, `ServerWarmupScreen`.

  Sin dependencias nuevas.
- Sin cambios de backend, contrato ni dominio.
- Privacidad: el número y el correo quedan públicos en la web (los recogen bots de spam). Se recomienda un contacto de soporte o institucional; cambiarlo es editar `project.config.json`.
