## Why

Al arrancar el backend, lo único que indica que está listo es una línea de Spring (`Started OdontorisasApplication in 4.2 seconds`) perdida entre decenas de líneas de log; en terminales integradas (IDE, Antigravity) cuesta ver cuándo ya se puede usar. Además, desde que Swagger está **apagado por defecto** (`SWAGGER_ENABLED`), quien no lo vea puede pensar que la app está rota: el arranque debería decir si la documentación está activa y dónde.

## What Changes

- Cuando la aplicación termina de arrancar (`ApplicationReadyEvent`), el backend escribe **un aviso destacado** en el log con:
  - el nombre del proyecto (`app.name`, el que escribe `pnpm project:setup`);
  - la URL base con el **puerto real** (y el context-path si lo hay);
  - el estado de Swagger UI: su URL si está activo, o `desactivado (SWAGGER_ENABLED=false)`.
- El aviso se escribe con el logger normal (nivel `INFO`), así llega a consola y a cualquier destino de log configurado.
- **Nunca** incluye secretos ni valores de configuración sensibles.

## Non-goals

- Limitar en qué interfaces escucha el servidor (`server.address` / `SERVER_ADDRESS=127.0.0.1`): es una decisión de red aparte.
- Cambiar el banner ASCII de Spring (`banner.txt`) ni el formato del log.
- Avisos equivalentes en el frontend (Vite ya muestra su URL).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
- `project-foundation`: ADDED "Aviso de backend listo al arrancar".

## Impact

- **Backend**: nuevo `infra.config.StartupReadyBanner` (listener de `ApplicationReadyEvent`) y su formateador puro.
- **Tests**: unitarios del formateador (Swagger on/off, context-path, puerto) y del listener (sin secretos en la salida).
- **Docs**: `docs/tooling-setup.md` (qué buscar al arrancar), `docs/vision.md`.
- Sin cambios de API, contrato, frontend ni configuración obligatoria.
