# Estándares de Frontend — HS FACOP

Dimensión **tecnológica** (reutilizable). Guía única del cliente: stack, arquitectura de pantallas/módulos, capa de datos (React Query + Axios), estado de cliente (Zustand) y patrones de UI. El **estilo general de código** (TypeScript, nombres, legibilidad) vive en `docs/coding-style.md`; el **stack cerrado y versiones** en `docs/architecture.md §3`; las **pruebas** en `docs/testing.md`.

---

## 1. Stack y arquitectura de pantallas/módulos

**Stack** (detalle y versiones en `docs/architecture.md §3`): React 19 · TypeScript · Vite. UI: Tailwind CSS 4 + shadcn/Radix, `lucide-react`, `framer-motion`, `sonner`. Datos de servidor: `@tanstack/react-query` + `axios`. Estado de cliente: Zustand. Formularios: `react-hook-form` + `zod`. Routing: `react-router-dom` v7 con guards centrales `RequireAuth`/`RequireGuest` (roles `ADMIN`/`USER`; sin `roles` = cualquier autenticado). Gestor: pnpm.

> **Estado actual (objetivo, aún no adoptado):** `@base-ui/react` (§4.1), `recharts` (gráficas) y el
> par realtime `@stomp/stompjs`/`sockjs-client` (`docs/vision.md §7`) figuran en el stack **cerrado**
> (`docs/architecture.md §3`) pero **no están instalados todavía**: se agregan la primera vez que una
> capacidad los necesite de verdad, no antes. Mismo criterio para `framer-motion` (§4.2).

**Estructura** (`modules/frontend/src/`):

```
src/
  layouts/     # marcos de página (shells) reutilizables
  screens/     # pantallas: orquestan una feature dentro de un layout (hojas de composición)
  modules/     # lógica encapsulada por dominio
    core/      # transversal (SIN deps a otros módulos):
      #   auth/ (guards RequireAuth/RequireGuest, roleHome) · components/ (DataState, InfoCard…)
      #   config/ (httpClient axios) · hooks/ (useDebouncedValue…) · services/generated/ (orval)
      #   ui/ (shadcn) · utils/
    <cap>/     # un módulo por capacidad (hooks de dominio, components, types, schemas Zod)
  store/       # stores Zustand (estado de cliente)
  routes/      # definición de rutas + guards (RequireAuth/RequireGuest)
  styles/      # globals.css y variables de tema
```

**Reglas de arquitectura:**
- **Un solo `AppLayout` autenticado, no un layout por rol.** ADMIN y USER son roles dentro de la
  **misma** empresa (mismo equipo, mismo shell), no personas con experiencias distintas — ADMIN es
  un superset de USER. El shell (sidebar + header) es único; cuando haga falta, la navegación se
  filtra por rol dentro de él, igual que ya filtran por rol las rutas (`RequireAuth roles={...}`).
  Separar en `AdminLayout`/`UserLayout` solo se justifica si el admin se vuelve una experiencia
  realmente distinta — adelantarlo sería la abstracción prematura que `docs/coding-style.md §3` prohíbe.
  > **Estado actual:** `RootLayout` (bootstrap de sesión) envuelve todo; las rutas privadas van
  > dentro de `AppLayout` (sidebar + header, capacidad `app-shell`), una sección por subárbol.
  > Cómo añadir una sección y restringirla por rol: §1.1.
- **`screens` orquestan; `modules` encapsulan lógica.** Las pantallas montan features dentro de un layout; no contienen lógica de negocio.
  > [!IMPORTANT]
  > **Una pantalla es una línea.** `screens/<área>/XScreen.tsx` → `return <XFeature />;`. **NO declares sub-componentes dentro de la screen** —ni skeletons, ni estados vacíos/error, ni campos de formulario, ni filas—: van a `modules/<cap>/components/`, agrupados por tipo (la feature, filas, loaders/skeletons, estados, modales). Señal de mal uso: una screen con `function SkeletonRows()` o `function Field()` debajo.
  > ```tsx
  > // ✅ screens/customers/CustomerListScreen.tsx
  > export function CustomerListScreen() { return <CustomerList />; }
  > // ❌ una screen con su tabla, su skeleton y su estado vacío declarados dentro
  > ```
- **Un archivo = un componente.** La regla de arriba **no es solo para las screens**: un componente de módulo tampoco declara otros dentro. **Skeletons, estados (vacío/error/no encontrado), filas, modales y campos van SIEMPRE a su propio archivo**, aunque solo los use un sitio. Los helpers de presentación, a su `xDisplay.ts`.
  > ✅ **Lo impide la build, no la disciplina.** `react/no-multi-comp` (ESLint) está activa en `src/screens/**` y `src/modules/*/components/**`: **un archivo con dos componentes no compila**. Es el equivalente frontend del *tripwire* de ArchUnit del backend — esta regla ya estaba escrita y se incumplió tres veces, así que dejó de ser un consejo. `core/ui` está **exento** a propósito (la excepción de la familia de primitivos, abajo).
  > [!IMPORTANT]
  > Señal de mal uso: `CustomerDetail.tsx` con `function CustomerDetailSkeleton()` debajo. **Un skeleton nunca vive dentro del componente que reemplaza** — es una unidad independiente (se prueba y se reutiliza sola), y enterrarlo obliga a leer la feature entera para encontrarlo.
  > ```
  > ✅ CustomerDetail.tsx · CustomerDetailSkeleton.tsx · CustomerDetailStates.tsx · customerDisplay.ts
  > ❌ CustomerDetail.tsx con el skeleton, el "no encontrado" y dos helpers dentro
  > ```
  > **Única excepción:** una **familia de primitivos** de `core/ui` diseñada para usarse junta puede compartir archivo, siguiendo la convención de shadcn (`dialog.tsx` exporta `Dialog`, `DialogContent`, `DialogHeader`…). No es excusa para meter la feature y su skeleton en el mismo sitio.
- **`core` no depende de otros módulos** (es la base transversal: UI, auth guard, utils). Los demás módulos pueden depender de `core`.
  > [!IMPORTANT]
  > **Un componente genérico se crea EN `core`, no en el módulo.** Si **no conoce el dominio** (un `FormField`, un `SelectField`, un `InfoCard`, un `Badge` base) → `core/ui` (primitivo) o `core/components` (compuesto), y **genérico** (`<T extends FieldValues>` si aplica). Solo lo **específico del dominio** (p. ej. `CustomerStatusBadge`, que conoce el enum de estado del cliente) vive en `modules/<cap>/components/`, **componiéndose** sobre el primitivo de `core`. Pregunta de control: *"¿esto lo usaría otra capacidad?"* → sí = `core`.
- **La validación de formularios vive en el schema Zod del módulo** (`modules/<cap>/schemas/`), **nunca dentro del componente**: ahí van las reglas (incluidas las condicionales, con `superRefine`), en **paridad con el backend** (`docs/coding-style.md §7`). El componente de campo **solo pinta** el error —venga de Zod o del servidor (`applyServerFieldErrors`)—. El servidor es la autoridad.
  > [!IMPORTANT]
  > **`useForm({ mode: "onTouched" })` — avisa tarde, corrige pronto.** La primera validación es **al salir** del campo (no le grites "correo inválido" a quien lleva una letra escrita); pero una vez avisado, **revalida en cada tecla**, así el error **desaparece solo** en cuanto el valor pasa a ser válido.
  > **No uses `"onBlur"`**: obliga a salir del campo para descubrir que ya lo arreglaste — el mensaje se queda en pantalla mintiendo mientras corriges. Y **no uses `"onChange"`**: valida desde la primera tecla, así que te marca en rojo por no haber terminado de escribir.
- **Mapeo capacidad ↔ código**: cada capacidad de negocio `<cap>` se materializa en `modules/<cap>/` (hooks de dominio, components, schemas Zod) y sus pantallas en `screens/<área>/`. El **cliente API tipado se genera** en `core/services/generated/` (ver §2.3); lo transversal (guard, roles) en `modules/core/`.

---

### 1.1 Secciones y acceso por rol

**Una sola fuente de verdad: `modules/core/config/sections.ts`** (id, ruta y, opcionalmente, `roles`; sin `roles` = cualquier autenticado). De ahí derivan el menú y las rutas; los roles **no** se repiten en otro sitio. `Role` es el tipo generado del contrato (`UserResponseRole`): un rol mal escrito no compila.

Añadir una sección:
1. Declárala en `sections.ts` (`{ id: "invoices", path: PATHS.INVOICES, roles: ["ADMIN"] }`).
2. Su presentación (etiqueta, icono) en `core/components/shell/navItems.ts` (`{ sectionId, label, icon }`): el menú (barra y cajón móvil) solo la muestra a los roles permitidos (`navItemsFor(role)`).
3. Su subárbol en `routes/index.tsx` con `sectionRoute("invoices", [...hijos])`: la ruta **y todas sus subrutas** quedan bajo `RequireRole`. Un rol sin permiso ve "Acceso denegado" **dentro del shell** (`AccessDenied embedded`, enfocado); en una sección restringida, una subruta inexistente también da "Acceso denegado" (comodín `*` bajo el guard), así no se puede averiguar qué subrutas existen.

Una ruta restringida **que no es una sección del menú**: `<RequireRole roles={[...]} />` explícito como ruta de layout dentro de `AppLayout`.

> [!IMPORTANT]
> **Ocultar o bloquear en el frontend NO autoriza.** Es UX. Cada endpoint restringido lleva `@PreAuthorize` en el backend (y `OpenApiErrorsConfig` documenta su `403`). Además, una sección restringida **no debe pedir datos** a un rol sin permiso:
> - las queries viven en componentes **hijos** del guard (sin permiso no se montan);
> - un **loader** de React Router se ejecuta **antes** de montar el guard: si una sección lo usa, el loader comprueba `canAccess(sectionById(id), useSessionStore.getState().user.role)` y no carga nada sin permiso;
> - un **prefetch** (`queryClient.prefetchQuery`) hacia una sección restringida, solo si `canAccess`.

## 2. React Query y capa de API

Cómo interactuar con el backend y gestionar el **estado del servidor** con **TanStack Query (React Query)** y **Axios**.

### 2.1 Reglas generales del estado del servidor
- **Estado único**: todos los datos del backend pertenecen a React Query. **No** se duplican en Zustand.
- **Control de estados**: todo componente que consuma datos del servidor maneja explícitamente carga (`isLoading`/`isPending`), error (`error`/`isError`) y vacío (`empty`).

### 2.2 Convención de Query Keys
Cada dominio/módulo implementa una **factoría de Query Keys** en sus hooks:

```typescript
export const userKeys = {
  all: ["user"] as const,
  simpleProfile: () => [...userKeys.all, "simple-profile"] as const,
  fullProfile: () => [...userKeys.all, "full-profile"] as const,
};
```

- **Clave raíz (`all`)**: única por módulo, `["nombre-modulo"] as const`.
- **Subclaves**: funciones que extienden el array raíz por desestructuración (mantienen la jerarquía de cache).
- **Invalidación coherente**: `queryClient.invalidateQueries({ queryKey: userKeys.all })` refresca todas las subclaves.

> **Estado actual (objetivo, aún no adoptado):** si un módulo usa una **clave raíz inline** (`const PROFILE_KEY = ["profile", "me"] as const`) e invalida por ella, en vez de una factoría `xKeys`, es válido: mantiene la jerarquía. Adopta la factoría cuando un módulo tenga **varias** lecturas con parámetros y la invalidación por subclaves aporte de verdad.

### 2.3 Estructura de la capa de API (generada con orval)

La capa de API se divide en dos: orval genera los **tipos + funciones fetch tipadas** desde el contrato; los **hooks de TanStack Query se escriben a mano** (tu estilo) sobre esas funciones. **No** se escriben clientes axios a mano ni tipos a mano. Flujo:

```
Pantalla ──> hook de dominio (modules/<cap>/hooks, a mano) ──> fetcher generado (orval) ──> mutator axios (core) ──> API
```

- **Generado (core)**: `core/services/generated/` contiene los **tipos DTO** (en `generated/model/`) y las **funciones fetch tipadas**, un archivo **por capacidad** (`generated/<cap>.ts`, p. ej. `auth.ts` con `register`, `login`, `refresh`, `logout`), producidos por orval (`client: axios-functions`) desde `contracts/openapi.json`. Es código de máquina: **versionado pero no se edita a mano** (`pnpm generate:api`). Excluido de ESLint; se valida con `tsc`.
- **HTTP base / transporte (core, a mano)**: `core/config/httpClient.ts` — la instancia axios (`withCredentials`, inyección de `Bearer`, interceptor de refresh) que orval usa como *mutator*. Es **infraestructura de transporte**, no un service de dominio ni un util.
- **Hooks de dominio (módulo, a mano)**: `modules/<cap>/hooks/` — aquí vive **tu estilo**: `useQuery`/`useMutation` con query-key factory (§2.2), validación Zod en el boundary (§2.5), toasts e invalidación. El `queryFn`/`mutationFn` llama a la **función generada** (tipada), no a un axios a mano. Junto con `schemas/` (Zod de formularios), `components/` y `types/` propios.
- **Componentes limpios**: ninguna pantalla importa `axios` directamente; usan los hooks de dominio.
- **Contratos tipados**: tipos y llamadas HTTP salen del contrato (orval), **nunca se teclean a mano**. Ver `api-type-contracts` y `docs/coding-style.md §7` (paridad de validación).

### 2.4 Ejemplo (fetcher generado → hook a mano → pantalla)

```typescript
// modules/auth/hooks/useAuth.ts — hooks de dominio a mano (tu estilo), sobre los fetchers generados
import { useMutation } from "@tanstack/react-query";
import { toast } from "sonner";
import { login } from "@/modules/core/services/generated/auth";        // fetcher tipado (del contrato)
import type { LoginRequest } from "@/modules/core/services/generated/model";
import { useSessionStore } from "@/store/useSessionStore";
import { getUserFriendlyError } from "@/modules/core/utils/apiError";

export function useLogin() {
  const setSession = useSessionStore((s) => s.setSession);
  return useMutation({
    mutationFn: (data: LoginRequest) => login(data),                    // en vez de un AuthService a mano
    onSuccess: (auth) => setSession(auth.accessToken, auth.user),
    onError: (e) => toast.error(getUserFriendlyError(e)),
  });
}
```
```tsx
// uso en la pantalla
const { mutate: login, isPending } = useLogin();
// login({ email, password });
```

> Para lecturas (GET), el hook a mano usa `useQuery` con su **query key** (§2.2) y validación Zod en el `queryFn` (§2.5), llamando al fetcher generado.

### 2.5 Validación de respuestas en el *boundary* (Zod)
> [!IMPORTANT]
> El tipado TS es solo en compilación; la respuesta del backend es dinámica en runtime. Si el backend renombra/elimina un campo, el tipo "miente" y revienta en la UI. Por eso **validamos la respuesta con Zod en el `queryFn`** (donde los datos entran a la app).

- Define un **schema Zod** del DTO (en `schemas/`), validando **estrictamente lo que la UI consume** (`z.object` strippea claves desconocidas, no falla por ellas).
- En el `queryFn`, valida con `parseApiResponse` (`modules/core/utils/validateApiResponse.ts`): si el shape no calza, lanza error controlado → React Query lo expone como `isError`.

```typescript
queryFn: async () => {
  const data = await ContactsService.listContacts(params);
  parseApiResponse(contactsResponseSchema, data, "contacts.list");
  return data;
},
```
- **Solo en lecturas que la UI renderiza** (adopción incremental); **no sobre-valides el envelope** (metadata de paginación). A futuro, inferir tipos desde los schemas (`z.infer`) para una única fuente de verdad.

> **Estado actual (objetivo, aún no adoptado):** `modules/core/utils/validateApiResponse.ts` (`parseApiResponse`) **todavía no existe** y ningún hook valida la respuesta con Zod. Los hooks actuales confían en el tipo del contrato (que el `codegen-drift` mantiene sincronizado). Cuando se adopte, se crea primero el util y se aplica **incrementalmente** a las lecturas que la UI renderiza.

---

### 2.6 Errores de la API — tipados desde el contrato

**Nunca escribas a mano la forma de un error.** El backend responde RFC 9457 y el contrato lo documenta, así que orval genera los tipos (`ApiProblem`, `ValidationProblem`, `FieldError`). Si el backend cambia la forma del error, lo detecta el **typecheck** en vez de romperse en producción.

> Antes había literalmente un `interface ProblemDetailBody { detail?: string }` escrito a mano. Eso es lo que la capacidad `api-type-contracts` existe para impedir. Si te descubres declarando la forma de un error, **el contrato es el que está incompleto**: arréglalo allí.

En axios el cuerpo del error viaja en `AxiosError<T>`, así que se **parametriza con el tipo generado** (sigue siendo derivado del contrato). Todo pasa por `modules/core/utils/apiError.ts`:

| Helper | Para qué |
|---|---|
| `getUserFriendlyError(e)` | El `detail` del problema, redactado para el usuario → aviso genérico (toast) |
| `getFieldErrors(e)` | Los `errors[{field, message}]` del `400` de validación |
| `applyServerFieldErrors(e, setError)` | Los vuelca **sobre los campos** de react-hook-form |

**Errores de validación → junto al campo.** Un `400` del servidor trae el detalle por campo: se pinta **en el input**, igual que los de Zod. En la mutación:

```ts
mutation.mutate(values, {
  onError: (error) => applyServerFieldErrors(error, setError),
});
```

`errors` es **opcional**: el otro `400` posible (JSON malformado) no lo trae. Por eso `getFieldErrors` devuelve `[]` y la UI cae en el aviso genérico.

**Cuenta deshabilitada**: si el refresh responde `403` `/errors/account-disabled`, `refreshSession()` (`core/config/httpClient.ts`, single-flight compartido por el interceptor y el bootstrap) muestra **un** toast con su `detail` antes de rechazar; la sesión se cierra igual que con cualquier refresh fallido (`accountDisabledMessage` en `core/utils/apiError.ts`).

### 2.7 Ejemplo real: listado paginado + mutación (`modules/users`)

- **Keys** (`hooks/userKeys.ts`): `userKeys.all = ["users"]`, `userKeys.list({ page, size })` — la key incluye **todo** lo que cambia la respuesta.
- **Lectura** (`hooks/useUsers.ts`): `useQuery` sobre el `listUsers` generado con `placeholderData: keepPreviousData` → al cambiar de página la tabla anterior sigue visible (`isPlaceholderData` deshabilita los controles mientras llega la nueva).
- **Mutación** (`hooks/useChangeUserStatus.ts`): **sin** actualización optimista; `onSettled` invalida `userKeys.all` (la tabla muestra siempre el estado real, también tras un `409`/`404`), `onError` → `toast.error(getUserFriendlyError(e))`. La fila en curso queda deshabilitada (`mutation.variables.id`).
- **Estados**: carga, error con "Reintentar", vacío (y, si la página quedó vacía, "Volver a la página anterior"), tabla + paginación. Confirmación con `AlertDialog` (`core/ui`) antes de cambiar el estado.
- **Sección restringida**: `{ id: "users", path: "/usuarios", roles: ["ADMIN"] }` en `core/config/sections.ts` (§1.1); el backend la protege con `@PreAuthorize`.

---

## 3. Estado del cliente (Zustand)

### 3.1 Cuándo usar Zustand
Solo para **estado de cliente global**: filtros de tabla activos, ordenamiento, datos de sesión guardados localmente (evitar parpadeos), selecciones temporales en memoria.

**Cuándo NO**: no dupliques datos de API (eso es React Query); no guardes estado redundante que puedas derivar en render/`useMemo`.

### 3.2 Convención y estructura de stores
Todos en `src/store/`. Cada store: 1) interfaz `[Feature]State` (estado + acciones tipadas), 2) creación con `create`, 3) **exportación única envuelta en `createSelectors`** (`use[Feature]Store`).

```typescript
import { create } from "zustand";
import { createSelectors } from "./createSelectors";

interface SortingState {
  orderBy: "asc" | "desc";
  sortBy: string;
  setOrderBy: (order: "asc" | "desc") => void;
  setSortBy: (field: string) => void;
  resetSorting: () => void;
}

const useSortingStoreBase = create<SortingState>((set) => ({
  orderBy: "asc",
  sortBy: "createdAt",
  setOrderBy: (order) => set({ orderBy: order }),
  setSortBy: (field) => set({ sortBy: field }),
  resetSorting: () => set({ orderBy: "asc", sortBy: "createdAt" }),
}));

export const useSortingStore = createSelectors(useSortingStoreBase);
```

### 3.3 Rendimiento
> [!IMPORTANT]
> **Regla no negociable: nunca consumas el store completo, siempre por selector.** `const { a, b } = useStore()` suscribe a *cualquier* cambio y provoca renders innecesarios.

- **`createSelectors`** (`src/store/createSelectors.ts`): genera selectores atómicos `store.use.<campo>()`, forma recomendada de consumir.
  ```tsx
  const user = useUserStore.use.user();
  const setUser = useUserStore.use.setUser();
  ```
- **Selector explícito** cuando no uses el helper: `useSortingStore((s) => s.sortBy)`.
- **`useShallow`** (de `zustand/react/shallow`) para seleccionar varios campos en un objeto sin renders por referencia nueva.
- **Múltiples stores pequeños** enfocados en vez de uno monolítico.

### 3.4 Separación de responsabilidades
- **Un store = estado + acciones.** Sin lógica de negocio, sin valores derivados, sin estado de servidor.
- **Preferir el middleware `persist`** (de `zustand/middleware`) sobre `localStorage` manual: declarativo, hidrata al iniciar, centraliza errores de serialización.
- **La orquestación vive en hooks**, no en componentes (patrón "componente tonto + hook inteligente").

---

## 4. Patrones de UI, animación, responsividad y accesibilidad

> **Superficie nueva sin patrón previo** (ej. una futura landing pública, o un rediseño deliberado
> de marca): antes de picar código, dirección creativa
> con el skill `frontend-design` — anclada en la identidad ya existente (gradiente + logo), no una
> reinvención desde cero. **Pantalla dentro del producto ya autenticado**: no se usa; se sigue el
> sistema de diseño de esta sección (§4.1–§4.6) y `coding-style.md §5.5` ("consistencia > preferencia
> personal").

### 4.1 shadcn/ui e integración
> [!IMPORTANT]
> **Antes de crear un componente visual o añadir una librería**, revisa si ya existe en `modules/core/ui/`. Reutilizar garantiza temas (claro/oscuro), overrides de marca, estilos consistentes (bordes, sombras, transiciones, accesibilidad) y evita duplicación y bundle innecesario.

> [!IMPORTANT]
> **Nunca uses el atributo nativo `title`** en un elemento interactivo: usa el `Tooltip` de `core/ui` (`Tooltip` + `TooltipTrigger asChild` + `TooltipContent`). Mantén siempre `aria-label` (el tooltip no lo sustituye). Si el tooltip repite exactamente el nombre accesible, hazlo **solo visual** pasando `aria-describedby={undefined}` al hijo del trigger (si no, el lector de pantalla lo anuncia dos veces). Ejemplo real: `core/components/shell/NavItem.tsx`.
> `TooltipProvider` está montado **una vez** en `layouts/RootLayout.tsx` (y en `renderWithProviders` de los tests); no lo repitas por componente.

**Estado actual de `modules/core/ui/`** (lo que HAY hoy): `button` (+ `button-variants`), `card`, `input`, `icon-input`, `password-input`, `label`, `logo`, `theme-toggle`, `tooltip`, `table`, `badge` (+ `badge-variants`), `alert-dialog`, `accordion`, `sheet` (panel lateral; botón de cierre traducido a "Cerrar") y `progress` (shadcn, Radix; animación de `tw-animate-css`), más `number-input` (propio: número con botones subir/bajar del tema en lugar de las flechas nativas, que no siguen el modo oscuro; úsalo para todo campo numérico). Ayudas de campo: `core/components/form/FieldHint` (visible, con ícono, enlazada al control con `aria-describedby` vía `describedBy`); no uses tooltip para información que el usuario necesita leer. Bloques plegables de un formulario: `core/components/AccordionSection` dentro del `Accordion` de `core/ui` (tarjeta con número, título, descripción y estado —`core/components/SectionStatus`—; margen interno para no recortar el anillo de foco). Si el estado depende de valores del formulario, que lo calcule un componente pequeño que vigile solo su parte (`useWatch`), no el paso entero. Valores calculados dentro de un formulario: `core/components/form/ComputedValue` (caja con el aspecto de un campo, bloqueada). Responsive: tablas anchas dentro de `core/components/ScrollableX` (degradado que indica contenido oculto; primera columna `sticky left-0` con fondo; `min-w-0` en el `fieldset` que la contenga); contenido de ancho fijo (hojas A4) en `core/components/ScaleToFit`; listados que en celular/tablet pasan a tarjetas con `core/hooks/useMediaQuery` (una sola vista en el DOM, nunca las dos ocultas con CSS). Shell: la barra lateral se contrae a solo íconos en escritorio con la preferencia global de `store/useSidebarStore` (Zustand + `persist`; ninguna pantalla la cambia por su cuenta); los ítems usan `iconOnly` (`"below-lg"` en tablet, `"always"` contraída) el marco de la app (`data-app-frame`: barra + cabecera + contenido) mide como máximo 1920 px y va centrado, y dentro el contenido de `<main>` y de la cabecera mide como máximo 1536 px (`max-w-screen-2xl`). Nota: nuestro `Button` **no** admite `asChild`; `alert-dialog` aplica `buttonVariants` directamente a los botones del primitivo.

**Por incorporar** (aún NO existen; añádelos con `pnpm dlx shadcn@latest add <componente>` desde `modules/frontend/`, la **primera vez que una pantalla los necesite**): `form-field`, `dialog`, `popover`, `dropdown-menu`, `select`.

> **Primitivos headless**: Radix vía el paquete unificado `radix-ui` (estilo `new-york`). `@base-ui/react` solo si Radix no cubre un caso.

> [!WARNING]
> **`modules/frontend/components.json` ya existe (escrito a mano) — nunca dejes que el CLI haga `init`.** Un `init` reescribiría `src/styles/globals.css` con sus defaults, y ahí viven los **tokens de marca** y los marcadores `@template:brand` (§4.5): los romperías. Con Tailwind v4 el campo `tailwind.config` va **vacío** y `tailwind.css` apunta a `src/styles/globals.css`.
> Los `paths` del alias están **duplicados en el `tsconfig.json` de `modules/frontend` solo para el tooling**: es un tsconfig *solution* (`files: []`) y sin ellos el CLI no resuelve `@/` y escribe los componentes en una carpeta **literal `@/`**.
> **Tras cada `add`, revisa `git diff`:**
> 1. `globals.css` intacto (el CLI puede intentar añadir sus tokens o su `@theme`; los nuestros ya están);
> 2. no existe `modules/frontend/@/`;
> 3. ⚠️ **el CLI genera `import { cn } from "cn"` e instala el paquete npm `cn`** (ajeno al proyecto): cambia el import a `@/modules/core/utils/cn` y ejecuta `pnpm remove cn`. Lo vigila `core/ui/shadcn-imports.test.ts`.

> Regla: un componente **genérico y reutilizable** (un `Badge` base, una `Table`) vive en `core/ui`, no en `modules/<cap>/`. Lo específico de un dominio (p. ej. `CustomerStatusBadge`, que conoce el enum de estado del cliente) sí vive en `modules/<cap>/components/`, y puede componerse sobre el primitivo de `core/ui`.

### 4.2 Animación (Framer Motion)
> **Aún no instalado.** Para transiciones simples que no involucran entrar/salir del árbol (hover,
> color, spinners) se prefiere **CSS de Tailwind** (`transition-colors`, `animate-pulse`,
> `hover:`/`focus:`) — más barato, sin JS. `framer-motion` entra la primera vez que haga falta animar
> entrada/salida del árbol o layout, no antes.

> [!IMPORTANT]
> **Al instalarlo, envuelve toda la app con `<MotionConfig reducedMotion="user">`** (`layouts/RootLayout.tsx`):
> respeta `prefers-reduced-motion` del SO para **cualquier** `motion.*`/`AnimatePresence` sin que cada
> componente tenga que pensar en ello. No dupliques ese chequeo por componente.

- **`<AnimatePresence>`** para componentes que entran/salen del árbol (diálogos, menús colapsables,
  filas de una lista que se filtra — `initial={false}` para no animar la carga inicial, solo
  altas/bajas posteriores).
- **`layout`/`layoutId`** para transiciones fluidas de posición/tamaño (ej. píldora de pestaña activa,
  o el reflow de una lista cuando una fila entra/sale — `layout="position"` en la fila).
- **Solo `transform`/`opacity`** (nunca `width`/`height`/`top`/`left`: repintan caro). En framer-motion,
  anima `x`/`y`/`scale`/`opacity`, no propiedades de layout CSS crudas.
- **Micro-interacciones rápidas** (0.2s–0.3s); prefiere `spring` (con `stiffness`/`damping`) sobre curvas lineales.
- **Respeta el estado colapsado**: oculta ancho/opacidad para evitar desbordes de texto.
- **Con moderación**: 1-2 elementos animados por vista como regla general; una lista que anima sus
  propias entradas/salidas al cambiar es un único movimiento coherente, no "animar todo".

### 4.3 Responsividad (Mobile-First)
- Breakpoints: **móvil** < `480px`, **tablet** `481–1024px`, **escritorio** > `1024px`.
- Prueba cambios de navegación/estilos en móvil, tablet y escritorio.

> **Sidebar del `AppLayout` (§1)** — construida (`app-shell`): cajón flotante en móvil (< `sm`),
> barra de iconos en tablet (`sm`–`lg`), expandida en escritorio (> `lg`). Usa los breakpoints por
> defecto de Tailwind (640/1024), no los 480 de arriba.

### 4.4 Accesibilidad (WCAG)
- **HTML semántico** (`<aside>`, `<nav>`, `<main>`, `<header>`, `<article>`).
- **Navegación por teclado**: todo interactivo accesible con `Tab` y activable con `Enter`/`Espacio`.
- **Formularios**: cada `input` con su `label` enlazado (`htmlFor`/`id`).
- **ARIA**: `aria-label` en botones solo-icono; `aria-describedby` para textos/errores.

### 4.5 Paleta y variables de estilo (Tailwind v4 + CSS vars)
**Tailwind CSS 4, configuración CSS-first**: no hay `tailwind.config.*` ni PostCSS (plugin `@tailwindcss/vite`). Todo el tema vive en `src/styles/globals.css`:

```css
@import "tailwindcss";
@import "tw-animate-css";
@custom-variant dark (&:where(.dark, .dark *));   /* modo oscuro por clase `dark` en <html> */

@theme inline {
  --color-primary: var(--primary);               /* token → utilidad bg-primary, text-primary… */
  /* … */
}

:root { --primary: hsl(292 72% 36%); /* … */ }   /* claro */
.dark { --primary: hsl(292 65% 66%); /* … */ }   /* oscuro */
```

- **Cada token es un color completo** (`hsl(...)`, u `oklch(...)` si algún día se migra): es el formato que emite shadcn v4, así los componentes y temas del registro encajan sin adaptar. Los modificadores de opacidad (`bg-primary/10`) funcionan solos (`color-mix()`).
- **`@theme inline`** (no `@theme`): la utilidad referencia `var(--primary)` directamente, así el cambio `:root` ↔ `.dark` aplica en runtime.
- **Token nuevo** = definirlo en `:root` **y** en `.dark` + mapearlo en `@theme inline` (`--color-<nombre>: var(--<nombre>)`). Lo vigila `src/styles/theme.test.ts`.
- Tokens de marca además de los semánticos: `brand-start`/`brand-end` (gradiente de marca, `bg-linear-to-r from-brand-start to-brand-end`).

> **Marca de la empresa = tokens de `globals.css`.** En esta plantilla (single-tenant) la marca se fija editando `--primary`, `--secondary`, `--accent`, `--brand-*`… en `globals.css` (claro y `.dark`). **Nunca** escribas un color literal (hex, `rgb()`, `hsl()`, ni `bg-[hsl(...)]`) en un componente o hook: usa siempre los tokens. Lo impone `src/styles/no-literal-colors.test.ts`.
> La tematización **por organización** en runtime (branding) es de la plantilla multi-tenant planificada: ver `docs/future/multi-tenant-template.md §3`.

### 4.6 Composición: patrón "Slots" / "Children"
Cuando un componente impone **estructura** pero el **contenido** lo decide quien lo consume, compón el contenido como `children` o *slots* nombrados (`ReactNode`), no como datos en props. De mayor a menor preferencia:

1. **`children`** (slot por defecto) — el más común y legible. El padre define el marco, el hijo va dentro.
2. **Slots nombrados** (`title`, `actions`, `children`…) — cuando hay varias zonas estructurales.
3. **Compound components** (`<Tabs><Tabs.Tab/></Tabs>`) — solo cuando aporta legibilidad real frente a slots.

**SÍ** usar slots/children cuando el componente es **reutilizable** y solo aporta estructura/estilo/animación (layouts, cards, modales, page shells) y el contenido es JSX estático conocido por quien escribe el JSX.

> [!IMPORTANT]
> **NO** uses slots/children cuando el componente debe **decidir cuál de varios elementos renderizar** a partir de **datos dinámicos** o necesita metadatos por elemento (clave, etiqueta, icono, permisos): usa un API de **lista de configuración** (`items: Option[]`) o *render prop*. Ej.: un contenedor multivista recibe `views: ViewOption[]` cuando la pantalla las genera dinámicamente con `.map()`.

**Reglas:** estructura en el padre, contenido en el consumidor; no envuelvas JSX en props de datos sin necesidad; no introduzcas compound components hasta tener 2–3 casos reales (ver `docs/coding-style.md`); mantén roles/ARIA en el componente estructural, no en el contenido inyectado.

> [!NOTE]
> Las **pantallas** (`screens/**`) son hojas de composición: montan una feature en un layout. **No** son lugar para slots/children — el patrón rinde en componentes **reutilizables** de `core`. Señal de mal uso: envolver una **única** vista en un contenedor multivista con `onViewChange={() => {}}` (no-op).
