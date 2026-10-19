> Rama `change/add-cohort-registration-code` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V19`: código y apertura en `cohorts` (código para las turmas existentes, `CHECK` y único) y celular, documento y COP en `users` con sus `CHECK`; campos en las entidades
- [ ] 1.2 Turmas: generar el código al crear (`SecureRandom`, alfabeto sin 0/O/1/I, reintento ante colisión), `POST /api/cohorts/{id}/registration-code`, `PATCH /api/cohorts/{id}/registration`; `GET /api/cohorts` suma código y estado solo para el ADMIN
- [ ] 1.3 Registro: `RegisterRequest` con `cohortCode` y datos opcionales (record compartido `ContactFields` con validación de celular, documento tipo+número y COP); `AuthService.register` normaliza el código y rechaza inexistente (`invalid-cohort-code`) o cerrada (`cohort-registration-closed`) con `400` antes de crear; alta con la turma
- [ ] 1.4 Mis datos: `GET`/`PUT /api/me/profile` (id del token) con la misma validación
- [ ] 1.5 Usuarios: el listado suma celular, documento y COP
- [ ] 1.6 Tests: migración (turmas existentes con código válido y único; `CHECK` de usuarios); código al crear y nuevo invalida el anterior; coordinación sin código; 403 para otros roles; cerrar/reabrir; registro con código (normalizado), inexistente, cerrada, sin código, con datos y con datos inválidos; Mis datos (leer, guardar, quitar, 400, 401); listado con los datos; `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` y el cliente orval
- [ ] 2.2 Schema Zod compartido de los datos (`modules/users/schemas/contact.ts`, paridad con `ContactFields`)
- [ ] 2.3 Registro: "Código de turma (opcional)" con su ayuda y bloque "Datos del alumno (opcional)"; errores de código junto al campo
- [ ] 2.4 Turmas (diálogo): código con copiar, nuevo código con confirmación, abrir/cerrar inscripción y badge de estado
- [ ] 2.5 "Mis datos": sección en el menú para todos los roles y formulario con nombre, correo y rol de solo lectura
- [ ] 2.6 Usuarios: acción "Ver datos" con su diálogo de solo lectura
- [ ] 2.7 Tests (uno por scenario de la UI): registro con código válido, inválido y cerrado, datos inválidos; Turmas (copiar, nuevo código, cerrar); Mis datos (guardar, error); Ver datos; `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: código de inscripción y apertura de la turma, datos de contacto de la cuenta

## Workflow follow-up

- Al archivar: `docs/vision.md` ✅ y spec sincronizadas.
