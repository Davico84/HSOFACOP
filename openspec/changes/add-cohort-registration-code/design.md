## Context

- Turmas (`add-cohorts-coordinator`, V18): `cohorts(id, name, name_key)`, `users.cohort_id` (solo `USER`) y `coordinator_cohorts`. El ADMIN asigna la turma a mano desde "Usuarios" (`PATCH /api/users/{id}/cohort`). `GET /api/cohorts` devuelve `CohortResponse` (conteos nulos para la coordinación).
- Registro: `POST /auth/register` (`RegisterRequest`: email, password, fullName) → `AuthService.register` crea `USER` con el cupo inicial y emite tokens. `/auth/**` es público (`PublicPaths`). El frontend (`RegisterForm`, `registerSchema`) muestra los errores del servidor con un toast.
- Documento: `DocumentType` (DNI 8 dígitos, carné 9, pasaporte 6–12) con su regla `accepts`; el paciente valida tipo y número juntos (`PatientFields`), con paridad en Zod (`DOCUMENT_PATTERNS`).
- No hay endpoint de perfil propio: la sesión solo trae `UserResponse(id, email, role, fullName)`.

## Goals / Non-Goals

**Goals:** código de inscripción por turma, abrir/cerrar la inscripción, registro con código opcional que deja al alumno en su turma, datos opcionales del alumno (celular, documento, COP) en el registro y en "Mis datos", y su lectura por el ADMIN.

**Non-Goals:** enlace de invitación, código de coordinación, edición de datos por el ADMIN, datos obligatorios, cupo por turma, límite de registros por IP (ver proposal).

## Decisions

### Datos (`V19`)
```sql
ALTER TABLE cohorts ADD COLUMN registration_code CHAR(8);
ALTER TABLE cohorts ADD COLUMN registration_open BOOLEAN NOT NULL DEFAULT TRUE;
-- código para las turmas existentes (alfabeto sin 0/O/1/I), uno por fila
DO $$ DECLARE r RECORD; BEGIN
  FOR r IN SELECT id FROM cohorts LOOP
    UPDATE cohorts SET registration_code = (
      SELECT string_agg(substr('ABCDEFGHJKLMNPQRSTUVWXYZ23456789', 1 + floor(random() * 32)::int, 1), '')
      FROM generate_series(1, 8)) WHERE id = r.id;
  END LOOP; END $$;
ALTER TABLE cohorts ALTER COLUMN registration_code SET NOT NULL;
ALTER TABLE cohorts ADD CONSTRAINT ux_cohorts_registration_code UNIQUE (registration_code);
ALTER TABLE cohorts ADD CONSTRAINT ck_cohorts_registration_code CHECK (registration_code ~ '^[A-HJ-NP-Z2-9]{8}$');

ALTER TABLE users ADD COLUMN phone VARCHAR(9);
ALTER TABLE users ADD COLUMN document_type VARCHAR(20);
ALTER TABLE users ADD COLUMN document_number VARCHAR(12);
ALTER TABLE users ADD COLUMN cop_number VARCHAR(6);
ALTER TABLE users ADD CONSTRAINT ck_users_phone CHECK (phone IS NULL OR phone ~ '^9[0-9]{8}$');
ALTER TABLE users ADD CONSTRAINT ck_users_document CHECK ((document_type IS NULL) = (document_number IS NULL));
ALTER TABLE users ADD CONSTRAINT ck_users_document_type CHECK (document_type IS NULL OR document_type IN ('DNI', 'FOREIGNER_CARD', 'PASSPORT'));
ALTER TABLE users ADD CONSTRAINT ck_users_cop CHECK (cop_number IS NULL OR cop_number ~ '^[0-9]{1,6}$');
```
- El código se guarda normalizado (8 caracteres, sin guion); se muestra como `XXXX-XXXX`. 32⁸ ≈ 10¹² combinaciones: adivinar uno por fuerza bruta no es práctico, aunque el registro aún no tiene límite por IP (pendiente de la auditoría).
- Generación en el servicio con `SecureRandom` y el mismo alfabeto; ante la violación de `ux_cohorts_registration_code` (improbable) se reintenta hasta 3 veces.
- Documento con el `DocumentType` existente (sin enum nuevo). Tipos de texto, nunca numéricos (ceros a la izquierda).
- Sin unicidad de documento ni de COP: dos cuentas de la misma persona son un caso de soporte, no un error del registro.

### Registro
- `RegisterRequest` suma `cohortCode`, `phone`, `documentType`, `documentNumber`, `copNumber` (todos opcionales). Bean Validation de formato (celular, COP, documento tipo+número juntos con `accepts`) con mensajes por campo → `400 ValidationProblem`.
- `AuthService.register`, en la misma transacción: normaliza el código (mayúsculas, sin espacios ni guiones); si viene, busca la turma por código → no existe: `400 /errors/invalid-cohort-code` ("El código de turma no es válido."); cerrada: `400 /errors/cohort-registration-closed` ("La turma ya no acepta inscripciones."). Las dos comprobaciones van antes de crear la cuenta; el correo duplicado sigue siendo `409`.
- Frontend: los dos `type` se pintan junto al campo "Código de turma" (`setError`), no en un toast; el resto de errores sigue igual.

### Turmas (ADMIN)
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/cohorts` | ADMIN: suma `registrationCode` y `registrationOpen`; COORDINATOR: siguen nulos |
| POST | `/api/cohorts/{id}/registration-code` | ADMIN: genera un código nuevo y devuelve la turma |
| PATCH | `/api/cohorts/{id}/registration` | ADMIN: `{ open: boolean }` |
- Crear turma genera el código y nace abierta. La asignación manual (`PATCH /api/users/{id}/cohort`) ignora el estado de la turma.
- Diálogo "Turmas": por fila, código con "Copiar código" (`navigator.clipboard`, aviso "Código copiado"), "Nuevo código" (confirmación con `AlertDialog`) y "Cerrar inscripción"/"Abrir inscripción", con `IconAction`; badge "Inscripción abierta"/"Cerrada".

### Mis datos
| Método | Ruta | Rol | Qué hace |
|---|---|---|---|
| GET | `/api/me/profile` | autenticado | nombre, correo, rol, celular, documento, COP de la propia cuenta |
| PUT | `/api/me/profile` | autenticado | reemplaza celular, documento y COP (vacío = quitar) |
- El id sale del token (nunca de la URL): no hay forma de pedir los datos de otra cuenta. Mismo DTO de validación que el registro (un record compartido `ContactFields`).
- Frontend: sección `profile` en `core/config/sections.ts` (`/mis-datos`, todos los roles), ítem "Mis datos" en el menú, `ProfileFeature` con react-hook-form + schema Zod compartido con el registro (`modules/users/schemas/contact.ts`).

### Usuarios
- `UserSummaryResponse` suma `phone`, `documentType`, `documentNumber`, `copNumber`.
- `UserRowAction` suma "Ver datos" (`IdCard`) para toda cuenta; abre un `Dialog` de solo lectura con celular, documento ("DNI 74125896", con `formatDocument`) y COP, o "Sin registrar".

### Formulario de registro
- Tras contraseña: "Código de turma (opcional)" con ayuda "Te lo da tu institución. Sin código te registras como alumno individual." Luego un bloque "Datos del alumno (opcional)": celular, tipo y número de documento, COP. Errores junto a cada campo.

## Risks / Trade-offs

- **Código compartido fuera de la turma**: cualquiera con el código entra a la turma (y la coordinación lo vería). Mitigación: el ADMIN cierra la inscripción al terminar y puede generar un código nuevo; además puede quitar la turma a una cuenta desde "Usuarios".
- **Sin límite de intentos en el registro**: adivinar un código es impracticable (10¹²), pero el registro abierto sigue sin rate limit; queda en la lista de la auditoría.
- **Datos personales**: celular y documento son datos personales. Solo los ven la propia cuenta y el ADMIN (no la coordinación), no aparecen en logs, y la copia de seguridad ya va cifrada.
- **Migración de turmas existentes**: el `DO` asigna código a las turmas creadas antes de V19; el `CHECK` y el índice único la protegen (con unas pocas turmas, una colisión es despreciable y haría fallar la migración en vez de duplicar).
