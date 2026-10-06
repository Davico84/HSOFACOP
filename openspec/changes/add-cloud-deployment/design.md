## Context

- `add-cold-start-warmup` dejó el backend listo para dormir/despertar y documentó en `docs/deployment.md` la condición de la cookie: frontend y API en el mismo *site*. Se eligió Vercel Hobby porque sus rewrites externos esperan hasta 120 s (Netlify corta a 26 s).
- Render no tiene runtime nativo de Java: servicios Java = **Docker**. Free: 512 MB, 0,1 CPU, puerto en `PORT` (por defecto 10000).
- Hoy:
  - `server.port` no está configurado (8080 fijo);
  - `httpClient.ts` usa `import.meta.env.VITE_API_URL ?? "http://localhost:8080"`;
  - `vite.config.ts` define un `BACKEND_URL` que nadie lee, y `.env.example` documenta ese y no el real.
- Seguridad: refresh token en cookie `HttpOnly; Secure; SameSite=Lax; Path=/auth`; CSRF deshabilitado por esa cookie. CORS con `app.security.cors.allowed-origins` y credenciales.
- `project.config.json` vive en la raíz del repo (fuera de `modules/frontend`), y el build del frontend lo lee.

## Goals / Non-Goals

**Goals:** publicar gratis, reproducible desde el repo (Dockerfile + blueprint + `vercel.json`), sin secretos versionados, con la sesión funcionando tras recargar y el arranque en frío cubierto.

**Non-Goals:**
- dominio propio;
- CI/CD de despliegue más allá de lo que Render y Vercel hacen al hacer push (autodeploy);
- copias de seguridad (`add-database-backups`);
- observabilidad o alertas;
- optimizar el arranque (CDS/AOT), salvo que la medición lo exija.

## Decisions

### Imagen del backend
- `modules/backend/Dockerfile`, multi-etapa:
  1. `eclipse-temurin:25-jdk`: copia `mvnw`, `.mvn/` y `pom.xml`, hace `./mvnw -q dependency:go-offline` (capa cacheable), luego copia `src/` y empaqueta con `./mvnw -q -DskipTests package` (las pruebas corren en el CI, no en el build de Render);
  2. `eclipse-temurin:25-jre`: copia solo el jar y corre como usuario sin privilegios.
- Sin `secrets.properties` en la imagen: `.dockerignore` excluye `secrets.properties`, `target/` y `.env*`, y `spring.config.import` ya es `optional:`. Toda la configuración llega por variables de entorno.
- JVM para 512 MB: `JAVA_TOOL_OPTIONS` por defecto en la imagen `-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError`. SerialGC por la CPU mínima y la memoria. Render puede sobreescribirlas. Valores **iniciales**: se ajustan con la medición (tarea de verificación local con `docker run -m 512m --cpus 0.1`, que aproxima Render Free).
- `server.port: ${PORT:8080}`: Render inyecta `PORT`; en local sigue el 8080.
- Contexto de build = `modules/backend` (el backend no lee `project.config.json` en runtime: `app.name`/`app.description` ya están escritos en `application.yml`).

### Blueprint de Render (`render.yaml`, raíz)
- `type: web`, `runtime: docker`, `plan: free`, `rootDir: modules/backend`, `dockerfilePath: ./Dockerfile`, `healthCheckPath: /actuator/health/liveness`, región `ohio`, `autoDeploy` en `main`.
- `envVars`:
  - fijas: `HEALTH_SHOW_DETAILS=never`, `SWAGGER_ENABLED=false`, `COOKIE_SECURE=true`;
  - con `sync: false` (Render las pide al crear y no se versionan): `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`.
- El health check de Render **no** reemplaza al monitor externo (`docs/deployment.md`).

### Frontend en Vercel, API en el mismo origen
- `modules/frontend/vercel.json`. El orden importa: primero la API, al final la SPA.
  ```json
  {
    "rewrites": [
      { "source": "/api/:path*",  "destination": "https://<servicio>.onrender.com/api/:path*" },
      { "source": "/auth/:path*", "destination": "https://<servicio>.onrender.com/auth/:path*" },
      { "source": "/(.*)",        "destination": "/index.html" }
    ]
  }
  ```
  `vercel.json` no interpola variables: la URL de Render va literal (no es secreta) y se completa al crear el servicio. `/actuator/*` **no** se expone por el frontend: el monitor pega directo a Render.
- **Colisión de rutas**: la SPA usa `/auth/login` y `/auth/register` como páginas, y la API usa `/auth/login`, `/auth/register`, `/auth/refresh` y `/auth/logout` (POST). Con un rewrite `/auth/:path*` a Render, un **GET** de navegación a `/auth/login` (recargar la página o abrir el enlace) iría al backend, que no tiene esa página. Opciones:
  - a) rewrite solo para métodos no-GET: `vercel.json` no filtra por método;
  - b) mover la API de auth a `/api/auth/*`: cambio de contrato y de la cookie (`Path`), más amplio;
  - c) **mover las páginas de la SPA a otra ruta** (`/ingresar`, `/registro`) con redirección desde las viejas: cambio solo de frontend;
  - d) rewrite con `has`/`missing` sobre el header `accept: text/html`: las navegaciones del navegador piden HTML y axios pide JSON.

  **Decisión: d)**. Una regla `/auth/:path*` → `index.html` cuando el `Accept` incluye `text/html`, **antes** de la regla hacia Render; el resto de `/auth/*` (axios, `Accept: application/json`) va a Render. No cambia contrato, cookie ni rutas. Se valida con un test de `vercel.json` (orden y condiciones) y en el despliegue (recargar `/auth/login` muestra la página; el refresh funciona). Si `has` sobre headers no se comporta como esperado en Vercel, se cae a **c)**.
- **URL base del cliente**: `resolveApiBaseUrl({ VITE_API_URL, DEV })` en `core/config/apiBaseUrl.ts`: si hay `VITE_API_URL`, se usa; si no, `http://localhost:8080` en desarrollo y `""` (mismo origen) en producción. Se prueba con valores explícitos.
  - Se quitan el `define BACKEND_URL` y su `declare` (sin lectores).
  - Los tests de MSW siguen con `*/…`.
  - `.env.example` documenta `VITE_API_URL`.
- **Build en Vercel**: Root Directory `modules/frontend`, framework Vite, `pnpm install` en la raíz del monorepo y `pnpm build`. La opción "Include files outside the root directory" (activa por defecto) da acceso a `project.config.json`; se verifica en el primer build.

### CORS con el proxy
- Vercel reenvía `Origin: https://<app>.vercel.app` y el backend lo ve como petición entre orígenes (su host es `onrender.com`). Con `CORS_ALLOWED_ORIGINS=https://<app>.vercel.app` pasa; sin eso, `403`.
- No se relaja la configuración: un solo origen exacto. Las *preview deployments* de Vercel (otros subdominios) no tendrán sesión; se acepta: se prueba en la URL de producción.

### Primer ADMIN
- Registrarse en la app desplegada y promover la cuenta en el SQL Editor de Neon: `UPDATE users SET role = 'ADMIN' WHERE email = '<correo>';`. Documentado; sin endpoint de bootstrap.

## Risks / Trade-offs

- **512 MB con Java 25 + Hibernate + Flyway**: puede no alcanzar. Mitigación: medir con `-m 512m` antes de subir y ajustar la JVM. Si no entra, se evalúa CDS/AOT cache de Java 25 o recortar (en otro change).
- **Arranque con 0,1 CPU**: puede superar el minuto. La pantalla de espera lo cubre y el proxy de Vercel espera hasta 120 s; si se pasa, el usuario ve "Está tardando" con Reintentar.
- **`has` por header en Vercel**: si no distingue bien, se cambia a la opción c) (rutas de la SPA). El test de `vercel.json` fija la intención y el checklist lo prueba en vivo.
- **Free tiers cambian**: cifras con fecha en `docs/deployment.md`.
- **Build de Maven en Render**: sin caché entre builds del plan gratuito puede tardar varios minutos; aceptable.
