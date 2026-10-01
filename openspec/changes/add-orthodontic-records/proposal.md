## Why

La historia clínica de ortodoncia de FACOP/ARO se llena hoy **a mano** sobre un PDF de 14 páginas (`docs/pdf/HISTORIA CLINICA PARA MODULO ORTODONCIA.pdf`): letra difícil de leer, campos que se repiten, nada se puede buscar ni reimprimir y una corrección obliga a rehacer la hoja. Esta es la primera capacidad de negocio del producto: llenar la historia desde un formulario por pasos, guardarla y **imprimirla con mejor presentación** respetando la estructura y los logos del PDF.

## What Changes

**Fase 1 (este change)** — las secciones de texto y selección del PDF:

- Nueva entidad **historia clínica de ortodoncia** persistida en PostgreSQL, con los datos del paciente embebidos (nombre, documento DNI / carné de extranjería / pasaporte, sexo, fecha y lugar de nacimiento, domicilio, celular), número de historia correlativo por tratante (`AEO-001`, `AEO-002`…), odontólogo tratante y fecha de inicio de tratamiento.
- **Formulario de varias páginas (wizard)** con un paso por bloque del PDF:
  1. Paciente y anamnesis (pág. 1)
  2. Análisis facial (pág. 2)
  3. Análisis funcional (pág. 3)
  4. Análisis oclusal + extra (págs. 3–4)
  5. Análisis radiográfico (pág. 10)
  6. Diagnóstico y planes (págs. 11–13: diagnóstico general, lista de problemas, metas, planes, secuencia, próximas etapas, plan final)
  7. Firmas (fecha y nombres de paciente, supervisores y tratante; la firma sigue siendo manuscrita sobre el papel)
- Los "____" con opciones del PDF (p. ej. *Mesofacial / Dolicofacial / Braquifacial*, *Presenta / No presenta*) pasan a **selección** (única o múltiple según el caso) con nota libre donde el PDF deja líneas.
- **Guardado como borrador**: la historia se crea con el nombre del paciente y se guarda al avanzar/retroceder de paso; se puede reabrir y seguir editando. Aviso si se intenta salir con cambios sin guardar. Conflicto de edición concurrente detectado (no se pisan cambios).
- **Listado "Historias clínicas"** paginado con búsqueda por paciente, documento o número.
- **Vista de impresión** A4 (imprimir / "Guardar como PDF" del navegador): logos ARO/FACOP, mismos títulos y orden que el PDF, valores en lugar de las líneas, opciones con la elegida marcada, campos vacíos como línea en blanco para completar a mano y salto de página por sección.
- **Acceso**: cada `USER` (tratante) ve y edita solo sus historias; `ADMIN` (supervisor) ve y edita todas. Sin borrado.
- Edad calculada a partir de la fecha de nacimiento (no se teclea).

**Fases siguientes (changes aparte, no en este):**
- `add-orthodontic-model-analysis`: análisis transversal de modelos (pág. 5), Moyers (pág. 6), Nance (pág. 7) y Bolton (pág. 9) con cálculos automáticos.
- `add-orthodontic-progress-notes`: notas de evolución (pág. 14) con fecha, trabajo realizado y docente.

## Non-goals

- Tablas de análisis de modelos (transversal, Moyers, Nance, Bolton) y sus cálculos → fase 2.
- Notas de evolución → fase 3.
- Fotografías y radiografías adjuntas (el PDF pide adjuntarlas impresas; siguen en papel).
- Firma digital o electrónica: la impresión deja el espacio para firmar a mano.
- Registro maestro de pacientes reutilizable entre historias (los datos van embebidos en la historia; un `patients` propio se evaluará cuando haya más de una historia por paciente).
- Borrado de historias, flujo de aprobación del supervisor, estados (borrador/cerrada) y auditoría de cambios campo a campo.
- PDF generado en el servidor.

## Capabilities

### New Capabilities
- `orthodontic-records`: crear, editar por pasos, listar/buscar e imprimir la historia clínica de ortodoncia (fase 1: secciones de texto y selección), con acceso por autor y `ADMIN`.

### Modified Capabilities
<!-- Ninguna: la sección nueva del menú se declara en core/config/sections.ts sin cambiar los requirements de app-shell. -->

## Impact

- **Backend**: entidad + migración Flyway `V8__orthodontic_records.sql`, repositorio con `Specification` de búsqueda, `service.records`, `OrthodonticRecordsController` (`/api/orthodontic-records`), DTOs con Bean Validation, `@PreAuthorize`, bloqueo optimista (`@Version`, docs/backend.md §8.3).
- **Contrato**: `contracts/openapi.json` + cliente orval regenerados (`generated/orthodontic-records.ts`), en commit aparte.
- **Frontend**: módulo `modules/records` (schemas Zod, hooks React Query, pasos del wizard, vista de impresión), pantallas `screens/records`, sección `records` en `core/config/sections.ts`, logos ARO/FACOP como assets.
- **Docs**: `docs/vision.md` (estado de capacidades), `docs/domain.md` al archivar (entidad nueva + actores tratante/supervisor).
- Sin dependencias nuevas.
