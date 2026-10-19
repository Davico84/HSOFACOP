## Why

Hoy un alumno de una institución se registra igual que uno individual y el ADMIN tiene que buscarlo en "Usuarios" y asignarle la turma a mano. Con cohortes de 15–20 alumnos eso es lento y propenso a errores. Además la institución pide datos de contacto e identificación de sus alumnos (teléfono, documento, colegiatura), que el sistema no guarda: el registro solo pide nombre, correo y contraseña.

## What Changes

- **Código de inscripción por turma** (`cohorts`): cada turma tiene un código propio que el sistema genera (8 caracteres sin letras ni números que se confundan, mostrado como `K7QM-4TXR`). El ADMIN lo ve en "Turmas", lo copia para compartirlo y puede generar uno nuevo si se filtró (el anterior deja de servir).
- **Turma abierta o cerrada** (`cohorts`): el ADMIN cierra una turma cuando termina la inscripción; su código deja de aceptar registros. Sus alumnos, su coordinación y la asignación manual siguen igual. Se puede reabrir.
- **Registro con código opcional** (`authentication`): el formulario de registro suma "Código de turma (opcional)". Con un código válido de una turma abierta, la cuenta nace como alumno de esa turma; sin código, como alumno individual (como hoy). Un código que no existe o de una turma cerrada se rechaza con un mensaje junto al campo, sin crear la cuenta.
- **Datos del alumno** (`users`): el registro pide, todos opcionales, celular (9 dígitos), documento (DNI, carné de extranjería o pasaporte, con las mismas reglas que el del paciente) y número de colegiatura (COP). Cada cuenta los ve y corrige después en una pantalla nueva "Mis datos".
- **Usuarios** (`users`): el listado suma esos datos y la tabla ofrece una acción "Ver datos" con el celular, el documento y el COP de la cuenta.
- **Contrato**: el registro acepta `cohortCode` y los datos; endpoints nuevos para el código y la apertura de la turma y para "Mis datos"; el listado de turmas del ADMIN suma código y estado.

### Non-goals

- Enlace de invitación (`/registro?turma=…`) y código para registrarse como coordinación.
- Que el ADMIN edite los datos de un alumno (los corrige el alumno en "Mis datos").
- Hacer obligatorio algún dato, o el código para registrarse.
- Cupo de historias por turma (sigue el cupo inicial global).
- Límite de intentos de registro por IP (pendiente de la auditoría, change aparte).
- Editar nombre, correo o contraseña desde "Mis datos".

## Capabilities

### New Capabilities
- (ninguna)

### Modified Capabilities
- `cohorts`: código de inscripción y estado abierta/cerrada de la turma; el alumno entra a la turma al registrarse con su código.
- `authentication`: el registro acepta un código de turma y datos opcionales del alumno.
- `users`: datos de contacto e identificación de la cuenta ("Mis datos") y su lectura por el ADMIN en "Usuarios".

## Impact

- Backend: migración `V19` (código y apertura en `cohorts`, datos en `users`); `AuthService.register`, `CohortService`, `UserAdminService`, perfil propio; tests.
- Contrato `contracts/openapi.json` y cliente orval.
- Frontend: formulario de registro, diálogo "Turmas" (código, copiar, regenerar, abrir/cerrar), pantalla "Mis datos" (menú), acción "Ver datos" en "Usuarios".
- Docs: `docs/domain.md` (código de turma, datos del alumno), `docs/vision.md`.
