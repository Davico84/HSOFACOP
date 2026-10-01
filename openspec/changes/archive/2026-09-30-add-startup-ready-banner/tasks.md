> Solo backend + docs. Sin cambios de API, contrato, frontend ni configuración obligatoria.

## 1. Backend (D1–D3)

- [x] 1.1 `infra.config.StartupReadyBanner.render(appName, port, contextPath, swaggerEnabled)`: líneas del aviso según D3
- [x] 1.2 Listener `@EventListener(ApplicationReadyEvent.class)`: lee solo `app.name`, `local.server.port`, `server.servlet.context-path`, `springdoc.swagger-ui.enabled`; sin puerto no escribe; una sola entrada `log.info` con el bloque (solo ASCII)

## 2. Tests (D4)

- [x] 2.1 `StartupReadyBannerTest`: "Aviso con la URL real" (puerto real, context-path), "Swagger activo", "Swagger desactivado"
- [x] 2.2 Listener con `MockEnvironment` + `OutputCaptureExtension`: escribe con puerto, nada sin puerto; "Sin secretos en el aviso"
- [x] 2.3 `./mvnw -B verify` verde

## 3. Docs y cierre

- [x] 3.1 `docs/tooling-setup.md`: qué aviso buscar al arrancar el backend
- [x] 3.2 Prueba manual: `./mvnw spring-boot:run` muestra el aviso con Swagger on y off (bloque limpio, sin prefijo por línea, y legible en la consola)
- [x] 3.3 `openspec validate add-startup-ready-banner --strict`
