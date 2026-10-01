## Context

- El único indicio de "listo" es `Started OdontorisasApplication in N seconds` (log de Spring), entre muchas líneas.
- `app.name` (identidad visible) lo escribe `pnpm project:setup` en `application.yml`; `ProjectProperties` ya lo enlaza.
- Swagger se gobierna con `springdoc.swagger-ui.enabled` (`${SWAGGER_ENABLED:false}`, change `update-api-docs-exposure`).
- El puerto puede ser el por defecto (8080), otro configurado o aleatorio en tests (`local.server.port`).

## Goals / Non-Goals

**Goals:** un aviso visible, correcto (puerto real) y sin datos sensibles; lógica testeable sin arrancar el servidor.

**Non-Goals:** ver `proposal.md` (`server.address`, `banner.txt`, frontend).

## Decisions

### D1. `ApplicationReadyEvent`, no `ApplicationStartedEvent`
`ApplicationReadyEvent` se publica después de los `ApplicationRunner`/`CommandLineRunner`, cuando la app ya atiende peticiones: el aviso no puede adelantarse a un fallo tardío del arranque.
*Alternativa descartada*: `WebServerInitializedEvent` (el servidor escucha, pero la app aún no terminó de arrancar).

### D2. Formateador puro + listener fino
- `StartupReadyBanner.render(String appName, int port, String contextPath, boolean swaggerEnabled)` → `List<String>` (líneas). Puro: sin Spring, sin logger; es lo que se testea a fondo.
- `@Component StartupReadyBanner` con `@EventListener(ApplicationReadyEvent.class)`: lee del `Environment` **solo** `app.name`, `local.server.port`, `server.servlet.context-path` y `springdoc.swagger-ui.enabled` (como `Boolean`, default `false`) y escribe el bloque en una sola entrada `log.info`. No lee ninguna otra propiedad: así el aviso no puede filtrar secretos por construcción.
- Si `local.server.port` no está (app sin servidor web, p. ej. un contexto de test sin web), no escribe nada.

### D3. Formato
```
============================================================
  >> Mi Proyecto API lista en http://localhost:8080
    Swagger UI: http://localhost:8080/swagger-ui.html
============================================================
```
Con Swagger apagado: `Swagger UI: desactivado (activa con SWAGGER_ENABLED=true)`. Host fijo `localhost` (es un aviso para quien desarrolla; el servidor puede escuchar en más interfaces). **Solo ASCII** (`>>`): en la prueba manual el `✔` salía como `?` en la consola de Windows. El bloque se escribe en **una sola entrada de log** que empieza con salto de línea: el prefijo del logger (fecha, hilo, clase) sale una vez y las líneas del aviso quedan limpias y alineadas debajo.

### D4. Tests
- **`StartupReadyBannerTest`** (unit): formato con Swagger on/off, puerto distinto de 8080, context-path (`/api` → `http://localhost:8080/api` y `…/api/swagger-ui.html`), context-path vacío o `/`; bloque delimitado.
- **Listener** (unit, `MockEnvironment` + `OutputCaptureExtension`): con `local.server.port` escribe el bloque; sin él, nada; con `app.security.jwt.secret` y `spring.datasource.password` definidos en el entorno, la salida **no** los contiene.

## Risks / Trade-offs

- [Consola sin UTF-8 muestra mal símbolos] → ocurrió con `✔` (salía `?`): el aviso es solo ASCII y un test lo fija.
- [En tests de contexto completo (`MockMvc`, sin servidor real) no hay `local.server.port`] → el listener no escribe nada; no ensucia la salida de los tests.

## Migration Plan

Sin datos ni configuración nueva. Rollback = revertir el PR.
