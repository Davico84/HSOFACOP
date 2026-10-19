> Rama `change/add-cohort-registration-code` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V19`: código (`VARCHAR(8)`) y apertura en `cohorts` (código sin repetir para las turmas existentes, `CHECK` y único) y celular, documento y COP en `users` con sus `CHECK` (también el número según el tipo); campos en las entidades
- [ ] 1.2 Turmas: generar el código al crear (`SecureRandom`, alfabeto sin 0/O/1/I, reintento ante colisión), `POST /api/cohorts/{id}/registration-code`, `PATCH /api/cohorts/{id}/registration`; `GET /api/cohorts` suma código y estado solo para el ADMIN
- [ ] 1.3 Registro: `RegisterRequest` con `cohortCode` y datos opcionales (record compartido `ContactFields` que normaliza vacíos a `null` y valida celular, documento tipo+número y COP); `AuthService.register` normaliza el código y rechaza inexistente (`invalid-cohort-code`) o cerrada (`cohort-registration-closed`) con `400` antes de crear; alta con la turma
- [ ] 1.4 Mis datos: `ProfileController` propio (cualquier autenticado, no bajo `UsersController`) con `GET`/`PUT /api/me/profile` (id del token, `PUT` responde `200` con el perfil), misma validación y vacío = quitar
- [ ] 1.5 Usuarios: el listado suma celular, documento y COP (`nullable` en el contrato, como el código y el estado de `CohortResponse`)
- [ ] 1.6 Tests: migración (turmas existentes con código válido y único; `CHECK` de usuarios); código al crear y nuevo invalida el anterior; coordinación sin código; 403 para otros roles; cerrar/reabrir; registro con código (normalizado), inexistente, cerrada, sin código, con datos y con datos inválidos; Mis datos (leer, guardar, quitar, 400, 401); listado con los datos; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` (`-Dcontract.update=true`) y el cliente orval; `OpenApiContractIT` y `ContractDriftIT` en verde
- [ ] 2.2 Schema Zod compartido de los datos (`modules/users/schemas/contact.ts`, paridad con `ContactFields`, vacíos a `null`) y `modules/cohorts/utils/cohortCode.ts` (`formatCohortCode`, `cleanCohortCode`) con tests
- [ ] 2.3 Registro: "Código de turma (opcional)" con su ayuda y bloque "Datos del alumno (opcional)"; errores de código (por `problemType`) junto al campo y sin el toast genérico
- [ ] 2.4 Turmas (diálogo): código con copiar, nuevo código con confirmación, abrir/cerrar inscripción y badge de estado
- [ ] 2.5 "Mis datos": sección en el menú para todos los roles y formulario con nombre, correo y rol de solo lectura
- [ ] 2.6 Usuarios: acción "Ver datos" para toda cuenta (también ADMIN) con su diálogo de solo lectura
- [ ] 2.7 Tests (uno por scenario de la UI): registro con código válido, inválido y cerrado, datos inválidos; Turmas (copiar, nuevo código, cerrar); Mis datos (guardar, error); Ver datos; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: código de inscripción y apertura de la turma, datos de contacto de la cuenta

## Workflow follow-up

- Al archivar: `docs/vision.md` ✅ y spec sincronizadas.
