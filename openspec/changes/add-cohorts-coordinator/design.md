## Context

- Roles: `Role { ADMIN, USER }` (`common/Role.java`); columna `users.role VARCHAR(20)` sin `CHECK` (`V2__users.sql`). El JWT lleva el rol como autoridad (`ROLE_*`).
- Alcance de historias: `RecordActor(userId, admin)` (`OrthodonticRecordsController.currentActor`); `OrthodonticRecordService.list` filtra `authoredBy` si no es admin e `inScope` devuelve `404` para historias ajenas. Todo el controlador está bajo `@PreAuthorize("isAuthenticated()")`; los endpoints de ADMIN usan `hasRole('ADMIN')`.
- Hoy cualquier rol que no sea ADMIN se trata como autor: un `COORDINATOR` sin más podría **crear** historias (con cupo nulo = sin límite) e imprimir. Por eso las escrituras deben cerrarse explícitamente.
- Usuarios: `UsersController` (`hasRole('ADMIN')`) con listado, estado y cupo. Inicio: `DashboardService` calcula completitud con `filledSteps` (máscara clínica).
- Frontend: `sections.ts` deriva menú y rutas de los roles; `RequireRole`; `roleHome`, `roleLabel`; `RecordsFeature` distingue `isAdmin`; la vista preliminar (`RecordPrintFeature`) tiene el botón "Imprimir" que registra la impresión.

## Goals / Non-Goals

**Goals:** turmas, alumno en una turma, cuenta de coordinación con sus turmas, y supervisión de solo lectura (listado, vista e Inicio) con el alcance resuelto en el servidor.

**Non-Goals:** que la coordinación escriba, imprima, desbloquee o gestione cuentas; institución; código de turma al registrarse; vencimiento de cuentas; filtro por turma para el ADMIN (posible mejora posterior).

## Decisions

### Datos (`V18`)
```sql
CREATE TABLE cohorts (
    id         BIGSERIAL PRIMARY KEY,
    name       VARCHAR(80) NOT NULL,
    name_key   VARCHAR(80) NOT NULL,           -- nombre normalizado (minúsculas, espacios colapsados)
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT ux_cohorts_name_key UNIQUE (name_key)
);
ALTER TABLE users ADD COLUMN cohort_id BIGINT REFERENCES cohorts (id);
ALTER TABLE users ADD CONSTRAINT ck_users_role CHECK (role IN ('ADMIN', 'USER', 'COORDINATOR'));
ALTER TABLE users ADD CONSTRAINT ck_users_cohort_only_user CHECK (cohort_id IS NULL OR role = 'USER');
CREATE INDEX ix_users_cohort ON users (cohort_id);
CREATE TABLE coordinator_cohorts (
    user_id   BIGINT NOT NULL REFERENCES users (id),
    cohort_id BIGINT NOT NULL REFERENCES cohorts (id),
    PRIMARY KEY (user_id, cohort_id)
);
```
- La regla "turma solo para alumnos" queda también en la base (`CHECK`). Las turmas no se borran en este change (no hay `ON DELETE`).
- Unicidad sin distinguir mayúsculas ni espacios por `name_key`, calculado en el servicio y protegido por el índice único (dos creaciones simultáneas: una gana, la otra `409`).

### Rol y sesión
- `Role.COORDINATOR`; autoridad `ROLE_COORDINATOR`. El refresh emite el token con el rol leído de la base, así que el rol nuevo vale desde la siguiente renovación (el access token dura 15 min).
- **Las turmas se leen de la base en cada petición** (no van en el token): si una coordinación vuelve a `USER` o cambia de turmas, deja de ver lo anterior de inmediato aunque su token siga vigente unos minutos.

### Alcance y escrituras
- `RecordActor(userId, role)`: `currentActor()` sigue siendo estático (lo usan `OrthodonticRecordsController` y `DashboardController`) y solo lee el token. **Las turmas las resuelve el servicio** (`OrthodonticRecordService`, transaccional) consultando `coordinator_cohorts` cuando el actor es `COORDINATOR`:
  - `list`: historias cuyo autor tiene `cohort_id` en las turmas de la coordinación (y, si viene `cohortId`, solo esa, validando que sea suya; si no, lista vacía).
  - `inScope`: autor con `cohort_id` en esas turmas; si no, `404` como hoy.
- **Escrituras cerradas por método**: `@PreAuthorize("hasAnyRole('USER','ADMIN')")` en crear, guardar, registrar impresión, **solicitar** desbloqueo y cupo propio (`GET /quota`). **Descartar la solicitud y desbloquear siguen en `hasRole('ADMIN')`** (la spec vigente exige `403` a un `USER` que descarte).
- **Además, en el dominio**: `create` rechaza con `403` si el autor (leído con bloqueo de la base) no es `USER` ni `ADMIN`. Cubre la ventana del token: una cuenta recién convertida en `COORDINATOR` conserva `ROLE_USER` hasta 15 min y pasaría el `@PreAuthorize`; sin este control, `quotaOf` devolvería sin límite para un `COORDINATOR` y la historia se crearía. Guardar, imprimir y solicitar desbloqueo con ese token no alcanzan nada: la cuenta no tiene historias (solo se convierten cuentas sin historias) e `inScope` de un `USER` solo ve las propias. El `403` sale del manejador existente y el contrato lo documenta solo (OpenAPI suma el `403` a los métodos con `@PreAuthorize`). Lectura (`GET` listado y detalle) sigue con `isAuthenticated()` y el alcance del servicio.
- Respuesta del listado: suma `cohortName` (nullable) del autor, para la columna Turma; el ADMIN también lo recibe (sin filtro nuevo).

### API nueva
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| GET | `/api/cohorts` | ADMIN, COORDINATOR | ADMIN: todas con cantidad de alumnos y coordinadores. COORDINATOR: solo las suyas (`{id, name}`), para el filtro del listado |
| POST | `/api/cohorts` | ADMIN | Crear (`409` si el nombre existe) |
| PATCH | `/api/cohorts/{id}` | ADMIN | Renombrar |
| PATCH | `/api/users/{id}/cohort` | ADMIN | `{ cohortId \| null }`; `409` si la cuenta no es `USER` |
| PATCH | `/api/users/{id}/role` | ADMIN | `{ role: USER \| COORDINATOR, cohortIds }`; `409` si tiene historias al pasar a coordinación; `400` si coordinación sin turmas; `409` si la cuenta es `ADMIN` |
| GET | `/api/dashboard/coordinator` | COORDINATOR | Avance por turma |

- Conversión a `COORDINATOR`: `cohort_id = null`, `record_quota = null`, reemplaza sus `coordinator_cohorts`. Vuelta a `USER`: borra sus `coordinator_cohorts`, `record_quota` = cupo inicial configurado.
- Listado de usuarios: suma `cohort` (`{id, name}` o null) y `coordinatorCohorts` (lista). Estado: el cambio de estado acepta `USER` y `COORDINATOR` (sigue rechazando `ADMIN`).

### Inicio de coordinación
- Por turma: alumnos, historias totales, completas (`bitCount(filledSteps & CLINICAL_MASK) == 7`), en progreso, sin calcular (`filledSteps` nulo), alumnos sin historias, y por alumno (nombre, historias, completas), ordenados por nombre. Una consulta agregada por turma; mismo criterio que `DashboardService`.

### Frontend
- `Role` suma `COORDINATOR`: etiqueta "Coordinación", inicio `/`, menú: Inicio e Historias clínicas (la sección `users` sigue solo `ADMIN`).
- **Historias**: para `COORDINATOR`, columnas Alumno y Turma, selector de turma (con `GET /api/cohorts`, que le devuelve las suyas), sin "Nueva historia" ni aviso de cupo. En `RecordsTable` y `RecordsCardList`, el enlace del paciente abre la vista preliminar (`/historias/:id/imprimir`) y no se muestra `RecordEditLink`.
- **Rutas**: `/historias/nueva` y `/historias/:id` (formulario) exigen `USER` o `ADMIN` (`RequireRole`); `/historias/:id/imprimir` admite los tres. Para `COORDINATOR` la vista preliminar se muestra **sin "Imprimir"**; "Volver" usa `returnTo` o, sin él, el listado (`PATHS.RECORDS`), nunca el formulario; y la ayuda no dice "pulsa Imprimir" (texto propio de solo lectura). La hoja sigue oculta al imprimir con Ctrl+P: sale solo el aviso, como hoy.
- **Usuarios** (ADMIN): columna Turma con selector en las filas de alumnos; acción "Convertir en coordinación" / "Volver a alumno" con selector múltiple de turmas; botón "Turmas" que abre un diálogo para crear y renombrar.
- **Inicio** (`COORDINATOR`): una tarjeta por turma con el resumen y la tabla de alumnos (`StatCard`/`MeterBar` existentes).

## Risks / Trade-offs

- **Token de 15 min con el rol anterior**: acotado en los dos sentidos. USER → COORDINATOR: `create` se rechaza en el dominio y la cuenta no tiene historias que guardar. COORDINATOR → USER: las turmas se leen de la base, así que no ve nada aunque su token diga `COORDINATOR`.
- **El ADMIN asigna todo a mano**: aceptado para cohortes de 15–20; el código de turma va en otro change.
- **Sin institución**: una sola institución hoy; agregarla después es una tabla y una FK en `cohorts`, sin rehacer el alcance.
- **Superficie de escrituras**: cerrar por método (lista explícita) en vez de por defecto; un endpoint nuevo de escritura debe acordarse de `hasAnyRole('USER','ADMIN')`. Un test recorre los métodos de escritura con un token de coordinación y exige `403`.
