## Why

La barra lateral muestra **todas** las secciones a cualquier usuario autenticado, y ninguna ruta privada restringe por rol: `RequireAuth` ya acepta `roles`, pero nadie lo usa. En cuanto un proyecto derivado añada una sección solo para administradores, un `USER` la verá en el menú y podrá abrirla escribiendo la URL. Además, el estado de "Acceso denegado" (`AccessDenied`) es una pantalla completa con su propio `<main>`: mostrado dentro del shell quedaría anidado y mal maquetado.

## What Changes

- Una **configuración neutral de secciones** (`core/config/sections.ts`: id, ruta y roles opcionales; sin roles = todos los autenticados) es la única fuente de verdad: de ella derivan el menú (que solo añade etiqueta e icono) y el árbol de rutas.
- La barra lateral (rail y cajón móvil) muestra **solo** las secciones permitidas para el rol del usuario.
- Cada sección es un **subárbol de rutas** protegido con sus roles (incluidas subrutas futuras): un usuario sin permiso que llegue por URL ve "Acceso denegado" **dentro del shell** (enfocado, con opción de volver) y no se carga ningún dato de la sección.
- `AccessDenied` gana una variante integrada en el shell (sin `<main>` propio ni alto de pantalla completa).
- `Role` del store pasa a ser el tipo generado desde el contrato (`UserResponseRole`): un rol mal escrito no compila.
- La plantilla deja un ejemplo: **"Módulo B" solo para `ADMIN`**.

## Non-goals

- **Autorización real en el backend**: ocultar un menú o proteger una ruta del frontend es UX, no seguridad. Cada endpoint protegido debe llevar su `@PreAuthorize` (y `OpenApiErrorsConfig` documenta el `403`).
- Gestión de roles o permisos finos (más allá de `ADMIN`/`USER`), ni paneles de inicio distintos por rol (`roleHome` sigue igual).
- Tests E2E de permisos (no hay Playwright ni seed de roles): queda pendiente y documentado; la integración usa el router y los guards reales.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `app-shell`: MODIFIED "Navegación declarada por configuración" — menú y rutas derivados de una configuración de secciones con roles; aplica la regla "Rol sin permiso" de `authentication` (que no cambia) integrada en el shell.

## Impact

- **Frontend**: nuevo `core/config/sections.ts`, `navItems.ts` (solo presentación + `navItemsFor`), `Sidebar`/`MobileNavDrawer`/`AppLayout` (pasan el rol), `routes/index.tsx` (`sectionRoute` por sección), `core/auth/RequireRole` y `AccessDenied` integrado, `useSessionStore` (`Role` generado).
- **Tests**: Vitest + RTL sobre el router real — menú por rol (rail y cajón), acceso denegado en el shell, subrutas, paridad, cambio de rol en caliente, sin peticiones sin rol.
- **Docs**: `docs/frontend.md` (secciones, rutas fuera del menú, loaders/prefetch, `@PreAuthorize`), `docs/testing.md` (E2E pendiente), `docs/vision.md`.
- Sin cambios de backend, contrato ni dominio.
