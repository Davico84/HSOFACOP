## Why

Swagger UI y `/v3/api-docs` están **siempre públicos**, también en producción: cualquiera sin sesión puede listar todas las operaciones, sus DTOs, sus validaciones y sus errores. Para una plantilla que se copia a proyectos reales, el valor por defecto tiene que ser el seguro. `docs/backend.md` decía "Swagger habilitado por perfil", pero no hay perfiles (§12) y nunca se implementó.

## What Changes

- Un solo interruptor por entorno, **`SWAGGER_ENABLED`**, gobierna `springdoc.api-docs.enabled` y `springdoc.swagger-ui.enabled`. **Por defecto `false`**: un despliegue que no lo configure no expone la documentación.
- En local se activa desde `secrets.properties` (`secrets.properties.example` lo trae a `true`).
- Los tests de contrato (`ContractDriftIT`, `OpenApiContractIT`, `OpenApiTransversalErrorsIT`) lo activan de forma explícita; el resto de la suite corre con el valor por defecto.
- Con el interruptor apagado, `/v3/api-docs` y `/swagger-ui.html` responden `404` (no existen), aunque sigan en `PublicPaths`.
- Sin cambios en `contracts/openapi.json` ni en el frontend (el codegen lee el archivo versionado, no el backend).

## Non-goals

- Proteger Swagger con autenticación o rol en producción (opción futura si se quiere exponerlo a un equipo).
- Introducir perfiles de Spring (`application-*.yml`): la configuración sigue siendo única con placeholders (`docs/backend.md` §12).
- Tocar `PublicPaths` según el interruptor: con la documentación apagada las rutas no existen y responden `404`; hacerlas privadas solo cambiaría `404` por `401`.

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `api-type-contracts`: MODIFIED "Especificación OpenAPI publicada y versionada" — la exposición en runtime pasa a depender de `SWAGGER_ENABLED` (apagada por defecto); el snapshot y su export no cambian.

## Impact

- **Backend**: `application.yml` (`springdoc.*.enabled: ${SWAGGER_ENABLED:false}`), `secrets.properties.example`.
- **Tests**: los 3 IT de contrato con `@TestPropertySource(properties = "SWAGGER_ENABLED=true")`; nuevos `ApiDocsExposureIT` (apagado explícito → `404`) y `ApiDocsDefaultTest` (default `false` en `application.yml`); Swagger UI encendida en `OpenApiContractIT`; casos de tooling en `scripts/project`.
- **Tooling**: comprobar que `pnpm project:setup`/`project:apply` conservan `SWAGGER_ENABLED` al escribir `secrets.properties`.
- **Docs**: `docs/backend.md` §5 y §12, `docs/tooling-setup.md` (cómo verla en local), `docs/vision.md`.
- **Aviso local**: quien ya tenga un `secrets.properties` sin `SWAGGER_ENABLED` dejará de ver Swagger hasta añadir la línea.
