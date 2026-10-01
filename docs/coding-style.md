# Estilo de código (Coding Style)

> Guía de **estilo general** del frontend (`modules/frontend/`): TypeScript, convenciones de nombres, legibilidad y calidad. Complementa a `docs/frontend.md` (arquitectura, React Query, Zustand, patrones de UI), `docs/architecture.md` (stack) y `docs/testing.md` (pruebas); no duplica su contenido, solo los referencia cuando aplica.

Este documento define las convenciones de escritura de código, tipado y calidad que deben seguirse en el desarrollo de la aplicación.

---

## 1. Convenciones de Nombres

### Archivos y Directorios
* **Componentes de React y Layouts**: Usan `PascalCase` tanto en los directorios como en los nombres de archivos.
  * *Ejemplo*: `modules/frontend/src/modules/core/components/Sidebar.tsx`, `modules/frontend/src/layouts/UserLayout.tsx`.
* **Hooks Personalizados**: Usan `camelCase` con el prefijo `use`.
  * *Ejemplo*: `modules/frontend/src/modules/users/hooks/useUserProfile.ts`.
* **Servicios e Integraciones API**: Usan `camelCase` y el archivo representa la entidad en singular.
  * *Ejemplo*: `modules/frontend/src/modules/users/services/user.ts`.
* **Utilidades e Interfaces Auxiliares**: Usan `camelCase`.
  * *Ejemplo*: `modules/frontend/src/modules/core/utils/cn.ts`.

### Clases y Métodos
* Las funciones de ayuda, métodos de clases y variables usan `camelCase` (ej. `getUserProfile()`, `handleLogout()`).

### Constantes y Enums
* Las constantes globales, configuraciones estáticas u objetos que simulan Enums se prefijan con un signo de dólar `$` y se escriben en `PascalCase` o `UPPERCASE` dependiendo de su naturaleza:
  * *Ejemplo*: `$UserRole`, `$OrderBy`, `$CookieKey`.

### Types e Interfaces
* Usan `PascalCase`.
  * *Ejemplo*: `interface UserPreview`, `type UserRole`.

---

## 2. Reglas de TypeScript

El proyecto tiene configurado el modo estricto (`strict: true`). Se deben seguir los siguientes lineamientos:

### Evitar el uso de `any`
* Está estrictamente prohibido usar `any`.
* Si un tipo es realmente desconocido o dinámico, utiliza `unknown` y realiza un estrechamiento de tipo (type narrowing) mediante type guards o validación dinámica (ej. con Zod).
* Utiliza genéricos (`<T>`) para crear funciones y componentes altamente reutilizables y tipados de forma flexible.

### Declaraciones de Tipos
* **Interfaces**: Se utilizan para definir contratos de API y estructuras de datos estables que pueden ser extendidas.
* **Types**: Se reservan para uniones (unions), tipos mapeados (mapped types) y tipos de utilidad (utility types).
  ```typescript
  // Preferido para uniones de literales
  type UserRole = "ADMIN" | "USER";

  // Preferido para contratos de datos de la API
  interface UserProfile {
    id: number;
    username: string;
    email: string;
    role: string;
  }
  ```

---

## 3. Generación de Código y Calidad

Al escribir nuevas funcionalidades, respeta las siguientes reglas de calidad:

1. **Mantener los cambios al mínimo**: No toques archivos que no tengan relación directa con la funcionalidad que estás implementando.
2. **Eliminación de código muerto**: Remueve inmediatamente las importaciones no utilizadas, variables declaradas pero no leídas y código comentado redundante. Mantener el compilador libre de warnings evita warnings del linter en CI/CD.
3. **Evitar abstracciones prematuras**: No crees hooks o utilidades complejas antes de tener al menos 2 o 3 casos de uso reales que lo requieran.
4. **Comentarios e Integridad**: Conserva los comentarios y docstrings existentes en el código si no están relacionados con tus cambios.

---

## 4. Hooks y Separación de Lógica

> [!IMPORTANT]
> **Principio rector: "componente tonto + hook inteligente".** Los componentes
> deben ser principalmente declarativos (layout + render); la lógica (estado,
> datos, handlers) vive en hooks. Un componente de pantalla debería **consumir**
> hooks, no concentrar lógica. Por ejemplo, un componente de gestión debería
> delegar toda su lógica en un hook orquestador (`useX`) del módulo correspondiente.

### Qué hook usar según el caso

| Necesidad | Qué usar |
| --- | --- |
| Estado local de UI | `useState` (o `useReducer` si hay muchas transiciones relacionadas) |
| Valor calculado a partir de otros | `useMemo` / variable derivada — **nunca** un `useState` que se sincroniza a mano |
| Sincronizar con un sistema externo (socket, listener, DOM) | `useEffect` (con moderación) |
| Datos del backend (leer/escribir) | React Query en un hook de feature (`useQuery`/`useMutation`), colocado en la carpeta `hooks/` del módulo |
| Estado de cliente compartido entre módulos | Zustand (`useXStore`), definido en `modules/frontend/src/store/` |
| Concern global (idioma, tema) | hook de contexto (`useT`, `useTheme`) |
| Lógica reutilizable por varios componentes | custom hook utilitario (`useMediaQuery`, `useDebouncedCallback`) |
| Toda la lógica de una pantalla | custom hook "orquestador" (p. ej. `useChat`) que devuelve una API limpia |

### Reglas

1. **Estado de servidor en React Query, no en `useState`/Zustand.** Lo que vive en
   el backend se obtiene y cachea con `useQuery`/`useMutation`; no se duplica en estado local.
2. **Deriva en vez de almacenar.** Si un valor se puede calcular de otros (props,
   estado, datos de query), úsa `useMemo` o una variable derivada; no lo guardes en `useState`.
3. **`useEffect` solo para sincronizar con sistemas externos** (suscripciones,
   DOM, APIs del navegador). Prohibido usarlo para "copiar" props a estado o para
   derivar valores. No llames `setState` síncrono dentro de un efecto: ajústalo
   durante el render o deriva el valor.
4. **Extrae lógica a custom hooks** cuando se repite en varios componentes o cuando
   una pantalla acumula demasiada lógica. Respeta la regla de abstracción: no crees
   el hook genérico hasta tener 2–3 casos reales (ver sección 3).
5. **Un hook = una responsabilidad.** Si un hook orquestador crece demasiado,
   divídelo en hooks de feature más pequeños y composables.
6. **Nombra los custom hooks con prefijo `use`** y colócalos en la carpeta `hooks/`
   del módulo correspondiente (bajo `modules/frontend/src/modules/[dominio]/hooks/`).

---

## 5. Principios de Legibilidad y Escalabilidad

> [!IMPORTANT]
> El objetivo es que **otra persona entienda el código sin que se lo expliquen**.
> Prioriza la claridad y la consistencia por encima de la preferencia personal.

Estas reglas complementan la sección 4 (que cubre el "componente declarativo + hook
inteligente" y la disciplina de estado). Aplícalas con criterio, no como dogma.

1. **Una responsabilidad por unidad.** Un componente que supera ~150 líneas o un
   hook que hace varias cosas a la vez debe dividirse. Cada función/componente/hook
   debe poder describirse en una sola frase. (Ver "un hook = una responsabilidad", §4.)
2. **Early returns en vez de anidación profunda.** Resuelve los casos borde primero
   (`if (!data) return <Empty />`) y deja el camino feliz sin indentar. Evita
   `if/else` anidados de más de 2 niveles.
3. **Nombres que revelan intención.** `isUpdating`, `handleToggleBot`,
   `filteredTags` — no `data2`, `tmp`, `flag`. El nombre debe decir *qué es* o
   *qué hace*, no requerir leer la implementación.
4. **Comentarios del "por qué", no del "qué".** El código ya dice qué hace; el
   comentario explica la decisión no obvia (un workaround, una restricción del
   backend, un orden que importa). No comentes lo evidente. (Comentarios en español.)
5. **Consistencia > preferencia personal.** Sigue el patrón del archivo/módulo
   vecino aunque no sea tu estilo favorito. La uniformidad es lo que más ayuda a
   que el equipo lea el código rápido.
6. **Cubre los estados async: loading / error / empty / con datos.** Toda vista que
   consume datos asíncronos contempla los cuatro. Reutiliza el componente de estado
   de datos del proyecto (`DataState`, bajo `modules/frontend/src/modules/core/components/`)
   en vez de improvisar cada caso.
7. **Props mínimas y tipadas; evita el prop-drilling.** Pasa solo lo que el
   componente necesita. Si una prop baja 3+ niveles, prefiere composición
   (children/slots, patrón de composición de UI) o un contexto.

### Sobre "código muy imperativo"
Imperativo = describir *cómo* paso a paso; declarativo = describir *qué* se quiere y
dejar que React lo resuelva. En la práctica, lo que importa de verdad es:
* **Deriva** el estado en el render en vez de sincronizarlo a mano con `useEffect` + `setState` (§4).
* **Extrae** la lógica a hooks; el componente solo declara su UI.
* Usa `.map`/`.filter`/`.reduce` para transformar datos en vez de `for` + `push` (esto último es estilístico, menor).

No persigas "cero imperatividad": los *event handlers* son imperativos por
naturaleza y a veces un bloque imperativo es más claro. El foco es **render
declarativo + estado derivado**, no eliminar toda instrucción imperativa.

---

## 6. Checklist de Revisión (Pre-entrega)

Antes de dar por concluida cualquier tarea de desarrollo, verifica:
- [ ] No existen warnings ni errores de TypeScript en la compilación local (`pnpm tsc -b`).
- [ ] El linter no genera advertencias críticas sobre el código modificado (`pnpm lint`).
- [ ] Se han eliminado todos los `console.log` de depuración temporal (a excepción de logs informativos en interceptores HTTP).
- [ ] No se han introducido importaciones redundantes o no usadas.
- [ ] Los tests pasan (`pnpm test`) y se añadió/actualizó prueba para los flujos críticos tocados.
- [ ] Los schemas Zod de los formularios **reflejan** las restricciones de formato del DTO backend (ver §7).

---

## 7. Validación de formularios y paridad con backend (Zod ↔ Bean Validation)

El frontend valida con **Zod** (formularios, `react-hook-form`) y el backend con **Bean Validation**
sobre los DTOs `*Request`. Son **dos capas del mismo contrato**, no validaciones independientes.

**Política:**
- **El backend es la barrera de seguridad definitiva**: nunca confíes en el cliente; todo `*Request`
  se valida con Bean Validation. El frontend es **UX** (feedback inmediato, evitar viajes al servidor).
- **El frontend valida el formato al menos tan estricto como el backend.** Si el backend rechaza algo,
  el schema Zod debe haberlo rechazado antes: recibir un `400` por una regla de **formato** que el
  frontend pudo comprobar es un bug (degrada la experiencia).
- **Validación de formato** se duplica a propósito en ambos lados y debe mantenerse en paridad
  (misma longitud, mismo patrón, mismo rango). **Reglas de negocio** (unicidad de email, disponibilidad
  de una cita, etc.) viven **solo en el backend**; el frontend las descubre por la respuesta de error,
  no las reimplementa.
- Si una divergencia es **intencional** (p. ej. el frontend es más estricto por UX), documéntala con
  un comentario junto al schema.

**Tabla de correlación** (formato):

| Zod (frontend) | Bean Validation (backend) | Nota |
|---|---|---|
| campo requerido (sin `.optional()`) | `@NotNull` | presencia |
| `.min(1)` / `.trim().min(1)` en string | `@NotBlank` | requerido no vacío |
| `.min(n)` / `.max(n)` (longitud de string) | `@Size(min = n, max = n)` | longitud |
| `.email()` | `@Email` | formato email |
| `.regex(re)` | `@Pattern(regexp = re)` | **misma** expresión regular |
| `.positive()` / `.int().positive()` | `@Positive` | número > 0 |
| `.min(n)` / `.max(n)` (número) | `@Min(n)` / `@Max(n)` (o `@DecimalMin/@DecimalMax`) | rango numérico |
| `.datetime()` + fecha futura | `@Future` / `@FutureOrPresent` | fechas |

**Ejemplo (mismo contrato en ambos lados):**

```ts
// frontend — schema Zod (react-hook-form)
const createAppointmentSchema = z.object({
  patientId: z.number().int().positive(),                 // @NotNull (id válido)
  scheduledAt: z.string().datetime().refine(isFuture),    // @NotNull @Future
  notes: z.string().max(500).optional(),                  // @Size(max = 500)
});
```
```java
// backend — DTO con Bean Validation (ver docs/backend.md §6)
public record CreateAppointmentRequest(
    @NotNull Long patientId,
    @NotNull @Future LocalDateTime scheduledAt,
    @Size(max = 500) String notes
) {}
```

**Fuente de verdad (objetivo):** cuando esté el pipeline **OpenAPI → TS** (springdoc + orval), springdoc
emite las restricciones de Bean Validation en el schema OpenAPI (`maxLength`, `pattern`, `minimum`…),
dejando el **backend como fuente de verdad** de los límites. En ese punto se evaluará **generar los
schemas Zod desde el OpenAPI** para eliminar el drift manual; hasta entonces, la paridad se mantiene
a mano según esta tabla.

---

## 8. Testing

El detalle de la estrategia, matrices de decisión, utilidades (`renderWithProviders`,
MSW) y convenciones de pruebas del frontend vive en `docs/testing.md` (guía de pruebas
del monorepo). Como recordatorio operativo:

- Stack frontend: **Vitest** + **React Testing Library** + **MSW** (config en
  `modules/frontend/vitest.config.ts`; setup en `modules/frontend/src/test/setup.ts`).
- **Ubicación**: el test vive junto al archivo que prueba, como `nombre.test.ts(x)`.
- **Qué priorizar**: lógica (hooks, stores, transformaciones) y flujos de
  **integración**; prueba **comportamiento observable**, no detalles de implementación.
- Comandos: `pnpm test` (una vez, CI) · `pnpm test:watch` (desarrollo).

Consulta `docs/testing.md` para el resto (niveles, MSW, E2E, cobertura y checklist por capacidad).
