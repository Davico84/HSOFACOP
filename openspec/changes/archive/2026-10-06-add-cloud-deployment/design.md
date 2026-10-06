## Context

- `add-cold-start-warmup` dejó el backend listo para dormir/despertar y documentó en `docs/deployment.md` la condición de la cookie: frontend y API en el mismo *site*. Se eligió Vercel Hobby porque sus rewrites externos esperan hasta 120 s (Netlify corta a 26 s).
- Render no tiene runtime nativo de Java: servicios Java = **Docker**. Free: 512 MB, 0,1 CPU, puerto en `PORT` (por defecto 10000). Su health check debe responder en ~5 s.
- Hoy:
  - `server.port` no está configurado (8080 fijo);
  - `httpClient.ts` usa `import.meta.env.VITE_API_URL ?? "http://localhost:8080"`;
  - `vite.config.ts` define un `BACKEND_URL` que nadie lee;
  - las páginas de acceso son `/auth/login` y `/auth/register`, las mismas rutas que `POST /auth/login` y `POST /auth/register` de la API.
- Seguridad: refresh token en cookie `HttpOnly; Secure; SameSite=Lax; Path=/auth`; CSRF deshabilitado por esa cookie. CORS con orígenes exactos y credenciales.
- `project.config.json` vive en la raíz del repo y el build del frontend lo lee (`../../project.config.json`).
- Flujo de ramas: trabajo en `dev`, PR a `main` con el CI en verde (`mvn verify`, que incluye los IT, y `pnpm validate`), merge del usuario.

## Goals / Non-Goals

**Goals:** publicar gratis, reproducible desde el repo (Dockerfile + `render.yaml` + `vercel.json`), sin secretos versionados, con la sesión funcionando tras recargar y el arranque en frío cubierto en la ruta crítica (login, refresh).

**Non-Goals:**
- dominio propio;
- entornos de staging;
- sesión en las previews de Vercel;
- copias de seguridad (`add-database-backups`);
- observabilidad o alertas;
- optimizar el arranque (CDS/AOT), salvo que la medición lo exija.

## Decisions

### Producción = `main`
- Render: `branch: main` y autodeploy **solo con los checks del CI en verde** (`autoDeployTrigger: checksPass` en el blueprint; se confirma el nombre del campo contra la documentación de Render al aplicar). Si no estuviera disponible: `autoDeploy` normal sobre `main` + protección de rama en GitHub (merge solo con checks en verde).
- Vercel: rama de producción `main`. Los pushes a `dev` generan *previews* (solo frontend, sin sesión por CORS: deliberado).
- `dev` nunca se despliega a producción; se promueve con el PR.

### Imagen del backend
- `modules/backend/Dockerfile`, multi-etapa:
  1. `eclipse-temurin:25-jdk`: copia `mvnw`, `.mvn/` y `pom.xml`, `./mvnw -q dependency:go-offline` (capa cacheable), copia `src/` y empaqueta con `./mvnw -q -DskipTests package`. Las pruebas no se repiten aquí: el deploy sale de `main`, que solo recibe merges con `mvn verify` en verde;
  2. `eclipse-temurin:25-jre`: copia **solo** el jar (`target/*.jar` → `/app/app.jar`, verificado que es el ejecutable de Spring Boot, no el `-plain`), usuario sin privilegios y `ENTRYPOINT ["java","-jar","/app/app.jar"]`.
- Imagen final sin fuentes, `mvnw`, `.mvn/` ni `secrets.properties`. `.dockerignore`: `secrets.properties`, `target/`, `.env*`, `compose.yaml`.
- Etiquetas `25-jdk`/`25-jre`: son móviles (reciben parches de seguridad, que se quieren). Riesgo documentado; fijar por digest queda como mejora si un parche rompe algo.
- JVM para 512 MB: `JAVA_TOOL_OPTIONS` por defecto en la imagen `-XX:MaxRAMPercentage=70 -XX:+UseSerialGC -Xss512k -XX:+ExitOnOutOfMemoryError`. Valores **iniciales** que se ajustan con la medición local (`docker run -m 512m --cpus 0.1`); Render puede sobreescribirlos.
- `server.port: ${PORT:8080}`.
- **Arranque con 0,1 CPU (medido al aplicar)**: la primera imagen arrancaba en **~294 s** con 512 MB y 0,1 CPU (14 s con 1 CPU): superaba los 120 s del proxy de Vercel. Medidas:
  - solo C1 (`-XX:TieredStopAtLevel=1`): ~120 s;
  - **AOT cache de Java 25** (JEP 483/514/515) + C1 + **G1 explícito**: **~54 s** (~66 s con las 14 migraciones desde cero; liveness a los ~77 s del contenedor), 290–295 MiB.

  El cache se crea en el build con una corrida de entrenamiento que arranca el contexto y sale tras el refresh (`spring.context.exit=onRefresh`), sin base (Flyway apagado, Hibernate sin metadatos JDBC), en la **misma imagen JRE** de ejecución (el cache exige el mismo build de la JVM) y con las mismas opciones de GC y heap. G1 explícito porque con < 2 CPU la JVM elige SerialGC y no puede cargar el heap archivado. **Sin código nativo en el cache** (`-XX:-AOTAdapterCaching -XX:-AOTStubCaching`): el primer deploy en Render falló con `SIGILL` en un `AdapterBlob` porque Render construye y ejecuta en máquinas con CPU distinto; sin adapters/stubs el arranque medido es ~40 s (las clases enlazadas aportan la mejora). Costo: C1 da menos rendimiento sostenido que C2, irrelevante con este tráfico. La imagen usa el jar extraído (`app.jar` + `lib/`), como recomienda Spring Boot.
- **Prueba local**: sobre HTTP la cookie `Secure` no vuelve al servidor, así que la verificación local cubre arranque, memoria, migración y liveness. Si se prueba login/refresh en local por HTTP, con `COOKIE_SECURE=false`. La sesión real se verifica en el despliegue (HTTPS).

### Blueprint de Render (`render.yaml`, raíz)
- `type: web`, `runtime: docker`, `plan: free`, `region: ohio`, `branch: main`, `rootDir: modules/backend`, `dockerfilePath: ./Dockerfile`, `healthCheckPath: /actuator/health/liveness`.
- `envVars`:
  - fijas: `HEALTH_SHOW_DETAILS=never`, `SWAGGER_ENABLED=false`, `COOKIE_SECURE=true`;
  - con `sync: false`: `DB_URL`, `DB_USERNAME`, `DB_PASSWORD`, `JWT_SECRET`, `CORS_ALLOWED_ORIGINS`.
- El health check de Render **no** reemplaza al monitor externo ni prueba la ruta crítica.

### Frontend en Vercel
- **`vercel.json` en la raíz** (Root Directory = raíz del repo), así el build ve `project.config.json` y el `pnpm-lock.yaml` sin opciones del panel:
  ```json
  {
    "installCommand": "pnpm install --frozen-lockfile",
    "buildCommand": "pnpm --filter odontorisas-frontend build",
    "outputDirectory": "modules/frontend/dist",
    "framework": null,
    "rewrites": [
      { "source": "/api/:path*",  "destination": "https://<servicio>.onrender.com/api/:path*" },
      { "source": "/auth/:path*", "destination": "https://<servicio>.onrender.com/auth/:path*" },
      { "source": "/(.*)",        "destination": "/index.html" }
    ]
  }
  ```
  Los rewrites solo aplican cuando no hay un archivo estático con esa ruta (assets de `dist`). `vercel.json` no interpola variables: la URL de Render va literal (no es secreta) y se completa al crear el servicio. `/actuator/*` **no** se expone por el frontend.
- **Páginas de acceso en `/ingresar` y `/registro`**: `/auth/*` queda solo para la API y el proxy no necesita distinguir por método ni por `Accept`.
  - Se cambian `PATHS.LOGIN` y `PATHS.REGISTER` y las rutas literales en los tests unitarios y E2E.
  - `isAuthPath` de `httpClient.ts` mira rutas de la **API** (`/auth/login`, `/auth/register`, `/auth/refresh`) y no cambia.
  - Sin redirecciones desde las rutas viejas: nunca se publicaron.
  - Descartado: rewrite con `has` sobre `Accept`. Funciona en Vercel, pero es una heurística: un cliente que pida HTML a la API iría a `index.html`.
- **URL base del cliente**: `resolveApiBaseUrl({ VITE_API_URL, DEV })` en `core/config/apiBaseUrl.ts`: si hay `VITE_API_URL`, se usa; si no, `http://localhost:8080` en desarrollo y `""` en producción. Se quitan el `define BACKEND_URL` y su `declare`; `.env.example` documenta `VITE_API_URL`; los tests de MSW siguen con `*/…`.

### CORS con el proxy
- Vercel reenvía `Origin: https://<app>.vercel.app`; el backend (host `onrender.com`) lo trata como petición entre orígenes.
- `CORS_ALLOWED_ORIGINS` = **origen exacto** de producción, sin `/` final ni comodines (p. ej. `https://hs-facop.vercel.app`).
- Primer despliegue: Render se crea antes que Vercel, con `CORS_ALLOWED_ORIGINS=https://pendiente.invalid`. Al tener el dominio de Vercel, se actualiza en el panel de Render (redeploy automático).
- Previews de Vercel: sin sesión (deliberado); sirven para revisar la interfaz sin autenticación.

### Primer ADMIN
- Registrarse en la app desplegada y, de inmediato, en el SQL Editor de Neon:
  ```sql
  UPDATE users SET role = 'ADMIN' WHERE email = '<correo>' AND status = 'ACTIVE';
  ```
  Debe afectar **1 fila**; si no, revisar el correo antes de seguir.
- El registro es público por diseño (cupo inicial 1); promover la cuenta enseguida evita una ventana sin administrador.

### Matriz de verificación del despliegue
| Área | Prueba | Esperado |
|---|---|---|
| Rutas | recargar `/ingresar`, `/registro`, `/historias` | la app (no el backend) |
| Rewrites | `POST /auth/login` y `POST /auth/refresh` desde la app | `200` vía Vercel → Render |
| Cookie | tras login, `Set-Cookie` del dominio de Vercel, `Path=/auth`, `Secure`, `HttpOnly`, `SameSite=Lax` | presente |
| Sesión | recargar con sesión (Chrome y Safari/iOS) | sigue con sesión |
| CORS | refresh vía proxy | `200`, no `403` |
| Actuator | liveness / health / info en Render | `200 UP` / sin detalle / `401` |
| Arranque en frío | tras 20 min sin monitor: abrir la app, login, recargar | pantalla de espera → login y refresh OK; tiempo total medido |
| Contacto | enlaces de WhatsApp y correo | abren lo esperado |
| Smoke E2E | `E2E_BASE_URL=<url> playwright test e2e/auth.smoke.spec.ts` | verde |

## Risks / Trade-offs

- **512 MB con Java 25 + Hibernate + Flyway**: medido ~295 MiB con 512 MB de límite; holgura suficiente.
- **AOT cache y etiquetas móviles**: si la imagen base cambia, el cache se regenera en el mismo build (no se versiona), así que no queda desfasado.
- **Arranque con 0,1 CPU**: puede superar el minuto. La pantalla de espera lo cubre y el proxy de Vercel espera hasta 120 s; si se pasa, "Está tardando" con Reintentar.
- **Health check de Render (~5 s)**: liveness responde al instante una vez arrancado; durante el arranque Render espera a que el puerto abra.
- **Etiquetas móviles de las imágenes base**: un parche podría romper el build; se fija por digest si pasa.
- **Free tiers cambian**: cifras con fecha en `docs/deployment.md`.
