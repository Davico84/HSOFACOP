# Plantilla multi-tenant — reglas planificadas (NO aplican a esta plantilla)

> **Estado: planificado.** Esta plantilla es **single-tenant** (una sola empresa): no hay organizaciones, `organization_id`, RLS ni branding por organización. Este documento **conserva** las reglas y lecciones de una implementación multi-tenant previa, para construir en el futuro una **segunda plantilla multi-tenant básica** sin redescubrirlas.
>
> Cuando se construya, estas secciones vuelven a `docs/backend.md`, `docs/testing.md` y `docs/frontend.md`, y cada pieza nace como change de OpenSpec (`add-multi-tenancy`, `add-organization-branding`). Los nombres de clase citados (`TenantAwareTransactionManager`, `OrganizationContext`…) son los de esa implementación de referencia: **no existen en este código**.

---

## 1. Backend — aislamiento en dos capas (aplicación + RLS)

Cada organización (tenant) queda aislada en dos capas: la aplicación, con Hibernate `@TenantId`, y el motor, con Row-Level Security de PostgreSQL. **No negociable** en toda capacidad de negocio:

- **Toda `@Entity` de negocio** (pertenece a una organización) lleva:
  1. Columna `organization_id BIGINT NOT NULL` + campo `@TenantId` en la entidad (Hibernate la rellena y filtra sola).
  2. **Índice** sobre `organization_id`. Sin él, RLS filtra con un *seq scan*: el índice es parte de la política de aislamiento, no una optimización posterior.
  3. En su migración: `ENABLE` + **`FORCE ROW LEVEL SECURITY`** y la política
     `CREATE POLICY organization_isolation ON <tabla> USING (organization_id = current_setting('app.organization_id')::bigint);`
     **sin `missing_ok`** (fallo ruidoso ante una consulta sin contexto).
- **Acceso siempre transaccional**: toda operación sobre una entidad bajo RLS va en `@Transactional` (o `readOnly = true`). Las variables de sesión (`set_config(..., true)`) son *transaction-local*: fuera de transacción el contexto se pierde y RLS bloquea. **Enforced por ArchUnit**.
- **El tenant se lee SOLO del token firmado** (`OrganizationContext`/`IdentityContext`, poblados por `JwtAuthenticationFilter` desde los claims). **Prohibido** derivar `organizationId`/`userId` de `@RequestHeader`, `@PathVariable` o `@RequestBody`.
- **Nada de `nativeQuery` sin filtro de organización** (aunque RLS lo cubra: la claridad importa).
- **Hilos async**: `@Async`/`@Scheduled` NO heredan el contexto (`ThreadLocal`). Antes del primero, cablear un `TaskDecorator` (async derivado de una petición) o fijar el contexto explícitamente por tenant (jobs de fondo). Un test ArchUnit falla la build si aparece `@Async`/`@Scheduled` sin ese cableado.
- **Colección embebida de una entidad bajo RLS → columna `JSONB` en la misma tabla, no tabla hija.** Una tabla hija sin su propio `organization_id` es un agujero de aislamiento.
- **Dominio de auth** (`users`, `refresh_tokens`): sin RLS por organización (se consultan por credencial). `memberships` lleva RLS de **identidad** (`user_id = current_setting('app.user_id')`).

### 1.1 El contexto se fija solo: qué NO hay que escribir

Un `TenantAwareTransactionManager` fija el contexto de tenant en **toda** transacción, leyendo `IdentityContext`/`OrganizationContext`. Si la entidad cumple la lista de arriba, la capacidad **ya está aislada**.

> **Por defecto, no por disciplina.** Un mecanismo que exige acordarse de una llamada acabará olvidándose, y ese olvido no falla de forma visible: **filtra datos entre organizaciones**.

```java
@Service
public class CustomerService {
    private final TenantSession tenantSession;          // ❌ la build falla

    @Transactional
    public List<Customer> findAll() {
        tenantSession.bind(userId, organizationId);     // ❌ ya está hecho
        ...
    }
}
```

- **Una regla de ArchUnit rompe la build** si una clase de `service` (salvo `service.auth`) o de `presentation` depende de `TenantSession`. Hay que comprobar que la regla **falla de verdad** al violarla.
- **"unrecognized configuration parameter app.organization_id"** no se arregla fijando el contexto a mano: significa que el código está fuera de una petición autenticada o fuera de transacción. RLS **falla cerrado** en vez de devolver una lista vacía que se confundiría con "no hay datos".
- **Única excepción: `service.auth`.** En el registro, la organización se crea en esa misma transacción y no hay token del que leer el contexto; ahí `bindIdentity(...)` se llama explícitamente.

### 1.2 Auditoría de autoría (`createdBy`/`updatedBy`)

RLS dice **qué organización** tocó un registro, no **qué usuario**. En multi-tenant, `@CreatedBy`/`@LastModifiedBy` con un `AuditorAware<Long>` que lee `IdentityContext` (ya disponible por transacción gracias al `TenantAwareTransactionManager`). En `service.auth`, durante el registro, el `AuditorAware` devuelve `Optional.empty()` en vez de lanzar. *(La regla general de auditoría vive en `docs/backend.md §8.6`.)*

---

## 2. Testing — aislamiento

- **Test de aislamiento obligatorio por capacidad de negocio**: contra PostgreSQL real y **como rol no-owner**, verifica que la organización A no ve **ni escribe** datos de la B, incluso con una consulta que omite el filtro. Es un gate, no un extra.
- 🚨 **El test NO puede fijar el contexto él mismo.** Si llama a `TenantSession.bind(...)`, prueba `bind()` y no el aislamiento: pasaría en verde con el mecanismo roto. Debe poblar `OrganizationContext` **como lo hace el filtro JWT** y entrar por una operación `@Transactional` normal. **La ausencia de `bind` en el test es el aserto.**
- **Rol de aplicación no-superusuario** (`AbstractTenantAwareIntegrationTest`): con el superusuario del contenedor RLS ni se aplica, y el test pasaría aunque el aislamiento no existiera.
- **H2 no aplica RLS**: los slices con H2 validan solo el filtrado de aplicación (`@TenantId`). RLS se prueba **solo** contra PostgreSQL real. H2 necesita un alias `set_config` (no-op) para no romper transacciones.
- **`@DataJpaTest` no sirve para repositorios bajo RLS**: el slice no reconstruye de forma confiable la maquinaria de tenencia (el contexto nunca se fija). Usar `@SpringBootTest` acotado al repositorio, como `*IT`.

---

## 3. Frontend — tematización por organización (branding)

Capacidad `organization-branding`: cada organización personaliza su color de marca y su logo, aplicados al **app shell** (post-login).

- **`deriveTheme(colors)`** (`modules/core/theme`), lógica **pura** y testeable: de 1-2 colores de marca deriva los tokens claro y oscuro. Los `-foreground` se eligen por **contraste WCAG AA** (alternan blanco/neutro oscuro, nunca generan colores); *lightness clamping* por modo; los **neutros** conservan S/L y solo cambian el hue; los **semánticos** (éxito/aviso/error) no se tocan.
- **`ThemeManager`** (sin React): inyecta las variables en un `<style>` con `:root { … }` y `.dark { … }`; `reset()` restaura los defaults. **El DOM lo toca el ThemeManager, no los hooks.**
- ⚠️ **Formato de token (Tailwind v4):** la implementación de referencia emitía **canales HSL** (`--primary: 292 72% 36%`) para la config v3. Con v4 (`docs/frontend.md §4.5`) cada token es un **color completo**: `deriveTheme` debe devolver `hsl(292 72% 36%)` (u `oklch(...)`), y `ThemeManager` inyectarlo tal cual. Solo se sobrescriben las variables de `:root`/`.dark`; el `@theme inline` no cambia.
- **`useBranding`** (en `RootLayout`): reactivo al **`organizationId` activo** (no al login); al cambiar, obtiene la marca, deriva y aplica; resetea al cerrar sesión.
- **Cache-first** (`localStorage` por organización): pinta al instante en el arranque y se corrige tras el refresh; se limpia en logout.
- El **favicon no se personaliza**; el **logo** cae al del producto ante error.
- **Regla**: personalizar **solo** el/los color(es) de marca; nunca sobrescribir semánticos ni editar el tema token a token.
- **Roles**: ADMIN sigue siendo un superset de USER dentro del **mismo** `AppLayout` (p. ej. suma "Personalizar marca"). Un layout de admin separado solo se justifica con un backoffice de plataforma que gestione *otras* organizaciones.
