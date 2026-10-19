> Rama `change/add-password-change-reset` desde `main`, PR a `main` (docs/commits.md §5b). Toca back y front: commits por scope (backend · contrato/frontend · docs). Antes del front, skill `frontend-guard`.

## 1. Backend

- [x] 1.1 `V20`: `password_reset_tokens` (hash único, vencimiento, uso, quién lo generó); entidad y repositorio
- [x] 1.2 Cambiar la contraseña: `PUT /api/me/password` en `ProfileController`; `AuthService.changePassword` sin transacción larga (bloqueada → `password-change-locked`; actual incorrecta → `recordFailure` + `wrong-current-password`; igual → `same-password`); éxito: hash nuevo, revocar sesiones, quitar el contador y sesión nueva con su cookie
- [x] 1.3 Generar el enlace: `POST /api/users/{id}/password-reset` (ADMIN) con la fila bloqueada; borra los no usados de la cuenta; `409 password-reset-not-applicable` para ADMIN o deshabilitada; devuelve token y vencimiento (24 h)
- [x] 1.4 Restablecer: `POST /auth/password-reset` público; token por hash con bloqueo de fila; inexistente, usado, vencido o cuenta deshabilitada → `400 invalid-password-reset`; éxito: hash nuevo, `used_at`, revocar sesiones y quitar el bloqueo
- [x] 1.5 Tests: migración; cambio (correcto, actual incorrecta suma intento, bloqueada sin comparar, igual a la actual, corta, 401, otros dispositivos no renuevan y el actual sí); enlace (generar, nuevo anula el anterior, ADMIN/deshabilitada 409, 403 para otros roles, nunca en claro en la base); restablecer (válido, quita el bloqueo, usado, vencido, anulado, inexistente, corta); `mvn verify` en verde

## 2. Contrato y frontend

- [ ] 2.1 Regenerar `contracts/openapi.json` (`-Dcontract.update=true`) y el cliente orval; `OpenApiContractIT` y `ContractDriftIT` en verde
- [ ] 2.2 "Mis datos": bloque "Cambiar contraseña" (schema Zod en `modules/auth/schemas`, errores del servidor en su campo, sesión nueva al éxito)
- [ ] 2.3 Usuarios: acción "Restablecer contraseña" (no disponible en deshabilitadas), confirmación y diálogo del enlace con copiar y vencimiento
- [ ] 2.4 Página pública `/restablecer`: token del fragmento (quitado de la barra), nueva contraseña con confirmación, enlace no válido y vuelta al login con aviso
- [ ] 2.5 Tests (uno por scenario de la UI): cambio (correcto, actual incorrecta en el campo, igual/corta en cliente); restablecer desde Usuarios (confirmar y copiar, cancelar no genera); página (válido va al login, no válido, sin token, corta); `pnpm validate` en verde

## 3. Docs

- [ ] 3.1 `docs/domain.md`: enlace de restablecimiento y reglas de cambio de contraseña

## Workflow follow-up

- Al archivar: `docs/vision.md` ✅ y specs sincronizadas.
