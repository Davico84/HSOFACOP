> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V14__record_patient_lock.sql` (`patient_locked_at`, `patient_unlocked_at`, `patient_unlocked_by` FK, `unlock_requested_at`, `unlock_request_reason VARCHAR(200)`), entidad; `RecordResponse` (`patientLockedAt`, `lastUnlock`, `unlockRequest`) y `RecordSummaryResponse.patientLocked`
- [ ] 1.2 `POST /{id}/print` (autor o ADMIN, idempotente, fija con el `Clock`); `DELETE /{id}/patient-lock` (solo ADMIN, `204`, registra quién y cuándo, cierra la solicitud; sin fijar → `409`); `POST /{id}/unlock-request` (autor, motivo ≤ 200; `409` sin fijar o ya pendiente) y `DELETE /{id}/unlock-request` (solo ADMIN, idempotente); `GET /api/dashboard/admin` con `unlockRequests` (hasta 10 + total, más antiguas primero)
- [ ] 1.3 `update` rechaza cambios de nombre, documento o fecha de nacimiento (normalizados) con la identidad fijada: `PatientLockedException` → `409 /errors/patient-locked` solo con `detail`
- [ ] 1.4 Tests: controller (403 de desbloqueo y descarte para USER, 404 ajena, 409 con su tipo, 400 de motivo) e IT de cada scenario (corregir antes, primera impresión fija —también un avance—, cambio rechazado sin guardar, domicilio/clínico libres y reimpresión, desbloqueo con quién/cuándo y re-fijado, último desbloqueo, solicitar/repetida/sin fijar/descartar/desbloquear cierra, candado en el listado, solicitudes en el dashboard del ADMIN, historia anterior desbloqueada, espacios sobrantes no disparan 409); `operationId` en `OpenApiContractIT`; regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [ ] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 Vista preliminar: "Imprimir" registra la impresión y luego abre el diálogo; error → toast con reintentar; `data-print-ready` + CSS que oculta las hojas al imprimir sin el botón y muestra el aviso
- [ ] 3.2 Marca de avance en `PrintPage` (pasos clínicos con datos de la historia guardada; sin marca si está completa), posicionada sin mover el contenido
- [ ] 3.3 Formulario: campos de identidad bloqueados con aviso cuando están fijados y último desbloqueo; "Solicitar desbloqueo" (Dialog con motivo) y estado de solicitud pendiente para el tratante; "Desbloquear paciente" (con confirmación) y "Descartar solicitud" para el ADMIN; manejo del `409 patient-locked`
- [ ] 3.4 Candado en el listado (tabla y tarjetas) y `UnlockRequestsList` en Inicio del ADMIN; invalidar dashboard y detalle al desbloquear/descartar/solicitar
- [ ] 3.5 Tests Vitest de los scenarios (botón registra antes de imprimir, error sin diálogo, marca de avance con N correcto y sin marca si completa, Firmas no cuenta, campos bloqueados, último desbloqueo, solicitar y pendiente, desbloqueo y descarte del ADMIN, candado en el listado, solicitudes en Inicio, 409) y verificación con Edge headless + PyMuPDF: sin el botón sale solo el aviso; con el botón, 13 hojas con las mismas posiciones con y sin marca; `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [ ] 4.2 Al archivar — `docs/domain.md` (`OrthodonticRecord.patientLockedAt` y la regla) y `docs/vision.md` ✅
