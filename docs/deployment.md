# Despliegue en planes gratuitos

Guía para correr HS FACOP en la nube **sin costo**: backend en **Render** (Free Web Service), base de
datos en **Neon** (Free) y frontend en un hosting estático. Cubre lo que el código ya resuelve
(`add-cold-start-warmup`) y las **condiciones previas** que aún decide el change de despliegue.

> Cifras de los planes verificadas al proponer `add-cold-start-warmup` (2026-10). Los planes
> gratuitos cambian: revísalas antes de desplegar.

## 1. Backend en Render (Free)

- El servicio **se suspende tras 15 min sin tráfico entrante**; la siguiente petición lo despierta y
  espera el arranque de Spring Boot (**~1 min**). Mientras tanto el frontend muestra la pantalla de
  arranque en frío ("Preparando tu consultorio digital").
- **750 h de instancia al mes por workspace**: alcanzan para **un** servicio despierto 24/7 (~730 h).
  Un segundo servicio gratuito despierto todo el mes no cabe.
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
  copias (`pg_dump` diario fuera de Neon + restauración probada) van en `add-database-backups`.

## 3. Condición previa: cookie de sesión entre frontend y API

La sesión se restaura con la cookie de refresh `HttpOnly; Secure; SameSite=Lax; Path=/auth`, y ese
`SameSite=Lax` **es la protección CSRF** del backend (`SecurityConfig`). Si el frontend y la API
quedan en *sites* distintos, el navegador **no envía la cookie** y cada recarga termina en el login.
`*.vercel.app`, `*.netlify.app` y `*.onrender.com` son *sites* distintos entre sí (están en la Public
Suffix List); `withCredentials` y CORS no lo compensan.

Opciones (decide y prueba el change de despliegue):

1. **Preferida — mismo origen con proxy/rewrite del hosting del frontend** (`/api/*` y `/auth/*`
   hacia Render): la cookie es de primera parte, se mantiene `SameSite=Lax` y no hace falta CORS.
   El proxy debe **esperar el arranque en frío (~60 s)**:
   - **Vercel Hobby**: rewrites externos hasta 120 s → **compatible**.
   - **Netlify**: corta los proxy a los 26 s → **no compatible**.
   - **Render Static Sites**: soporta rewrites externos pero no documenta su timeout → validar con
     una prueba real de 60–90 s antes de elegirlo.
2. **Dominio propio con subdominios** (`app.` y `api.` del mismo dominio): mismo *site*, `Lax`
   funciona; requiere comprar el dominio.
3. **`SameSite=None; Secure` + CORS exacto**: descartada salvo necesidad. Debilita la protección CSRF
   actual (habría que validar `Origin` en `/auth/refresh` y `/auth/logout`) y Safari bloquea por
   defecto las cookies de terceros (iPhone/iPad perderían la sesión al recargar).

**Hasta resolver esto, el sistema no es desplegable de extremo a extremo.**

## 4. Checklist del primer despliegue

- [ ] Neon: proyecto en la región de Render; cadena directa con `sslmode=require` en `DB_URL`.
- [ ] Render: variables de §1; Flyway migra al arrancar.
- [ ] `GET /actuator/health/liveness` → `200 UP`; `GET /actuator/health` sin detalle; `GET /actuator/info` → `401`.
- [ ] Monitor externo cada 10 min a liveness.
- [ ] Frontend en el mismo origen que la API (§3); recargar con sesión iniciada **no** lleva al login (probar también en Safari/iOS).
- [ ] Arranque en frío real: tras 20 min sin monitor, abrir la app → pantalla "Preparando…" y luego entra.
- [ ] Memoria (RSS) y tiempo de arranque medidos en Render.
