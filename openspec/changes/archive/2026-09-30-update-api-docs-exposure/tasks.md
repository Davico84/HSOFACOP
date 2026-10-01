> Solo backend + config + tooling tests + docs. Sin cambios en `contracts/openapi.json` ni frontend. Revisado por Codex.
> Los `*IT` necesitan Docker: verificar `Skipped: 0`. Ningún test depende de la ausencia de `SWAGGER_ENABLED` (D4).

## 1. Configuración (D1)

- [x] 1.1 `application.yml`: `springdoc.api-docs.enabled` y `springdoc.swagger-ui.enabled` = `${SWAGGER_ENABLED:false}`
- [x] 1.2 `secrets.properties.example`: `SWAGGER_ENABLED=true` con comentario (false o ausente en despliegue)

## 2. Tests (D2, D4)

- [x] 2.1 `@TestPropertySource(properties = "SWAGGER_ENABLED=true")` en `ContractDriftIT`, `OpenApiContractIT` y `OpenApiTransversalErrorsIT`
- [x] 2.2 `ApiDocsExposureIT` con `SWAGGER_ENABLED=false` explícito: `/v3/api-docs` y `/swagger-ui.html` → 404, `/v3/api-docs.yaml` → 401 (no pública, D3); `/auth/login` sigue respondiendo
- [x] 2.3 `ApiDocsDefaultTest` (unit): `application.yml` declara `${SWAGGER_ENABLED:false}` en las dos propiedades
- [x] 2.4 `OpenApiContractIT`: "Swagger UI disponible al habilitarla" (`/swagger-ui.html` sirve la UI)
- [x] 2.5 Mutación: `ContractDriftIT` con `SWAGGER_ENABLED=false` falla con 404; restaurar
- [x] 2.6 Tooling (`node --test`): `apply` conserva `SWAGGER_ENABLED=false` en un `secrets.properties` existente; `setup` transporta `SWAGGER_ENABLED=true` desde el `.example`
- [x] 2.7 `./mvnw -B verify` verde, `Skipped: 0`, `contracts/openapi.json` sin cambios; tests de `scripts/project` verdes

## 3. Docs y cierre

- [x] 3.1 `docs/backend.md` §5 (Swagger por `SWAGGER_ENABLED`, apagado por defecto) y §12 (la variable en la lista de configuración)
- [x] 3.2 `docs/tooling-setup.md`: cómo ver Swagger en local (`SWAGGER_ENABLED=true` en `secrets.properties`) y aviso para `secrets.properties` existentes sin la clave
- [x] 3.3 Prueba manual: con `SWAGGER_ENABLED=true` en local, `/swagger-ui.html` abre; con `false`, 404
- [x] 3.4 `openspec validate update-api-docs-exposure --strict`
