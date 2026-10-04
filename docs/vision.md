# Visión de producto — HS FACOP

Dimensión de **negocio** (sustituible por proyecto). Define **qué** construimos y **en qué orden**. El **cómo** (stack, estándares) vive en `docs/architecture.md`, `docs/backend.md`, `docs/frontend.md`, `docs/coding-style.md` y `docs/testing.md`. El **modelo de dominio** vive en `docs/domain.md`.

> 📝 **Plantilla.** Las secciones marcadas con ✏️ son para rellenar en cada proyecto derivado. Lo demás (estado de capacidades técnicas, gobernanza, granularidad) aplica tal cual.

---

## 1. Producto ✏️

**HS FACOP** es el sistema de historias clínicas de ortodoncia de la Escuela de Post-grado AEO / FACOP: los tratantes llenan la historia desde un formulario por pasos (en vez de a mano sobre el PDF) y la imprimen con la presentación oficial; los supervisores revisan y corrigen cualquiera.

**Objetivos:**
- Historias legibles, completas y reimprimibles: se llenan, guardan y corrigen sin rehacer la hoja.
- Revisión por supervisores: el ADMIN ve y corrige las historias de todos los tratantes.
- Seguridad y trazabilidad: identidad + rol en toda operación.

---

## 2. Roadmap de capacidades ✏️

> ⚠️ No es `openspec/specs/`. `specs/` contiene solo lo **ya construido**; este roadmap es ayuda de planificación. Cada capacidad nace como *change* (`add-<capacidad>`) y llega a `specs/` al archivar.

| # | Capacidad | Tipo | Actor principal | Alcance breve | Depende de |
|---|---|---|---|---|---|
| 0 | `project-foundation` | técnica | dev | esqueleto ejecutable/validable del monorepo + tema por tokens | — |
| 1 | `authentication` | negocio | usuario | registro, login, sesión, refresh, logout, protección por rol | 0 |
| 2 | `app-shell` | técnica | usuario | layout privado (sidebar/header) + dashboard de ejemplo | 1 |
| 3 | `template-bootstrap` | técnica | dev | configurar identidad visible y BD de una copia nueva | 0 |
| 4 | `users` | negocio | admin | listado de cuentas y activar/deshabilitar usuarios (`add-user-account-status`); roles, alta y perfil en cambios posteriores | 1 |
| 5 | `orthodontic-records` | negocio | tratante (`USER`) / supervisor (`ADMIN`) | historia clínica de ortodoncia: wizard, borrador, listado/búsqueda e impresión fiel al PDF. Fase 1: secciones de texto y selección (`add-orthodontic-records`); fase 2: análisis de modelos (transversal, Moyers, Nance y Bolton). Las notas de evolución se imprimen en blanco para llenar a mano (decisión del usuario) | 1, 2 |
| … | `dashboard` | negocio | admin | panel con métricas reales del negocio | resto |

---

## 3. Estado de capacidades (puente hacia `specs/` y `changes/`)

> Esta lista es el **puente vivo** entre la planificación y lo construido. **Actualízala en cada `/opsx:propose` y `/opsx:archive`** (ver "Ciclo de vida" abajo).

- ✅ **`project-foundation`** — construida. Spec: `openspec/specs/project-foundation/spec.md` · changes archivados: `openspec/changes/archive/2026-07-03-add-project-scaffolding/`, `…/2026-09-28-update-tailwind-v4/` (Tailwind CSS 4 + "Tema definido por tokens CSS").
- ✅ **`authentication`** — construida. Spec: `openspec/specs/authentication/spec.md` · change archivado: `openspec/changes/archive/2026-07-07-add-authentication/`.
- ✅ **`api-type-contracts`** (técnica) — construida (contrato OpenAPI versionado + codegen orval). Spec: `openspec/specs/api-type-contracts/spec.md` · mismo change `add-authentication`.
- ✅ **`app-shell`** (técnica) — construida: layout privado (sidebar/header responsive, logout al pie de la sidebar) + dashboard de inicio con datos de ejemplo. Spec: `openspec/specs/app-shell/spec.md` · change archivado: `openspec/changes/archive/2026-09-26-add-app-shell/`.
- ✅ **`template-bootstrap`** (técnica) — construida: `project.config.json` + asistente `pnpm project:setup` / `pnpm project:apply` (identidad visible, BD, logos y colores; sin renombrados técnicos) para reutilizar la plantilla. Spec: `openspec/specs/template-bootstrap/spec.md` · change archivado: `openspec/changes/archive/2026-09-29-add-template-bootstrap/`.
- ✅ **Tooltips del app-shell** (`app-shell`) — construida: tooltip de shadcn (Radix) en la barra de iconos (tablet) + `components.json`. Spec: `openspec/specs/app-shell/spec.md` · change archivado: `openspec/changes/archive/2026-09-29-update-app-shell-tooltips/`.
- ✅ **Guardián del contrato** (`api-type-contracts`) — construida: `ContractDriftIT` (backend → contrato, en `verify`) + regenerar sin levantar la app con `-Dcontract.update=true`; CI también con cambios en `contracts/**`. Spec: `openspec/specs/api-type-contracts/spec.md` · change archivado: `openspec/changes/archive/2026-09-29-add-contract-drift-guard/`.
- ✅ **Bloqueo de login por intentos fallidos** (`authentication`) — construida: bloqueo temporal tras N fallos (config validada al arranque, `UPDATE` atómico en transacción propia, reset condicional, login sin transacción larga, 401 indistinguible). Spec: `openspec/specs/authentication/spec.md` · change archivado: `openspec/changes/archive/2026-09-29-add-login-lockout/`.
- ✅ **Formato uniforme de error** (`api-type-contracts`) — construida (en runtime): mismo `ProblemDetail` con `detail` en español, `type` `/errors/<…>`, `timestamp` y `traceId` también en los errores que resuelve Spring MVC por defecto (`handleExceptionInternal` + mapa status → mensaje). El contrato los documenta desde `update-api-contract-responses`. Spec: `openspec/specs/api-type-contracts/spec.md` · change archivado: `openspec/changes/archive/2026-09-29-update-api-type-contracts/`.
- ✅ **Errores y status reales en el contrato** (`api-type-contracts`) — construida: schemas `ApiProblem`/`ValidationProblem`, `201`/`204` reales, errores semánticos por operación, transversales 401/403/500 automáticos (`OpenApiErrorsConfig` + `PublicPaths`), frontend tipado con el modelo generado; `OpenApiContractIT` vigila la fidelidad. Spec: `openspec/specs/api-type-contracts/spec.md` · change archivado: `openspec/changes/archive/2026-09-29-update-api-contract-responses/`.
- ✅ **Secreto JWT obligatorio y robusto** (`authentication`) — construida: la app no arranca con un secreto ausente, sin resolver, de ejemplo o < 32 bytes (`JwtSecretRules` en `TokenService`, sin revelar el valor); secreto propio en los tests (`@DynamicPropertySource`). Spec: `openspec/specs/authentication/spec.md` · change archivado: `openspec/changes/archive/2026-09-30-update-jwt-secret-validation/`.
- ✅ **Documentación de la API apagada por defecto** (`api-type-contracts`) — construida: `SWAGGER_ENABLED` (por defecto `false`) gobierna Swagger UI y `/v3/api-docs`; local la enciende en `secrets.properties` y los tests de contrato con `@TestPropertySource`. Spec: `openspec/specs/api-type-contracts/spec.md` · change archivado: `openspec/changes/archive/2026-09-30-update-api-docs-exposure/`.
- ✅ **Aviso de backend listo al arrancar** (`project-foundation`) — construida: bloque destacado en el log (`StartupReadyBanner`, `ApplicationReadyEvent`) con el nombre del proyecto, la URL con el puerto real y el estado de Swagger; solo ASCII y sin secretos. Spec: `openspec/specs/project-foundation/spec.md` · change archivado: `openspec/changes/archive/2026-09-30-add-startup-ready-banner/`.
- ✅ **Navegación filtrada por rol** (`app-shell`) — construida: `core/config/sections.ts` como única fuente de verdad; menú filtrado por rol y cada sección (con sus subrutas) protegida con `RequireRole`, acceso denegado dentro del shell; `Role` desde el contrato. Spec: `openspec/specs/app-shell/spec.md` · change archivado: `openspec/changes/archive/2026-10-01-update-app-shell-role-nav/`.
- ✅ **`users` (primera parte): estado de cuenta** (`users` + `authentication`) — construida: `ACTIVE`/`DISABLED`; una cuenta deshabilitada no inicia ni renueva sesión (403 explicativo, revocación de refresh tokens, ventana ≤ 15 min); pantalla "Usuarios" solo `ADMIN` (listado paginado, activar/deshabilitar cuentas `USER`). Pendiente en `users`: roles, alta por admin y perfil. Spec: `openspec/specs/users/spec.md` · change archivado: `openspec/changes/archive/2026-10-01-add-user-account-status/`.
- ✅ **`orthodontic-records` (fase 1)** — construida: historia clínica de ortodoncia en 7 pasos (págs. 1–4 y 10–13 del PDF), número `AEO-001` por tratante, borrador con versión (409), listado con búsqueda en la URL, acceso autor/`ADMIN`, vista preliminar e impresión A4 fiel al PDF (incluye la hoja de notas de evolución en blanco). Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-02-add-orthodontic-records/`. Siguiente: fase 2 (análisis de modelos).
- ✅ **`orthodontic-records` (fase 2.1): análisis transversal de los modelos** — construida: paso 5 "Análisis de modelos" tras el oclusal (8 pasos), medidas AIS/AII/AMS/AMI, borde WALA y distancias WALA–EV con diferencias automáticas (promedio intermolar por sexo y normas por diente), hoja impresa tras el análisis oclusal (10 hojas). Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-02-add-orthodontic-transversal-analysis/`. Siguen Moyers, Nance y Bolton (un change cada uno).
- ✅ **`orthodontic-records` (fase 2.2): análisis de Moyers** — construida: panel en el paso 5 (análisis de modelos en paneles plegables) con fecha, incisivos 42/41/31/32 y suma, espacio requerido con la tabla de Moyers al 75 % (suma redondeada al 0,5), diferencia disponible − requerido por arcada y lado, predisposición de apiñamiento escrita por el odontólogo, hoja impresa tras el transversal (11 hojas). Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-02-add-orthodontic-moyers-analysis/`. Siguen Nance y Bolton.
- ✅ **`orthodontic-records` (fase 2.3): análisis de Nance** — construida: panel 3 del paso 5 con fecha, puntos 1 (SA) y 2 (ST), anchos de 15→25 y 45→35 con total, discrepancia SA − ST calculada (vacía si falta una pieza), conclusión escrita, dibujo SVG de la arcada superior, hoja impresa tras Moyers (12 hojas; pág. 8 en blanco omitida). Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-03-add-orthodontic-nance-analysis/`. Sigue Bolton.
- ✅ **`orthodontic-records` (fase 2.4): análisis de Bolton** — construida: panel 4 del paso 5 en español con fecha, grilla de 12 + 12 piezas (15→25 y 45→35 compartidas con Nance; 1eros molares propios), relación total y anterior calculadas con la fórmula en fracción, rango y real/ideal/diferencia del lado que corresponde, hoja impresa tras Nance (13 hojas). Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-03-add-orthodontic-bolton-analysis/`. **Fase 2 completa: historia clínica completa** (las notas de evolución se llenan a mano sobre la hoja impresa, desde la fase 1).
- ✅ **`orthodontic-records`: corrección de Bolton** — construida: Bolton comparte con Nance solo caninos y premolares (incisivos y 1eros molares propios, con migración V10 que copió los incisivos de Nance), aviso corregido, anchos de pieza en 4,0–13,0 mm en Moyers, Nance y Bolton, relación fuera de rango resaltada. Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-04-update-orthodontic-bolton-shared-teeth/`.
- ✅ **`orthodontic-records`: uso en celular y tablet** — construida: listado en tarjetas bajo 1024 px, vista previa escalada en pantalla (impresión A4 igual), paso actual visible y "Paso N de 8", tablas anchas del paso 5 con desplazamiento indicado (`ScrollableX`), Nance y Bolton apilados en celular, barra de acciones en una fila; E2E de regresión a 375 y 768 px. Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-04-update-orthodontic-records-responsive/`.
- ✅ **`orthodontic-records`: navegación de pasos con estado** — construida: columna lateral de pasos en escritorio y panel (`sheet`) en celular, estado por paso (con errores / con datos / vacío; los valores por defecto no cuentan) y progreso "N de 8 pasos con datos"; desde el panel, un campo inválido enfoca el error y avisa. Spec: `openspec/specs/orthodontic-records/spec.md` · change archivado: `openspec/changes/archive/2026-10-04-update-orthodontic-records-step-navigation/`.
- 🚧 **`app-shell`: barra lateral contraíble en escritorio** — en progreso: botón para contraer la barra a solo íconos (con tooltips e ícono de la marca) y expandirla, preferencia del usuario recordada en el navegador; sin cambios automáticos por pantalla; app con ancho máximo de 1920 px centrada (barra junto al contenido) y contenido de 1536 px en pantallas muy anchas; tablet y celular igual. Change: [`proposal.md`](../openspec/changes/update-app-shell-collapsible-sidebar/proposal.md) · [`design.md`](../openspec/changes/update-app-shell-collapsible-sidebar/design.md).
- ⏳ **Resto** — planeadas (ver roadmap).

---

## 4. Ciclo de vida de una capacidad (gobernanza)

```
planeada (este roadmap) → en progreso (change activo: proposal.md + design.md) → construida (specs/<cap>/spec.md; change en changes/archive/)
```

Disciplina para que el contexto de la IA se mantenga preciso (su contexto se extrae de `specs/` y `docs/`):

- **En `/opsx:propose`**: enlaza el change nuevo (`openspec/changes/<id>/proposal.md` y `design.md`) en "Estado de capacidades" y márcala 🚧/en progreso.
- **En `/opsx:archive`** (en el **mismo commit/PR** que el archivado):
  1. Si la capacidad tocó el dominio, **actualiza `docs/domain.md`** — es la fuente de la que la IA extrae el modelo; desincronizarla degrada la precisión.
  2. Marca la capacidad como ✅ **construida** y enlaza su `spec.md` en `openspec/specs/`.
  3. Verifica que el change quedó en `openspec/changes/archive/`.

Regla equivalente para agentes en `CLAUDE.md → Flujo de trabajo → Gobernanza del ciclo`.

---

## 5. Convención de granularidad de capacidades

**Una capacidad = un sustantivo, un actor/objetivo principal, un conjunto cohesivo de requirements**, con su propio `openspec/specs/<nombre>/spec.md`. Dos tipos: **de negocio** (lo que el usuario final hace: `authentication`, `orders`) y **técnica/plataforma** (base sobre la que se construye: `project-foundation`, `api-type-contracts`).

**Mantén junto** cuando los requirements comparten actor y ciclo de vida, o cuando partirlo dejaría fragmentos sin sentido propio. **Parte** cuando aparecen actores/objetivos distintos con flujos independientes, cuando el `spec.md` crece demasiado (guía: **> ~7–8 requirements**), o cuando dos áreas evolucionan/despliegan por separado.

> Señal de mala granularidad: un `#### Scenario:` que mezcla dos objetivos no relacionados, o un nombre de capacidad que necesita "y" (`login-y-pagos`).

**Nomenclatura**: capacidad en **kebab-case sustantivo** (`authentication`); `change-id` = **verbo + capacidad** (`add-authentication`, `update-orders`). Un change modifica **una** capacidad siempre que sea posible; si toca varias, crea un `spec.md` delta por cada una.

**Decisión tomada**: `authentication` es **UNA** sola capacidad (no se parte en registration/session/authorization); la autorización por rol es **parte de** ella. Razón: todos sus requirements giran en torno a identidad, sesión y acceso, con el mismo actor y modelo de token/rol.

---

## 6. Notas de secuencia ✏️

- **`authentication` primero**: todo lo demás asume identidad + roles.
- **`dashboard` al final**: agrega datos de casi todas las capacidades; construirlo antes obligaría a rehacerlo.
- _[dependencias propias de tu producto]_

## 7. Fuera de alcance por ahora (candidatas futuras)

- `chatbot` (Spring AI ya está en el stack) — no priorizada aún.
- `notifications` (correo/realtime STOMP) — cuando una capacidad lo requiera.

**Variantes de plantilla:**
- **Esta plantilla = single-tenant** (una sola empresa): auth + app shell + asistente de configuración, sin organizaciones ni branding por organización.
- **Plantilla multi-tenant básica** — planificada. Añadirá `multi-tenancy` (aislamiento `@TenantId` + RLS) y `organization-branding`. Reglas y lecciones conservadas en [`docs/future/multi-tenant-template.md`](future/multi-tenant-template.md).

**Tooling de plataforma (transversal, aún NO adoptado):**
- **Seguridad (Snyk)**: escaneo de vulnerabilidades. Escalonado: primero **Dependabot** + `pnpm audit` (front) + **OWASP Dependency-Check** (Maven, back) en CI —sin cuentas externas—; **Snyk** después para SAST/licencias/contenedores (requiere cuenta + `SNYK_TOKEN`).
- **Observabilidad (Sentry)**: monitoreo de errores + performance en front (React) y back (Spring Boot). Se apoya en el `traceId` (RFC 9457 + MDC) ya existente. Se monta con el setup de deploy/entornos.

> El orden no es rígido: se ajusta según prioridad de negocio. Cambiar el orden no cambia las reglas de granularidad de este documento.
