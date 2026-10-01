> Backend (tests) + CI + docs. Sin cambios en código de producción. Revisado por Codex.
> Comando del guardián: `./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false` (+ `-Dcontract.update=true` para regenerar).

## 1. Utilidad de contrato (unit, D2–D3)

- [x] 1.1 Fixture de oro: `src/test/resources/contract/stringify-fixture.json` + `stringify-expected.json` generado con Node `JSON.stringify(…, null, 2) + "\n"`
- [x] 1.2 `ContractJson.normalize`: sin `servers`, números como double → `BigDecimal` normalizado, `required`/`tags` ordenados
- [x] 1.3 `ContractJson.diff`: rutas JSON que difieren (primeras 20)
- [x] 1.4 `ContractJson.stringify`: formato `JSON.stringify` con reglas explícitas (escapes, surrogates, números JS)
- [x] 1.5 `ContractJsonTest`: serializador = fixture de oro byte a byte; diff detecta path añadido/eliminado y propiedad cambiada; iguales con `servers`, `1`/`1.0`, `-0`/`0`, `required`/`tags` reordenados, orden de claves; `parameters` reordenado → diferencia

## 2. `ContractDriftIT` (D1, D5)

- [x] 2.1 "Exposición en runtime": `/v3/api-docs` 200 con registro/login/refresco
- [x] 2.2 "Restricciones de validación reflejadas en el contrato": `RegisterRequest` con `format: email`, longitudes y `required`
- [x] 2.3 "Contrato alineado con el backend" / "Contrato desactualizado respecto al backend": compara normalizado; si difiere, falla con rutas + comando; modo `-Dcontract.update=true` escribe el archivo (conservando `servers`) y pasa

## 3. Verificación del guardián

- [x] 3.1 `./mvnw -B verify`: verde, `Skipped: 0`, `ContractDriftIT` presente en `target/failsafe-reports`, `git diff` vacío
- [x] 3.2 Manual: borrar temporalmente un `path` del contrato → falla con esa ruta; cambiar solo `servers`/formato → verde; restaurar
- [x] 3.3 "Snapshot": comando del guardián + `-Dcontract.update=true` sobre el contrato actual → archivo byte a byte idéntico

## 4. CI (D4)

- [x] 4.1 `backend.yml`: `contracts/**` en los `paths` ("Cambio solo en el contrato")
- [x] 4.2 `template.yml`: el ensayo sustituye `verify -DskipITs` por `./mvnw -B test` + el comando del guardián

## 5. Docs y cierre

- [x] 5.1 `docs/testing.md §6`: `ContractDriftIT` + `ContractJsonTest` + `codegen-drift` existen; `ProblemDetailsTest`, `ErrorContractIT`, `OpenApiErrorsConfigTest`, `OpenApiContractIT` marcados como pendientes
- [x] 5.2 `docs/backend.md §10.2`: regenerar con el comando del guardián + `-Dcontract.update=true` (sustituye al `curl -o`) + `pnpm generate:api`
- [x] 5.3 `docs/tooling-setup.md`: ensayo de `template.yml` con el guardián; `backend.yml` también por `contracts/**`
- [x] 5.4 `openspec validate add-contract-drift-guard --strict`
