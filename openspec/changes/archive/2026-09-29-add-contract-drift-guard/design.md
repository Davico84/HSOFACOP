## Context

- `contracts/openapi.json` se exporta hoy a mano (`curl -o` con el backend levantado, `docs/backend.md §10.2`) y se formatea como `JSON.stringify(doc, null, 2) + "\n"` (así lo escribió el export y así lo reescribe `pnpm project:apply`).
- `codegen-drift` (CI del frontend) cubre contrato → cliente. Backend → contrato no tiene guardián; `ContractDriftIT` solo existe en los docs.
- Tests de integración: `AbstractIntegrationTest` (Testcontainers, PostgreSQL singleton), `@SpringBootTest` + `@AutoConfigureMockMvc`, clases `*IT` ejecutadas por failsafe en `verify` (skip limpio sin Docker).
- Classpath: Jackson 3 (`tools.jackson`, el de Spring Boot 4) y Jackson 2 (vía Flyway). springdoc expone `/v3/api-docs`; con MockMvc `servers[0].url` es `http://localhost` (sin puerto), distinto del `http://localhost:8080` versionado.

## Goals / Non-Goals

**Goals:** fallar el build si el contrato versionado no refleja el backend; regenerarlo sin levantar la app; sin cambios de formato espurios; CI también cuando solo cambia el contrato.

**Non-Goals:** resto de tests de contrato de `testing.md §6`, documentar errores en el contrato.

## Decisions

### D1. `ContractDriftIT` = `@SpringBootTest` + MockMvc sobre el backend real
`src/test/java/com/odontorisas/contract/ContractDriftIT.java`, extiende `AbstractIntegrationTest` (misma infraestructura que `AuthControllerIT`; contexto real con Flyway y seguridad, así el documento es el que servirá producción). `GET /v3/api-docs` → `JsonNode`.
*Alternativa descartada*: `springdoc-openapi-maven-plugin` (arranca la app con `spring-boot:start`, frágil en Boot 4 y lento); o un test sin BD (`@WebMvcTest`) — no carga todo el contexto que alimenta springdoc.

### D2. Comparación semántica normalizada (revisión de Codex)
Antes de comparar, ambos documentos pasan por `ContractJson.normalize`:
- se elimina `servers` (depende del host/puerto de quien exporta; no es contrato de la API);
- **números** con semántica JS (el archivo lo escribe `JSON.stringify`): se leen como `double` y se normalizan a `BigDecimal.valueOf(d).stripTrailingZeros()` → `1` = `1.0`, `-0` = `0`;
- **arrays con semántica de conjunto** se ordenan: `required` y `tags` (en cualquier nivel). El resto de arrays (`parameters`, `security`, `enum`, `oneOf`…) **conserva su orden**: forma parte del snapshot (springdoc es determinista; el ensayo de CI en Linux contra un contrato exportado en Windows prueba la estabilidad entre SO).
Luego se comparan como árboles (el orden de claves de objeto no importa). Si difieren, el mensaje lista las **rutas JSON que difieren** (recorrido recursivo, primeras 20: p. ej. `paths./auth/login.post`, `components.schemas.RegisterRequest.properties.phone`) y el comando de regeneración.

### D3. Modo actualización: `-Dcontract.update=true`
Si la propiedad de sistema `contract.update` es `true`, el test **escribe** `contracts/openapi.json` con el documento publicado (conservando el `servers` del archivo existente) y pasa. Maven propaga las `-D` de línea de comandos a la JVM de failsafe.
- Ruta del archivo: `../../contracts/openapi.json` relativa al directorio de trabajo de failsafe (`modules/backend`), resuelta a ruta absoluta y verificada (si no existe, error claro).
- **Formato idéntico a `JSON.stringify(doc, null, 2) + "\n"`** mediante un serializador propio con reglas **explícitas** (el pretty printer de Jackson usa `" : "`, otra indentación y hex en mayúsculas):
  - objetos/arrays con 2 espacios, `"clave": valor`, `{}`/`[]` vacíos, orden de claves tal cual;
  - strings: escapa `"` y `\`; `\b \f \n \r \t` cortos; resto de controles `< 0x20` como `\u00xx` (minúsculas); surrogates sueltos como `\udxxx`; todo lo demás literal (incluidos `/`, acentos, emoji y U+2028/U+2029);
  - números como JS `Number.prototype.toString`: valor `double` (p. ej. `123456789012345678` → `123456789012345680`), `-0` → `0`, entero sin decimales, exponente para `|x| ≥ 1e21` o `< 1e-6` (`1e+21`, `1e-7`);
  - `true`/`false`/`null`.
  - **Prueba de oro**: `src/test/resources/contract/stringify-fixture.json` (casos límite) y `stringify-expected.json` **generado con Node `JSON.stringify`**; `ContractJsonTest` exige salida byte a byte idéntica.
- **Comando exacto** (fijado en tareas, `template.yml` y docs):
  - comprobar solo el contrato: `./mvnw -B verify -Dit.test=ContractDriftIT -Dtest=none -Dsurefire.failIfNoSpecifiedTests=false`
  - regenerarlo: el mismo + `-Dcontract.update=true`; después `pnpm generate:api` en el frontend.

### D4. CI
- `backend.yml`: añadir `contracts/**` a los `paths` (push y pull_request): editar el contrato a mano también debe pasar por `ContractDriftIT`.
- `template.yml` (ensayo): tras `project:apply` con "Acme CRM", sustituir `verify -DskipITs` por dos pasos: `./mvnw -B test` (unitarios, incluido `ContractJsonTest`) y el comando del guardián (`-Dtest=none` evita repetir los unitarios). Demuestra que el apply deja backend (`app.name`/`app.description`) y contrato alineados.

### D5. Tests del guardián (el guardián también se prueba)
- **`ContractJsonTest`** (unit, sin Docker, corre en `test`):
  - serializador: salida byte a byte = `stringify-expected.json` (Node) para `stringify-fixture.json`;
  - comparación: path añadido/eliminado → diferencia con su ruta; propiedad de schema cambiada → su ruta; solo `servers` distinto, `1` vs `1.0`, `-0` vs `0`, `required`/`tags` reordenados, orden de claves distinto → **igual**; `parameters` reordenado → diferencia.
- **`ContractDriftIT`** (necesita Docker, corre en `verify`), un test por Scenario:
  - "Exposición en runtime" y "Restricciones de validación" (ya existentes, ahora automatizados): `/v3/api-docs` → 200 con las operaciones de registro/login/refresco; `RegisterRequest` con `format: email`, `minLength`/`maxLength` y `required`;
  - "Contrato alineado con el backend": documento publicado == `contracts/openapi.json` (normalizados).
- **Verificación de la implementación** (tareas): `verify` con **`Skipped: 0`** y `ContractDriftIT` presente en `failsafe-reports`; "Contrato desactualizado" probado también a mano (borrar un `path` → falla con la ruta; cambiar solo `servers`/formato → verde); "Snapshot": `-Dcontract.update=true` sobre el contrato actual → archivo byte a byte idéntico.

## Risks / Trade-offs

- [Orden de arrays en el documento de springdoc] → `required`/`tags` se normalizan; el resto forma parte del snapshot y el ensayo de CI (Linux vs contrato exportado en Windows) vigila su estabilidad.
- [El IT necesita Docker] → igual que los demás `*IT`; en local sin Docker se salta limpio (y `verify` "verde" no prueba nada: `testing.md §5`).
- [Regenerar el contrato con cambios reales sin regenerar el cliente] → el mensaje de fallo y los docs indican `pnpm generate:api`; `codegen-drift` lo detecta en CI.

## Migration Plan

Sin datos. Merge = activo. Rollback = revertir el PR.
