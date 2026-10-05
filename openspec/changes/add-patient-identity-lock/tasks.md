> Commits separados por scope (docs/commits.md): backend · contracts + cliente · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `V14__record_patient_lock.sql` (`patient_locked_at TIMESTAMPTZ NULL`), `OrthodonticRecord.patientLockedAt`, `RecordResponse.patientLockedAt`
- [ ] 1.2 `POST /{id}/print` (autor o ADMIN, idempotente, fija con el `Clock`) y `DELETE /{id}/patient-lock` (solo ADMIN, `204`)
- [ ] 1.3 `update` rechaza cambios de nombre, documento o fecha de nacimiento (normalizados) con la identidad fijada: `PatientLockedException` → `409 /errors/patient-locked` solo con `detail`
- [ ] 1.4 Tests: controller (403 de desbloqueo para USER, 404 ajena, 409 con su tipo) e IT de cada scenario (corregir antes, primera impresión fija, cambio rechazado sin guardar, domicilio/clínico libres y reimpresión, desbloqueo y re-fijado, historia anterior desbloqueada, espacios sobrantes no disparan 409); `operationId` en `OpenApiContractIT`; regenerar contrato; `mvn verify` verde

## 2. Contrato y cliente

- [ ] 2.1 `contracts/openapi.json` regenerado y `pnpm generate:api`

## 3. Frontend

- [ ] 3.1 Vista preliminar: "Imprimir" registra la impresión y luego abre el diálogo; error → toast con reintentar; `data-print-ready` + CSS que oculta las hojas al imprimir sin el botón y muestra el aviso
- [ ] 3.2 Marca de avance en `PrintPage` (pasos clínicos con datos de la historia guardada; sin marca si está completa), posicionada sin mover el contenido
- [ ] 3.3 Formulario: campos de identidad bloqueados con aviso cuando están fijados; "Desbloquear paciente" para el ADMIN (con confirmación); manejo del `409 patient-locked`
- [ ] 3.4 Tests Vitest de los scenarios (botón registra antes de imprimir, error sin diálogo, marca de avance con N correcto y sin marca si completa, Firmas no cuenta, campos bloqueados, desbloqueo ADMIN, 409) y verificación con Edge headless + PyMuPDF: sin el botón sale solo el aviso; con el botón, 13 hojas con las mismas posiciones con y sin marca; `pnpm validate` verde

## 4. Docs y cierre

- [x] 4.1 `docs/vision.md`: estado 🚧 del change
- [ ] 4.2 Al archivar — `docs/domain.md` (`OrthodonticRecord.patientLockedAt` y la regla) y `docs/vision.md` ✅
