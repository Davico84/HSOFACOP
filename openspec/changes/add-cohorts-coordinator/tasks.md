> Rama `change/add-cohorts-coordinator` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V18`: `cohorts` (nombre y `name_key` único), `users.cohort_id`, `CHECK` de rol y de turma solo para `USER`, `coordinator_cohorts`; `Role.COORDINATOR`
- [ ] 1.2 Turmas: servicio y `CohortsController` (`GET`/`POST`/`PATCH`, solo ADMIN; `409` por nombre repetido, normalización del nombre)
- [ ] 1.3 Usuarios: `PATCH /api/users/{id}/cohort` y `PATCH /api/users/{id}/role` con las reglas del design (historias, sin turmas, ADMIN, cupo); listado con `cohort` y `coordinatorCohorts`; cambio de estado admite `COORDINATOR`
- [ ] 1.4 Historias: `RecordActor(userId, role, cohortIds)`; alcance de `COORDINATOR` en `list` (filtro `cohortId`) e `inScope`; `cohortName` en el listado; `@PreAuthorize("hasAnyRole('USER','ADMIN')")` en crear, guardar, imprimir, solicitar/descartar desbloqueo y cupo
- [ ] 1.5 `GET /api/dashboard/coordinator` (avance por turma y por alumno)
- [ ] 1.6 Tests: migración; turmas (crear, repetido, renombrar, 403); asignación y conversión (cada regla); alcance (lista, filtro, 404 fuera de turma, sin turma); escrituras `403` recorriendo todos los métodos de escritura; turmas leídas de la base (quitar turma = deja de ver al instante); Inicio de coordinación; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el cliente orval
- [ ] 2.2 `Role` con `COORDINATOR`: etiqueta, inicio, menú; rutas del formulario solo `USER`/`ADMIN`
- [ ] 2.3 Historias para coordinación: columnas Alumno y Turma, filtro por turma, sin "Nueva historia" ni cupo, filas a la vista preliminar; vista preliminar sin "Imprimir" para `COORDINATOR`
- [ ] 2.4 Usuarios (ADMIN): columna y selector de Turma, convertir/volver con turmas, diálogo de Turmas (crear y renombrar)
- [ ] 2.5 Inicio de coordinación: tarjeta por turma con resumen y alumnos
- [ ] 2.6 Tests (uno por scenario de la UI): listado y filtro, vista sin "Imprimir" ni formulario, rutas bloqueadas, Usuarios (turma, conversión, turmas), Inicio; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: turma, rol `COORDINATOR`, alcance de solo lectura
- [ ] 3.2 Al archivar: `docs/vision.md` ✅
