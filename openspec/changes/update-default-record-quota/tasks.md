> Solo backend (sin contrato ni frontend). Commits separados por scope (docs/commits.md).

## 1. Backend

- [x] 1.1 `RecordsProperties` (`app.records.default-quota`, `Integer`, `@Min(0) @Max(9999)`, `@Validated`) y `application.yml` con `${RECORDS_DEFAULT_QUOTA:1}`; `secrets.properties.example` documenta la variable
- [x] 1.2 `AuthService.register` asigna el cupo inicial a la cuenta nueva
- [x] 1.3 Perfil de test con el cupo inicial vacío (los IT existentes siguen sin límite); tests nuevos: registro con cupo inicial 1 (`0 de 1` en el listado de usuarios, primera historia OK y segunda `409` con el mensaje en singular), con 3 y vacío; cuentas existentes intactas; revisar los E2E con backend (`*.backend.spec.ts`) por si crean más de una historia por usuario nuevo; `mvn verify` verde

## 2. Docs y cierre

- [x] 2.1 `docs/vision.md`: estado 🚧 del change
- [ ] 2.2 Al archivar — `docs/domain.md` (cupo inicial de cuentas nuevas) y `docs/vision.md` ✅
