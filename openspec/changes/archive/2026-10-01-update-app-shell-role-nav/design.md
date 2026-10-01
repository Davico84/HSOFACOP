## Context

- `core/components/shell/navItems.ts`: `NavItemConfig { label, icon, to }` y la lista `navItems` (Inicio, Módulo A, Módulo B). `Sidebar` la recorre entera; `MobileNavDrawer` reutiliza `Sidebar` (variant `drawer`).
- `routes/index.tsx`: `RequireAuth → AppLayout → [ROOT, MODULE_A, MODULE_B]`, rutas planas. Añadir una sección hoy = entrada en `navItems` + ruta en el router (dos sitios).
- `core/auth/RequireAuth` ya acepta `roles` y devuelve `<AccessDenied />` (pantalla completa con su propio `<main>`). Lo prueba `guards.test.tsx`; ninguna ruta lo usa.
- `RootLayout` no monta los guards mientras la sesión está en `idle`/`loading` (bootstrap con splash).
- `useSessionStore`: `type Role = "ADMIN" | "USER"` escrito a mano, aunque el contrato ya genera `UserResponseRole` (orval: unión de literales + objeto `as const`).
- No hay loaders de React Router ni `prefetchQuery` en la app; no hay E2E (Playwright) configurado.
- La política "rol sin permiso → acceso denegado con opción de volver" ya está en `authentication` ("Protección de rutas por autenticación y rol").

## Goals / Non-Goals

**Goals:** una sola fuente de verdad, neutral y tipada, para qué secciones existen y qué roles las ven; menú y árbol de rutas derivados de ella; denegación integrada en el shell, accesible y sin parpadeos; ninguna carga de datos de una sección para un rol no permitido.

**Non-Goals:** ver `proposal.md` (autorización del backend, permisos finos, `roleHome`).

## Decisions

### D1. Configuración neutral de secciones (`core/config/sections.ts`) — revisión de Codex
La política (qué secciones hay y quién las ve) se separa de lo visual (etiqueta, icono):
```ts
export type SectionId = "home" | "moduleA" | "moduleB";
export interface SectionConfig { id: SectionId; path: string; roles?: readonly Role[] } // sin roles = todos los autenticados
export const sections: readonly SectionConfig[] = [
  { id: "home", path: PATHS.ROOT },
  { id: "moduleA", path: PATHS.MODULE_A },
  { id: "moduleB", path: PATHS.MODULE_B, roles: ["ADMIN"] },   // ejemplo de la plantilla
];
export function sectionById(id: SectionId): SectionConfig
export function canAccess(section: SectionConfig, role: Role): boolean
```
- `navItems.ts` declara solo lo visual por `sectionId` (`{ sectionId: "moduleB", label, icon }`) y expone `navItemsFor(role)`, que toma `path` y `roles` de la sección. **Ningún sitio repite rutas ni roles.**
- Se consulta por `SectionId` (tipado), no por coincidencia de rutas: no hay `rolesFor(path)` ambiguo entre "pública para autenticados" y "no declarada".
- Un test exige `path` e `id` únicos.

### D2. `Role` derivado del contrato — revisión de Codex
`useSessionStore`: `export type Role = UserResponseRole` (importado del modelo generado). Un typo (`roles: ["ADMN"]`) no compila, y un rol nuevo en el contrato aparece solo. Validar en runtime la respuesta del backend queda fuera.

### D3. El menú recibe el rol, no lee el store
`Sidebar` recibe `role: Role` y pinta `navItemsFor(role)`; `AppLayout` (que ya tiene `user`) se lo pasa a la barra fija y a `MobileNavDrawer`. Componente de presentación, testeable sin store; rail y cajón filtran igual por construcción. Si el rol cambia en caliente, React vuelve a renderizar con el nuevo rol.

### D4. Cada sección es un **subárbol** de rutas protegido — revisión de Codex (subrutas)
`routes/index.tsx` monta cada sección con un helper que recibe el `SectionId`:
```ts
function sectionRoute(id: SectionId, children: RouteObject[]): RouteObject {
  const section = sectionById(id);
  return { path: section.path, element: section.roles ? <RequireRole roles={section.roles} /> : <Outlet />, children };
}
// sectionRoute("moduleB", [{ index: true, element: <ComingSoonScreen title="Módulo B" /> }])
```
El guard protege la ruta de la sección **y todas sus subrutas** (`/modulo-b/:id`, `/modulo-b/nuevo`…).
**Corrección al implementar**: React Router resuelve el 404 global **antes** de montar cualquier guard (si no coincide ninguna ruta, no se monta nada), así que "el guard decide antes que el 404" no era cierto por sí solo, y un rol sin permiso distinguiría subrutas existentes ("Acceso denegado") de inexistentes (404). Por eso `sectionRoute` añade a las secciones **restringidas** un comodín `*` bajo el guard que pinta `SectionNotFound` (no encontrado dentro del shell): un rol no permitido ve siempre acceso denegado; uno permitido, no encontrado. Las secciones sin roles mantienen el 404 global.
Rutas restringidas que no son una sección del menú: `<RequireRole roles={…} />` explícito (documentado).

### D5. `RequireRole` dentro del shell; sin parpadeo — revisión de Codex
- Vive en `core/auth`, se monta **dentro** de `AppLayout` (bajo `RequireAuth`). Con rol permitido → `<Outlet />`; si no → `<AccessDenied embedded />`.
- Solo evalúa permisos con `status === "authenticated"` y `user`; en cualquier otro estado no renderiza nada (el bootstrap ya lo cubre `RootLayout`). Nunca muestra "Acceso denegado" por un estado transitorio.
- No se reutiliza `RequireAuth roles`: devuelve la pantalla completa con su `<main>`, y dentro de `AppLayout` quedaría `<main>` anidado. `RequireAuth` sigue igual (guard de sesión).

### D6. `AccessDenied embedded` accesible
Con `embedded`: `<section aria-labelledby tabIndex={-1}>` con el mismo `<h1>`, texto y enlace "Volver al inicio", sin `min-h-screen`, dentro del único `<main>` del shell; al montarse recibe el **foco**, para que el lector de pantalla anuncie el estado tras navegar. Sin `embedded`: la pantalla completa actual.

### D7. Ninguna carga de datos sin el rol — revisión de Codex
Regla para secciones restringidas (documentada en `docs/frontend.md`):
- Las queries (TanStack Query) viven en componentes **hijos** del guard: si el rol no está permitido, no se montan y no hay petición.
- **Loaders** de React Router: se ejecutan antes de renderizar el guard. Si una sección los usa, el loader DEBE comprobar `canAccess(section, role)` (con `useSessionStore.getState()`) y no cargar nada si no hay permiso. Hoy la app no usa loaders.
- **Prefetch** (`queryClient.prefetchQuery`) hacia una sección restringida: solo si `canAccess`.
- Ocultar o bloquear en el frontend **no autoriza**: cada endpoint restringido lleva `@PreAuthorize` en el backend (y `OpenApiErrorsConfig` documenta su `403`).

### D8. Tests (Vitest + RTL; router real `appRoutes` con `createMemoryRouter`, sin `RootLayout`, como `AppLayout.test.tsx`)
| Scenario | Test |
|---|---|
| Ítem sin roles visible para todos | `Sidebar` (rail y drawer) con USER y con ADMIN: "Inicio" y "Módulo A" visibles |
| Ítem restringido oculto | `Sidebar variant="rail"` y `MobileNavDrawer` con USER: sin "Módulo B"; con ADMIN: presente |
| Ítem activo en sección restringida | ADMIN en `/modulo-b`: "Módulo B" con `aria-current="page"` |
| Acceso por URL | USER en `/modulo-b`: "Acceso denegado" visible y enfocado, shell visible, contenido ausente; "Volver al inicio" → `/`. ADMIN: ve "Próximamente — Módulo B" |
| Subrutas | `sectionRoute("moduleB", [{ path: ":id", element: … }])` en un router de test: USER en `/modulo-b/123` → denegado; ADMIN → detalle; ADMIN en subruta inexistente → no encontrado |
| Misma configuración (paridad) | Para **cada** sección con `roles`, sobre `appRoutes` real: un rol fuera de la lista ve denegado y no el contenido; uno permitido, no. Quitar el guard del router lo hace fallar |
| Cambio de rol en caliente | ADMIN en `/modulo-b` → `setState` a USER: el menú oculta "Módulo B" y la ruta muestra denegado |
| Sin carga de datos | Hijo de prueba con `useQuery` bajo una sección restringida + MSW: con USER no se hace la petición; con ADMIN, sí |
| Unit `sections` | `id`/`path` únicos, `sectionById`, `canAccess` |
Regresión: "Próximamente", 404 privado no restringido, tooltips de la barra compacta, `guards.test.tsx`.
**E2E**: `docs/testing.md` pide integración + E2E para permisos por rol, pero no hay Playwright ni seed de roles en el backend de E2E. Queda **pendiente y documentado**; la cobertura de integración anterior usa el router y los guards reales.

## Risks / Trade-offs

- [Confundir ocultar con autorizar] → D7 y `docs/frontend.md`: `@PreAuthorize` obligatorio en el backend.
- [Una sección con loader que no compruebe el rol] → regla D7 documentada; sin loaders hoy.
- [Un `USER` no puede probar el ejemplo de `ADMIN`] → promover un usuario en BD para la prueba manual (`UPDATE users SET role = 'ADMIN' WHERE email = …`).

## Migration Plan

Solo frontend. Rollback = revertir el PR.
