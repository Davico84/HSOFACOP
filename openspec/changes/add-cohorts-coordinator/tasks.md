> Rama `change/add-cohorts-coordinator` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [x] 1.1 `V18`: `cohorts` (nombre y `name_key` único), `users.cohort_id`, `CHECK` de rol y de turma solo para `USER`, `coordinator_cohorts`; `Role.COORDINATOR`
- [x] 1.2 Turmas: servicio y `CohortsController` (`GET` ADMIN todas con conteos / COORDINATOR solo las suyas `{id, name}`; `POST`/`PATCH` solo ADMIN; `409` por nombre repetido, normalización del nombre)
- [x] 1.3 Usuarios: `PATCH /api/users/{id}/cohort` y `PATCH /api/users/{id}/role` con las reglas del design (historias, sin turmas, ADMIN, cupo); listado con `cohort` y `coordinatorCohorts`; cambio de estado admite `COORDINATOR`
- [x] 1.4 Historias: `RecordActor(userId, role)`; el servicio resuelve las turmas de la coordinación en `list` (filtro `cohortId`) e `inScope`; `cohortName` en el listado; `@PreAuthorize("hasAnyRole('USER','ADMIN')")` en crear, guardar, imprimir, solicitar desbloqueo y cupo (descartar y desbloquear siguen `ADMIN`); `create` rechaza en el dominio a un autor que no es `USER` ni `ADMIN`
- [x] 1.5 `GET /api/dashboard/coordinator` (avance por turma y por alumno)
- [x] 1.6 Tests: migración; turmas (crear, repetido, renombrar, 403); asignación y conversión (cada regla); alcance (lista, filtro, 404 fuera de turma, sin turma); escrituras `403` recorriendo todos los métodos de escritura; crear con token de `USER` de una cuenta ya convertida → `403`; `USER` que descarta una solicitud sigue en `403`; turmas leídas de la base (quitar turma = deja de ver al instante); Inicio de coordinación; `mvn verify` en verde

## 2. Contrato y frontend

- [x] 2.1 Regenerar `contracts/openapi.json` y el cliente orval
- [x] 2.2 `Role` con `COORDINATOR`: etiqueta, inicio, menú; rutas del formulario solo `USER`/`ADMIN`
- [x] 2.3 Historias para coordinación: columnas Alumno y Turma, filtro por turma (`GET /api/cohorts`), sin "Nueva historia" ni cupo; en `RecordsTable` y `RecordsCardList` el paciente abre la vista preliminar y sin `RecordEditLink`; vista preliminar sin "Imprimir", "Volver" al listado sin `returnTo` y ayuda de solo lectura
- [x] 2.4 Usuarios (ADMIN): columna y selector de Turma, convertir/volver con turmas, diálogo de Turmas (crear y renombrar)
- [x] 2.5 Inicio de coordinación: tarjeta por turma con resumen y alumnos
- [x] 2.6 Tests (uno por scenario de la UI): listado y filtro, vista sin "Imprimir" ni formulario, rutas bloqueadas, Usuarios (turma, conversión, turmas), Inicio; `pnpm validate` en verde

## 3. Docs

- [x] 3.1 `docs/domain.md`: turma, rol `COORDINATOR`, alcance de solo lectura
- [ ] 3.2 Al archivar: `docs/vision.md` ✅
