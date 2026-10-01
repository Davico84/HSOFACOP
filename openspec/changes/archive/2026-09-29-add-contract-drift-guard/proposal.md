## Why

El contrato OpenAPI (`contracts/openapi.json`) es la fuente de la que el frontend genera sus tipos y su cliente. Hoy solo se vigila **una** dirección del drift: `codegen-drift` (CI del frontend) comprueba contrato → cliente. La otra, **backend → contrato**, no la vigila nada: si alguien cambia un controller o un DTO y olvida exportar el contrato, el frontend se genera contra una API que ya no existe y nadie se entera hasta producción. `docs/testing.md §6` y `docs/backend.md §10.2` ya describen un guardián `ContractDriftIT`… que en este repo **no existe**. Además, exportar el contrato exige levantar el backend y hacer `curl` a mano.

## What Changes

- **`ContractDriftIT`** (test de integración del backend, corre en `./mvnw verify`): pide `/v3/api-docs` al backend real y lo compara **semánticamente** con `contracts/openapi.json` (ignorando `servers`, que depende del puerto). Si difieren, **falla** indicando qué partes cambiaron y el comando para regenerarlo.
- **Regenerar sin levantar la app**: `./mvnw verify -Dcontract.update=true` (o solo ese test con `-Dit.test=ContractDriftIT`) escribe `contracts/openapi.json` con el documento actual, en el mismo formato que ya tiene (2 espacios, UTF-8, salto final), conservando su `servers`. Sustituye al `curl -o` manual.
- **CI**: el workflow `backend.yml` también se dispara cuando cambia `contracts/**` (editar el contrato a mano también es drift). El ensayo de `template.yml` ejecuta `ContractDriftIT` tras aplicar la identidad de ejemplo (verifica que `project:apply` deja contrato y backend alineados).
- **Docs**: `docs/testing.md §6` refleja lo que existe de verdad (hoy: `ContractDriftIT` + `codegen-drift`; el resto de tests de contrato quedan como pendientes), `docs/backend.md §10.2` y `docs/tooling-setup.md` con el nuevo comando.

## Capabilities

### New Capabilities
_(ninguna)_

### Modified Capabilities
- `api-type-contracts`:
  - **MODIFIED** "Especificación OpenAPI publicada y versionada": el scenario del snapshot pasa a describir el export con `-Dcontract.update=true` (sin levantar la app).
  - **MODIFIED** "Contrato y artefactos generados sincronizados (sin drift)": añade los scenarios de la dirección backend → contrato (`ContractDriftIT`).

## Non-goals

- Los demás tests de contrato que menciona `testing.md §6` (`ProblemDetailsTest`, `ErrorContractIT`, `OpenApiErrorsConfigTest`, `OpenApiContractIT`): se documentan como pendientes; no forman parte de este change.
- Documentar errores (`ApiProblem`, 4xx/5xx) en el contrato.
- Cambiar el formato o el contenido del contrato actual.

## Impact

- **Backend**: nuevo `src/test/java/com/odontorisas/contract/ContractDriftIT.java`. Sin cambios en código de producción.
- **CI**: `.github/workflows/backend.yml` (paths `contracts/**`), `.github/workflows/template.yml` (ensayo ejecuta `ContractDriftIT`).
- **Docs**: `testing.md §6`, `backend.md §10.2`, `tooling-setup.md`.
- `docs/vision.md §3` enlaza el change; `docs/domain.md` no cambia.
