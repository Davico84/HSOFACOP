# Despliegue en planes gratuitos

Guía para correr HS FACOP en la nube **sin costo**: frontend en **Vercel** (Hobby), backend en
**Render** (Free, Docker) y base de datos en **Neon** (Free). Lo versionado: `vercel.json` y
`render.yaml` (raíz) y `modules/backend/Dockerfile` (`add-cloud-deployment`); el ping y la base que
duerme vienen de `add-cold-start-warmup`. Pasos: §5; verificación: §6. Producción: frontend `https://hsofacop-frontend.vercel.app`, API `https://hs-facop-api.onrender.com`.

> Cifras de los planes verificadas al proponer `add-cold-start-warmup` (2026-10). Los planes
> gratuitos cambian: revísalas antes de desplegar.

## 1. Backend en Render (Free)

- El servicio **se suspende tras 15 min sin tráfico entrante**; la siguiente petición lo despierta y
  espera el arranque de Spring Boot (**~1 min**). Mientras tanto el frontend muestra la pantalla de
  arranque en frío ("Preparando tu consultorio digital").
- **750 h de instancia al mes por workspace**: alcanzan para **un** servicio despierto 24/7 (hasta 744 h
  en un mes de 31 días, que es lo que gasta el monitor). Un segundo servicio gratuito en el mismo
  workspace no cabe: al pasar las 750 h, Render suspende los servicios hasta el mes siguiente.
- **512 MB de RAM y 0,1 CPU.** En el primer despliegue mide la memoria (RSS) y el tiempo de
  arranque; ajusta la JVM (`JAVA_TOOL_OPTIONS`, p. ej. `-Xmx`) **solo tras medir**.

### Mantenerlo despierto: monitor externo (obligatorio)

Configura un monitor HTTP gratuito (UptimeRobot o cron-job.org):

| Campo | Valor |
|---|---|
| URL | `https://<tu-servicio>.onrender.com/actuator/health/liveness` |
| Método | `GET` |
| Intervalo | **10 min** (menor que los 15 min de inactividad) |
| Esperado | `200` con `"status":"UP"` |

- Usa **liveness**, no `/actuator/health`: liveness **no consulta la base**, así la base puede
  dormir (§2). `/actuator/health` sí la consulta en cada llamada.
- El **health check de Render** puede apuntar a la misma ruta, pero **no sustituye al monitor**:
  Render lo usa para verificar instancias y despliegues, no documenta que evite la suspensión.
- Si el monitor falla o se pausa, el arranque en frío vuelve (con la pantalla de espera).

### Variables del servicio

Las de `modules/backend/secrets.properties.example`, más:

| Variable | Valor en Render |
|---|---|
| `HEALTH_SHOW_DETAILS` | `never` (la ruta de health es pública: sin detalle de BD ni disco) |
| `SWAGGER_ENABLED` | `false` (o ausente) |
| `COOKIE_SECURE` | `true` |
| `CORS_ALLOWED_ORIGINS` | el origen exacto del frontend (si hay CORS; ver §3) |
| `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` | de Neon (§2) |

`DB_POOL_*` ya tienen defaults pensados para Neon; no hace falta definirlas.

## 2. Base de datos en Neon (Free)

- **No caduca** (la PostgreSQL gratuita de Render se borra a los 30 días). Plan Free: ~100 CU-hora
  al mes y 1 GB por proyecto.
- El cómputo **se suspende tras ~5 min sin actividad** y despierta en < 1 s. Dejarla dormir es lo que
  hace alcanzar el cupo de horas; despierta 24/7 lo superaría.
- El backend lo permite: el pool no retiene conexiones ni hace keepalive (`docs/backend.md` §11.1.1)
  y el monitor pega a liveness, que no toca la base.
- **Conexión**: usa la cadena **directa** (sin `-pooler` en el host) con `sslmode=require`:
  `DB_URL=jdbc:postgresql://<host-directo>/<base>?sslmode=require`. El endpoint `-pooler` es
  PgBouncer en modo transacción, que no conserva estado de sesión; Flyway lo necesita para sus locks.
- **Región**: la misma de Render o la más cercana (p. ej. Render Ohio ↔ Neon `us-east-2`); si no,
  cada consulta cruza regiones.
- ⚠️ **"No caduca" no es copia de seguridad.** Un borrado por error o un cambio del plan siguen
  siendo riesgo, y la restauración a un punto anterior del plan gratuito cubre poco tiempo. Las
  copias propias están en §2.1.

### 2.1 Copias de seguridad (`.github/workflows/db-backup.yml`)

**Qué hace.** Todos los días a las 08:00 UTC (03:00 en Lima), y a pedido desde la pestaña *Actions*:

1. `pg_dump` de la base con un rol de **solo lectura**;
2. restauración en una PostgreSQL 16 vacía del propio job, comprobando que la última migración
   del repo (`V<n>`, en orden numérico) está aplicada y que cada tabla de la copia se restauró;
3. cifrado con [`age`](https://age-encryption.org) a una **clave pública**;
4. subida como artifact `db-backup-AAAA-MM-DD` (**90 días** de retención).

Si algo falla, el workflow queda en rojo, no sube nada y GitHub avisa por correo. El volcado sin
cifrar se borra del runner siempre, también cuando falla. **El repo es público**: cualquiera con
cuenta de GitHub puede bajar el artifact, pero sin la clave privada solo obtiene un archivo cifrado.
Los logs no muestran la conexión ni datos.

Sin el secreto y la variable de abajo, la copia se **omite en verde** (p. ej. un proyecto recién
creado desde la plantilla).

La imagen `postgres:16` y las actions van fijadas por digest/SHA (reciben el secreto y el volcado).
Actualizar el digest es un cambio en un PR: `docker buildx imagetools inspect postgres:16`.

#### Configuración (una vez)

1. **Par de claves `age`** en tu PC (Windows: `winget install FiloSottile.age`):
   ```bash
   age-keygen -o backup.key      # imprime la clave pública: "Public key: age1…"
   ```
   `backup.key` es la **clave privada**: **nunca** al repo ni a GitHub. Guárdala en **dos
   lugares** (p. ej. gestor de contraseñas + memoria USB). Sin ella, las copias no sirven.
2. **Rol de solo lectura en Neon** (*SQL Editor*, rama de producción). Neon exige una contraseña
   fuerte para roles creados por SQL (larga y aleatoria):
   ```sql
   CREATE ROLE backup_reader WITH LOGIN PASSWORD '<contraseña larga y aleatoria>';
   GRANT pg_read_all_data TO backup_reader;
   ```
   Si Neon no deja otorgar `pg_read_all_data`, la alternativa:
   ```sql
   GRANT USAGE ON SCHEMA public TO backup_reader;
   GRANT SELECT ON ALL TABLES IN SCHEMA public TO backup_reader;
   GRANT SELECT ON ALL SEQUENCES IN SCHEMA public TO backup_reader;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO backup_reader;
   ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON SEQUENCES TO backup_reader;
   ```
   (`ALTER DEFAULT PRIVILEGES` se ejecuta con el rol dueño de las tablas, el de la app.)
   Comprobación: conectado como `backup_reader`, un `INSERT` debe responder *permission denied*.
3. **GitHub** (la URL es la **directa**, sin `-pooler`, con `sslmode=require`):
   ```bash
   gh secret set BACKUP_DATABASE_URL     # pega: postgresql://backup_reader:<pass>@<host-directo>/<base>?sslmode=require
   gh variable set BACKUP_AGE_RECIPIENT --body "age1…"
   ```
   `gh secret set` pide el valor sin dejarlo en el historial de la terminal.
4. **Probar**: *Actions → DB backup → Run workflow* (o `gh workflow run db-backup.yml`). Debe
   quedar un artifact `db-backup-AAAA-MM-DD`. El workflow solo aparece una vez que está en `main`.

#### Mantenimiento

- **Una vez al mes**, baja la última copia a un disco propio (es el archivo cifrado; se puede
  guardar en cualquier lado). Es lo que cubre más allá de los 90 días y una pérdida de la cuenta.
- **60 días sin actividad**: GitHub desactiva los workflows programados de un repo público (avisa
  por correo antes). Al bajar la copia mensual mira la fecha de la última; si se detuvo, reactívalo
  en *Actions → DB backup → Enable workflow* o con `gh workflow enable db-backup.yml`.
- Una copia al día: se puede perder hasta un día de trabajo. Para errores recientes, primero mira
  la restauración a un punto anterior de Neon (*Branches → Restore*), de ventana corta en Free.

#### Restaurar

Nunca sobre la base de producción en uso: siempre a una base nueva.

1. **Descargar** (o desde la pestaña *Actions*, sección *Artifacts* de la ejecución):
   ```bash
   gh run list --workflow db-backup.yml --limit 5
   gh run download <run-id> --name db-backup-AAAA-MM-DD
   ```
2. **Descifrar**:
   ```bash
   age -d -i backup.key -o db.dump db-backup-AAAA-MM-DD.dump.age
   ```
3. **Restaurar en local** (para revisar o rescatar datos):
   ```bash
   docker run -d --name restore -e POSTGRES_PASSWORD=restore -p 5433:5432 postgres:16
   docker cp db.dump restore:/db.dump
   docker exec restore pg_restore -U postgres -d postgres --no-owner --no-acl /db.dump
   docker exec -it restore psql -U postgres -c "select count(*) from orthodontic_records"
   ```
   o **en una rama nueva de Neon** (*Branches → New branch*), con su cadena de conexión directa:
   ```bash
   pg_restore --no-owner --no-acl --clean --if-exists -d "<url-directa-de-la-rama>" db.dump
   ```
4. **Si hay que reemplazar producción**: apunta `DB_URL`, `DB_USERNAME` y `DB_PASSWORD` de Render a
   la rama restaurada y redespliega. Flyway encuentra su historial y no migra de nuevo.
5. **Borra** `db.dump` al terminar: son datos de salud sin cifrar.

## 3. Condición previa: cookie de sesión entre frontend y API

La sesión se restaura con la cookie de refresh `HttpOnly; Secure; SameSite=Lax; Path=/auth`, y ese
`SameSite=Lax` **es la protección CSRF** del backend (`SecurityConfig`). Si el frontend y la API
quedan en *sites* distintos, el navegador **no envía la cookie** y cada recarga termina en el login.
`*.vercel.app`, `*.netlify.app` y `*.onrender.com` son *sites* distintos entre sí (están en la Public
Suffix List); `withCredentials` y CORS no lo compensan.

**Decisión (`add-cloud-deployment`): mismo origen con el proxy de Vercel.** `vercel.json` (raíz)
reenvía `/api/*` y `/auth/*` a Render; la cookie es de primera parte, `SameSite=Lax` y la protección
CSRF se mantienen. Vercel Hobby espera hasta 120 s en los rewrites externos (Netlify corta a 26 s:
no sirve). Para que `/auth/*` sea solo de la API, las páginas de acceso son `/ingresar` y
`/registro`. Descartadas: dominio propio (costo) y `SameSite=None` (debilita CSRF; Safari bloquea
cookies de terceros).

- **CORS**: Vercel reenvía el `Origin` del navegador, así que `CORS_ALLOWED_ORIGINS` en Render =
  **origen exacto** de producción del frontend, sin `/` final ni comodines
  (`https://<app>.vercel.app`). Si no coincide, el refresh responde `403`.
- **Previews** de Vercel (otras ramas): sin sesión, por diseño (su origen no está permitido).

## 3.1 Contacto de soporte público

`project.config.json` → `contact` (WhatsApp y correo) se muestra en el login, el registro y la espera
larga del arranque, **a cualquiera en internet**: los bots recogen esos datos para spam. Usa un número
y un correo de soporte o institucionales; cambiarlos es editar `project.config.json` y redesplegar
el frontend.

## 4. Imagen del backend (Docker) y arranque medido

`modules/backend/Dockerfile` (contexto `modules/backend`): build con JDK 25, runtime JRE 25 con el jar
extraído, usuario `app` sin privilegios, sin fuentes ni secretos. Incluye un **AOT cache de Java 25**
creado en el build con una corrida de entrenamiento sin base (`spring.context.exit=onRefresh`), y la
JVM con G1 explícito, solo C1 y `MaxRAMPercentage=70`.

Medido en local con los límites de Render Free (`docker run -m 512m --cpus 0.1`, 2026-10-06):

| Imagen | Arranque (Spring) | Memoria |
|---|---|---|
| Sin AOT cache, JIT completo | ~264 s (liveness a los ~294 s) | ~312 MiB |
| Solo C1 | ~120 s | ~225 MiB |
| AOT cache con código nativo + G1 + C1 | ~54 s (~66 s con migraciones) | ~295 MiB — **falla en Render** (SIGILL: ver abajo) |
| **AOT cache solo de clases + G1 + C1 (la que se usa)** | **~40 s** con las 14 migraciones desde cero (liveness a los ~49 s) | **~293 MiB** |
| Referencia: 1 CPU, sin límite de CPU | ~14 s | ~276 MiB |

- **Sin código nativo en el AOT cache** (`-XX:-AOTAdapterCaching -XX:-AOTStubCaching`): Render construye la imagen en una máquina y la ejecuta en otra con otro CPU; el código nativo guardado en el cache usaba instrucciones que la de ejecución no tiene (`SIGILL` en `AdapterBlob`, primer deploy). Las clases cargadas y enlazadas sí son portables y son las que aportan la mejora.
- Las etiquetas `eclipse-temurin:25-jdk`/`25-jre` reciben parches; el AOT cache se regenera en cada
  build, así que no queda desfasado. Si un parche rompiera el build, fijar la imagen por digest.
- **Prueba local**: `docker build -t hsfacop-backend:local modules/backend` y `docker run` con
  `PORT`, `DB_*` y `JWT_SECRET`. Por HTTP la cookie `Secure` no vuelve al servidor: para probar
  login/refresh en local, `COOKIE_SECURE=false`. La sesión real se prueba en el despliegue (HTTPS).

## 5. Puesta en marcha (paso a paso)

Producción = rama **`main`** (Render y Vercel). `dev` llega por PR con el CI en verde.

1. **Neon** — crea un proyecto en `AWS us-east-2` (Ohio). En *Connection details* elige la
   conexión **directa** (sin `-pooler`) y arma
   `DB_URL=jdbc:postgresql://<host>/<base>?sslmode=require`, más `DB_USERNAME` y `DB_PASSWORD`.
2. **Render** — *New → Blueprint*, elige el repo (lee `render.yaml`, servicio `hs-facop-api`, rama
   `main`). Carga:
   - `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` (de Neon);
   - `JWT_SECRET`: `openssl rand -base64 48`;
   - `CORS_ALLOWED_ORIGINS=https://pendiente.invalid` (provisional, paso 4).

   Primer deploy: el log muestra las 14 migraciones y `GET https://<servicio>.onrender.com/actuator/health/liveness` → `200`.
3. **URL de Render en `vercel.json`** — si la URL asignada no es `https://hs-facop-api.onrender.com`,
   corrígela en las dos reglas de `vercel.json` (PR a `main`).
4. **Vercel** — *Add New → Project*, importa el repo. Root Directory = **raíz** (el build lo define
   `vercel.json`), rama de producción `main`, **sin** `VITE_API_URL`. Tras el primer deploy, en
   Render: `CORS_ALLOWED_ORIGINS=https://<app>.vercel.app` (exacto, sin `/` final).
5. **Monitor** — UptimeRobot o cron-job.org a liveness cada 10 min (§1).
6. **Primer ADMIN** — regístrate en `https://<app>.vercel.app/registro` y, enseguida, en el SQL
   Editor de Neon:
   ```sql
   UPDATE users SET role = 'ADMIN' WHERE email = '<tu correo>' AND status = 'ACTIVE';
   ```
   Debe decir **1 fila**. El registro es público por diseño (cupo inicial 1).

## 6. Verificación del despliegue (matriz)

| Área | Prueba | Esperado | Resultado |
|---|---|---|---|
| Rutas | recargar `/ingresar`, `/registro`, `/historias` | la app (no el backend) | ✅ 2026-10-06 (curl y navegador) |
| Rewrites | login y refresh desde la app | `200` vía Vercel → Render | ✅ login y refresh vía Vercel |
| Cookie | tras login: `Set-Cookie` del dominio de Vercel, `Path=/auth`, `Secure`, `HttpOnly`, `SameSite=Lax` | presente | ✅ `hsofacop-frontend.vercel.app`, `/auth`, HttpOnly, Secure, Lax, 7 días |
| Sesión | recargar con sesión (Chrome y Safari/iOS) | sigue con sesión | ✅ Chrome y WebKit (motor de Safari, Playwright; sin dispositivo iOS a mano) |
| CORS | refresh vía proxy | `200`, no `403` | ✅ (sin cookie: `401` de sesión, nunca `403`) |
| Actuator | liveness / health / info en Render | `200 UP` / solo `status` / `401` | ✅ (y `/actuator/*` vía Vercel devuelve la app, no se reenvía) |
| Arranque en frío | 20 min sin monitor: abrir la app, login, recargar | pantalla de espera → entra; tiempo total | ✅ ~1 min hasta el login (2026-10-06) |
| Contacto | enlaces de WhatsApp y correo | abren lo esperado | ✅ |
| Smoke E2E | `E2E_BASE_URL=https://<app>.vercel.app pnpm exec playwright test e2e/auth.smoke.spec.ts` | verde | ✅ 3/3 |
| Memoria en Render | métricas del servicio tras el arranque | < 512 MB | ✅ sin reinicios por memoria (Live desde el deploy, `ExitOnOutOfMemoryError` no saltó). Render Free solo muestra métricas de red; medido en local con 512 MB: ~293 MiB |
| Monitor y ADMIN | UptimeRobot a liveness; primer ADMIN | Up; ve Usuarios | ✅ |
