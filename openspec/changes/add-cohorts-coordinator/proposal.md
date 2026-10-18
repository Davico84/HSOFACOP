## Why

La propuesta institucional promete "acceso de coordinación", y hoy no existe: solo hay `USER` (alumno) y `ADMIN` (global, ve todo). La institución actual (HS FACOP Arequipa) organiza a sus alumnos en **turmas** (Turma 1, Turma 2, y vendrán más), y el docente que coordina necesita ver el avance de **sus** turmas sin pedir hojas, sin poder modificar historias y sin ver a los alumnos individuales que contratan por su cuenta.

## What Changes

- **Turmas** (capacidad nueva `cohorts`): el `ADMIN` crea y renombra turmas (solo nombre, único) y asigna a cada alumno (`USER`) una turma o ninguna. Sin entidad "institución" por ahora: se agrega arriba de las turmas cuando haya una segunda.
- **Rol `COORDINATOR`**: el `ADMIN` convierte una cuenta `USER` sin historias en coordinación (y la vuelve a `USER`), le asigna una o más turmas y la puede deshabilitar como a cualquier cuenta. No tiene cupo ni crea historias.
- **El coordinador supervisa en solo lectura** las historias de los alumnos de sus turmas:
  - **listado** "Historias clínicas" con columnas Alumno y Turma y filtro por turma, sin "Nueva historia";
  - **abrir una historia** = vista preliminar A4 **sin "Imprimir"** (no registra impresiones ni fija datos del paciente) y sin el formulario editable;
  - **Inicio** con el avance por turma (alumnos, historias completas, en progreso y sin calcular, alumnos sin historias, datos faltantes).
- **Servidor**: toda escritura del coordinador (crear, guardar, imprimir, solicitar desbloqueo) responde `403`; una historia fuera de sus turmas, `404` (como hoy para un `USER`). El alcance se resuelve en el servidor en cada petición, así un cambio de turma vale de inmediato.
- **Pantalla Usuarios** (ADMIN): columna Turma y acción para asignarla; rol "Coordinación" con sus turmas; gestión de turmas.
- **Contrato**: endpoints nuevos de turmas, de asignación y del Inicio del coordinador; el enum de roles suma `COORDINATOR`.

### Non-goals

- Que el coordinador corrija, imprima, desbloquee, gestione cuentas o cupos (lo sigue haciendo el ADMIN).
- Código de turma al registrarse e invitaciones (más adelante).
- Vencimiento de las cuentas a los 12 meses (change aparte).
- Entidad "institución" y separación entre instituciones.

## Capabilities

### New Capabilities
- `cohorts`: turmas, asignación de alumnos, cuentas de coordinación y su supervisión de solo lectura (listado, vista de la historia e Inicio).

### Modified Capabilities
- `orthodontic-records`: "Acceso por autor y administrador" suma el alcance de solo lectura del coordinador.

## Impact

- Backend: migración `V18` (turmas, turma del alumno, turmas del coordinador); `Role.COORDINATOR`; `RecordActor` con el rol y las turmas; servicios y controladores de turmas, usuarios, historias y dashboard; tests.
- Contrato `contracts/openapi.json` y cliente orval.
- Frontend: `Role` con `COORDINATOR` (etiqueta, inicio y menú), pantalla Usuarios (turma, rol, turmas), listado de historias, vista preliminar sin "Imprimir", Inicio del coordinador.
- Docs: `docs/domain.md` (turma, coordinador), `docs/vision.md`.
