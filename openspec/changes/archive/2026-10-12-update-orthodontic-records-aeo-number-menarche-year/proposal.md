## Why

Dos ajustes pedidos por el usuario tras el uso real:

1. **Número de historia**: el prefijo correcto de la escuela es **AEO**, no AOC. Hoy el sistema exige `AOC-0001` y las historias en producción ya están numeradas así (p. ej. `AOC-0018`).
2. **Primera menstruación**: en la anamnesis solo se registra el **año**, no la fecha completa. Pedir día y mes obliga a inventarlos.

## What Changes

- **Número**: formato `AEO-` + exactamente cuatro dígitos (`AEO-0001` a `AEO-9999`), en la validación del backend y del frontend, en la restricción de la base, en los mensajes ("Usa el formato AEO-0001") y en los ejemplos. `AOC-0015` pasa a ser inválido.
- **Migración de los números existentes**: `AOC-nnnn` → `AEO-nnnn` (mismos dígitos), también en el texto de búsqueda. Como los dígitos no cambian y eran únicos, no puede haber choques. No cambia la versión de la historia (no es una edición del usuario).
- **Primera menstruación**: el campo pasa de fecha (`menarcheDate`) a **año** (`menarcheYear`, número de cuatro cifras). Reglas: no futuro (año actual en la zona horaria de la app) ni anterior al año de nacimiento; sin fecha de nacimiento solo se exige que no sea futuro. Sigue condicionado a sexo femenino y respuesta "Sí". En pantalla, un campo numérico de año; en la hoja impresa, "Año:".
- **Migración del contenido**: las fechas guardadas pasan a su año (`15/03/2023` → `2023`); `schemaVersion` 8 → 9.
- **BREAKING (contrato)**: `Anamnesis.menarcheDate` (string fecha) se reemplaza por `menarcheYear` (entero). El frontend se regenera con orval; no hay otros clientes.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `orthodontic-records`: "Crear una historia clínica de ortodoncia", "Número de historia", "Corrección del número de historia", "Listado y búsqueda de historias" (ejemplos y formato AEO; escenario de migración) y "Secciones clínicas de la fase 1" (año de la primera menstruación).

## Impact

- Backend: `CreateRecordRequest`/`UpdateRecordRequest` (`@Pattern`), entidad, `Anamnesis`, `PatientFields` (validación del año), `RecordNormalizer`, migración Flyway `V16`, tests (`TestRecordNumbers`, ITs, validación).
- Contrato `contracts/openapi.json` y código generado (orval).
- Frontend: schema Zod (`record.ts`), `Step1Patient`, `PrintPatientSection`, fixtures y tests; E2E `e2e/support/recordNumber.ts`.
- Docs: `docs/domain.md` (formato del número y anamnesis, `schemaVersion` 9).
- Producción: al desplegar, la migración renumera las historias existentes (AOC-0018 → AEO-0018) y convierte las fechas de menarquia a año.

### Non-goals

- Cambiar la unicidad, la corrección del número o el resto de la anamnesis.
- Aceptar los dos prefijos a la vez.
