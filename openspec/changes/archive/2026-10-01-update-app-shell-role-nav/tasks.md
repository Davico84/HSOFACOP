> Solo frontend (`modules/frontend`). Seguir el skill `frontend-guard` antes de tocar componentes. Tests Vitest + RTL derivados de los Scenario (tabla de D8). Revisado por Codex.

## 1. Configuración y tipos (D1, D2)

- [x] 1.1 `useSessionStore`: `type Role = UserResponseRole` (del modelo generado)
- [x] 1.2 `core/config/sections.ts`: `SectionId`, `sections` (Módulo B con `roles: ["ADMIN"]`), `sectionById`, `canAccess`
- [x] 1.3 `navItems.ts`: solo presentación por `sectionId` + `navItemsFor(role)`
- [x] 1.4 Tests unitarios: `id`/`path` únicos, `sectionById`, `canAccess`, `navItemsFor`

## 2. Menú filtrado por rol (D3)

- [x] 2.1 `Sidebar` recibe `role`; `AppLayout` y `MobileNavDrawer` lo pasan
- [x] 2.2 Tests: ítem sin roles visible para todos; restringido oculto en rail y cajón; activo para ADMIN

## 3. Rutas por sección protegidas (D4–D7)

- [x] 3.1 `AccessDenied` con variante `embedded` (section enfocable, sin `<main>` ni `min-h-screen`)
- [x] 3.2 `core/auth/RequireRole` (solo evalúa con sesión autenticada) y `routes/index.tsx` con `sectionRoute(id, children)` (subárbol por sección)
- [x] 3.3 Tests: acceso denegado dentro del shell (USER/ADMIN, foco, volver al inicio), subrutas, paridad sobre todas las secciones con `roles`, cambio de rol en caliente, sin carga de datos (query + MSW)
- [x] 3.4 Regresión: "Próximamente", 404 privado, tooltips, `guards.test.tsx`

## 4. Verificación y docs

- [x] 4.1 `pnpm validate` verde
- [x] 4.2 `docs/frontend.md`: dónde se declara una sección, cómo se derivan menú y rutas, `RequireRole` para rutas fuera del menú, regla de loaders/prefetch/queries (D7), ocultar ≠ autorizar (`@PreAuthorize`)
- [x] 4.3 `docs/testing.md`: E2E de permisos por rol pendiente (sin Playwright ni seed de roles) y qué cubre la integración
- [x] 4.4 Prueba manual: USER no ve "Módulo B" y `/modulo-b` muestra acceso denegado en el shell; ADMIN (promovido en BD) lo ve y lo abre; móvil y tablet igual
- [x] 4.5 `openspec validate update-app-shell-role-nav --strict`
