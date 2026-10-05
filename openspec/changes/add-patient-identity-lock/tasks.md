> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`. El backend (sección 1) debe quedar en verde antes de empezar el frontend.

## 1. Backend

- [x] 1.1 `V14__record_patient_lock.sql`: columnas `patient_locked_at`, `unlock_requested_at`, `unlock_request_reason VARCHAR(200)` + índice parcial de pendientes; tabla `record_unlock_events` (acción `UNLOCKED`/`DISCARDED`, FK `RESTRICT`); entidades y `findWithAuthorByIdForUpdate`
- [x] 1.2 `PatientIdentity` (NFKC + sin tildes/mayúsculas/espacios; documento por tipo y dígitos) y rechazo en `update` bajo bloqueo de fila: `PatientLockedException` → `409 /errors/patient-locked`
- [x] 1.3 `printRecord` (bloqueo de fila, primera vez fija sin cambiar la versión, reimpresión idempotente, guarda `filledSteps` si faltaban, responde `printedOn` en la zona del `Clock` y `clinicalFilledSteps`)
- [x] 1.4 `unlockPatient`, `requestPatientUnlock`, `discardPatientUnlockRequest` (bloqueo de fila, condicionales, eventos); `RecordResponse` (`patientLockedAt`, `lastUnlock`, `unlockRequest`) y `RecordSummaryResponse.patientLocked`; `GET /api/dashboard/admin` con `unlockRequests` (hasta 10 + total, más antiguas primero)
- [x] 1.5 Tests (uno por scenario, `Clock.fixed` en `America/Lima`):
  - controller: 403 de desbloquear/descartar para USER, 404 ajena, 400 de motivo, 409 con cada tipo;
  - IT: corregir antes de imprimir; primera impresión fija (también un avance); cambio de cada dato fijo rechazado sin guardar; corregir escritura (mayúsculas, tildes, NFKC, espacios, mismo DNI) permitido; domicilio/teléfono/fecha de inicio/clínico libres y reimpresión idempotente sin cambiar versión; guardado de otra pestaña tras imprimir con otro nombre → 409 patient-locked; impresión concurrente con guardado; historia de autor ADMIN; historia anterior a V14; `filled_steps` nulo calculado al imprimir; `printedOn` en zona de la app; desbloqueo con y sin solicitud y re-fijado; eventos acumulados y último desbloqueo; desbloquear sin fijar → 409; solicitar/repetida/simultáneas/sin fijar/descartar/desbloquear cierra; candado en el listado; solicitudes en el dashboard del ADMIN (vacío, orden, 10 + total);
  - `operationId` (`printRecord`, `unlockPatient`, `requestPatientUnlock`, `discardPatientUnlockRequest`) en `OpenApiContractIT`; regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [x] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 Vista preliminar: "Imprimir" registra (con `filledSteps`) y abre el diálogo; error → toast con reintentar; `data-print-ready` puesto solo tras el registro y quitado en `afterprint`, tras volver `window.print()` y al recuperar el foco; CSS con hojas ocultas por defecto al imprimir y aviso
- [ ] 3.2 Marca de avance en `PrintPage` con `printedOn`/`clinicalFilledSteps` del servidor (vista previa con la fecha de hoy), en posición absoluta sin mover el contenido; sin marca si está completa
- [ ] 3.3 Formulario: datos fijos de solo lectura (sin `disabled` de RHF) con aviso de alcance y último desbloqueo; "Solicitar desbloqueo" (Dialog con motivo) y estado pendiente; "Desbloquear datos del paciente" (confirmación) y "Descartar solicitud" para el ADMIN; manejo del `409 patient-locked`
- [ ] 3.4 Candado en el listado (tabla y tarjetas) y `UnlockRequestsList` en Inicio del ADMIN; invalidar detalle, listado y dashboard al solicitar/desbloquear/descartar
- [ ] 3.5 Tests Vitest de los scenarios (registro antes del diálogo, error sin diálogo, `data-print-ready` se quita al cancelar/terminar, marca con N y fecha del servidor y sin marca si completa, datos fijos de solo lectura, autoguardado conserva los datos fijos en el cuerpo, solicitar/pendiente, desbloquear/descartar del ADMIN, candado, solicitudes en Inicio, 409); verificación con Edge headless + PyMuPDF: Ctrl+P → solo el aviso; con el botón → 13 hojas con las mismas posiciones con y sin marca; `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [ ] 4.2 Al archivar — `docs/domain.md` (datos fijos, forma canónica, eventos de desbloqueo, solicitudes) y `docs/vision.md` ✅
