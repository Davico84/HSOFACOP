## Context

- springdoc 3.0.3 sin configuración propia: `/v3/api-docs` y `/swagger-ui.html` activos siempre, y públicos por `PublicPaths` (`/v3/api-docs/**`, `/swagger-ui/**`, `/swagger-ui.html`).
- Configuración única sin perfiles: `application.yml` con placeholders; en local, `spring.config.import=optional:file:./secrets.properties`; en despliegue, variables de entorno (`docs/backend.md` §12).
- `/v3/api-docs` lo consumen solo los tests de contrato (`ContractDriftIT`, `OpenApiContractIT`, `OpenApiTransversalErrorsIT`), todos `@SpringBootTest` sobre `AbstractIntegrationTest`. El frontend genera el cliente desde `contracts/openapi.json`, no desde el backend.
- `pnpm project:apply` reescribe claves de BD en `secrets.properties.example` (`rules.mjs`, `updateProperties`); `project:setup` escribe el `secrets.properties` local.

## Goals / Non-Goals

**Goals:** documentación apagada por defecto (lo seguro si nadie configura nada); fácil de encender en local; los tests de contrato siguen funcionando sin configuración extra en CI.

**Non-Goals:** ver `proposal.md` (Swagger autenticado, perfiles, `PublicPaths` dinámico).

## Decisions

### D1. Un interruptor, dos propiedades
```yaml
springdoc:
  api-docs:
    enabled: ${SWAGGER_ENABLED:false}
  swagger-ui:
    enabled: ${SWAGGER_ENABLED:false}
```
Un solo nombre de variable para ambas: no tiene sentido servir la UI sin el documento, ni exponer el documento "sin UI" como media medida. Nombre `SWAGGER_ENABLED` (lo que el equipo busca), documentado junto al resto en `secrets.properties.example` con valor `true` y el comentario "false o ausente en despliegue".
*Alternativa descartada*: perfiles (`application-prod.yml`): contradice la configuración única de §12.

### D2. Tests: activación explícita por clase
`@TestPropertySource(properties = "SWAGGER_ENABLED=true")` en los tres IT de contrato (placeholders de Spring resuelven propiedades de cualquier fuente, no solo variables de entorno). Sin tocar `AbstractIntegrationTest`: si se activara ahí, ningún IT podría probar el valor por defecto (`@DynamicPropertySource` tiene precedencia sobre `@TestPropertySource`). Los tres comparten la misma propiedad, así que Spring reutiliza el mismo contexto cacheado entre `ContractDriftIT` y `OpenApiContractIT` (`OpenApiTransversalErrorsIT` ya tiene su propio contexto por el `@Import`).

### D3. `PublicPaths` no cambia
Con la documentación apagada, springdoc no registra sus endpoints: las rutas públicas responden `404` (MVC, con el formato uniforme de error). Hacerlas privadas según el interruptor solo cambiaría `404` por `401` y rompería la regla de una sola lista estática. Si en el futuro se expone la documentación en producción, se decidirá si protegerla (non-goal). Excepción observada al implementar: `/v3/api-docs.yaml` no está en `PublicPaths` (`/v3/api-docs/**` no la cubre, ver `PublicPathsTest`), así que la seguridad responde `401` antes que MVC; tampoco se sirve, que es lo que importa. Con la documentación encendida, la variante YAML sigue siendo privada (el contrato versionado es JSON).

### D4. Tests (herméticos: revisión de Codex)
Los tests también importan `./secrets.properties` (failsafe corre en `modules/backend`) y leen variables de entorno: un desarrollador con `SWAGGER_ENABLED=true` en su archivo haría que un test "sin la propiedad" no probara el default. Por eso **ningún test depende de la ausencia** de la propiedad:
- **Comportamiento apagado** — `ApiDocsExposureIT` con `@TestPropertySource(properties = "SWAGGER_ENABLED=false")` (gana a `secrets.properties` y al entorno): `GET /v3/api-docs`, `/v3/api-docs.yaml` y `/swagger-ui.html` → `404`; una operación normal (`POST /auth/login` con cuerpo vacío → `400`) sigue funcionando.
- **Valor por defecto** — `ApiDocsDefaultTest` (unit, sin Spring): lee `application.yml` del classpath y exige que `springdoc.api-docs.enabled` y `springdoc.swagger-ui.enabled` valgan exactamente `${SWAGGER_ENABLED:false}`. Determinista en cualquier máquina.
- **Comportamiento encendido** — en `OpenApiContractIT` (ya con `SWAGGER_ENABLED=true`): `/v3/api-docs` → `200` (regresión de "Exposición en runtime") y `/swagger-ui.html` sirve la UI (`200` o redirección a `/swagger-ui/index.html`, que responde `200`).
- **Mutación**: cambiar temporalmente la propiedad de `ContractDriftIT` a `SWAGGER_ENABLED=false` (no quitarla: quitarla depende del entorno) → falla con `404`; restaurar.
- **Tooling** — casos nuevos en los tests de `scripts/project` (`node --test`): `project:apply` conserva `SWAGGER_ENABLED=false` en un `secrets.properties` existente; `project:setup` transporta `SWAGGER_ENABLED=true` al crear `secrets.properties` desde el `.example`. Un `secrets.properties` existente **sin** la clave no la gana: es el aviso de migración (docs).
- **Regresión**: los tres IT de contrato verdes; `contracts/openapi.json` sin cambios.

## Risks / Trade-offs

- [Quien ya tiene `secrets.properties` deja de ver Swagger en local] → aviso en el PR y en `docs/tooling-setup.md`: añadir `SWAGGER_ENABLED=true`.
- [Un despliegue que quiera Swagger debe configurarlo] → intencionado; se documenta en §12.
- [Olvidar la propiedad en un IT nuevo que lea `/v3/api-docs`] → falla con `404` al primer intento, visible.

## Migration Plan

Sin datos. Merge = activo. Rollback = revertir el PR (vuelve a ser siempre público).
