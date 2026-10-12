## Context

- Render Free: el servicio se suspende tras **15 min sin tráfico entrante** y la siguiente petición lo despierta (arranque medido en Render: **64 s**). Cupo: **750 h de instancia al mes por workspace**, compartido por todos sus servicios gratuitos; al agotarse, Render suspende los servicios hasta el mes siguiente.
- Antes: UptimeRobot llamaba a `/actuator/health/liveness` cada 10 min, siempre (~744 h en un mes de 31 días).
- El frontend (Vercel) muestra la pantalla de arranque en frío mientras espera la primera respuesta (`add-cold-start-warmup`).
- La copia de seguridad diaria (03:00 Lima) se conecta a Neon, no a Render.
- Lo operativo ya se hizo y se verificó desde el repo de Dentdesk (`Davico84/Odontorisas`, `docs/deployment.md` §3 y `.github/workflows/wake-up.yml`). Este change lo deja documentado aquí.

## Goals / Non-Goals

**Goals:** que la guía de HSO refleje el horario, el presupuesto compartido, quién despierta el servicio y qué hacer si algo falla.

**Non-Goals:** código, `Dockerfile`, `render.yaml`, cambios en el repo de Dentdesk.

## Decisions

### Horario: lunes a sábado, 9:00–21:00 (America/Lima)
Decisión del usuario (2026-10-11). Perú no tiene horario de verano: no hay corrimientos.

### Mantener despierto: cron-job.org
- Job: `GET https://hs-facop-api.onrender.com/actuator/health/liveness` (sin `/api`), zona **America/Lima**, días lunes a sábado, horas **9 a 20**, minutos 0, 10, 20, 30, 40, 50 (equivale a `*/10 9-20 * * 1-6`): último ping 20:50, despierto hasta ~21:05.
  - La última hora marcada es la **20**: marcar la 21 extiende el horario a las 22:00 y deja el margen en ~34 h.
  - Encabezado `Accept: application/json` (no estorba; ver abajo).
  - Aviso de fallo tras **3 fallos seguidos**: a las 9:00 un ping puede superar los 30 s que espera cron-job.org.
- **cron-job.org no despierta un servicio dormido**: Render le responde en ~1 s con una página HTML propia sin arrancar el servicio (hallazgo del 2026-10-12; con y sin el encabezado). Con el servicio despierto, el ping funciona.
- Por qué liveness (sin cambios): no consulta la base, así Neon puede dormir.

### Despertar: GitHub Actions del repo de Dentdesk
- `wake-up.yml` de `Davico84/Odontorisas`: lunes a sábado **8:45 Lima** (13:45 UTC; 15 min de holgura porque GitHub puede atrasar los programados), despierta Dentdesk y **HSO** con `curl` (hasta 3 intentos de 150 s) y falla, con correo de GitHub, si alguna no responde `UP`. Verificado el 2026-10-12.
- Ese repo es privado: el desactivado automático por 60 días sin actividad (repos públicos) no aplica; ~1 min de Actions por día.
- Alternativa descartada: un workflow igual en este repo. Duplicaría el despertar de HSO y habría que mantener dos horarios.
- Si el despertar falla: el primer ingreso despierta a HSO (~1 min con la pantalla de espera) y desde ahí cron-job.org lo mantiene.

### Presupuesto del workspace (peor mes: 27 días hábiles)
| Concepto | Horas |
|---|---|
| Por app: 8:45 → ~21:05 ≈ 12 h 15 min/día × 27 | ≈ 331 h |
| Dos apps | ≈ 662 h |
| Cupo del workspace | 750 h |
| Margen para uso fuera de horario | ≈ 88 h |

- Cada ingreso fuera de horario cuesta ~17 min (arranque + 15 min hasta la suspensión): el margen alcanza para unos 300 al mes entre las dos apps.
- Vigilarlo en Render (*Billing / Usage*). Si se agota, Render suspende **los dos** servicios hasta el mes siguiente.
- Alternativas que se evaluaron (lun–sáb): 9–20 (~142 h de margen), 8–20 (~88 h), 8–21 (~44 h), 9–22 (~34 h). Todos los días 9–20: ~52 h.

### Paso manual (hecho)
1. UptimeRobot: **pausado** (no borrado). Sin horario en el plan gratuito, despertaría a HSO de noche.
2. cron-job.org: job creado con los valores de arriba.

## Risks / Trade-offs

- **Dependencia del repo de Dentdesk** para el despertar de las 8:45: si se archiva o cambia, HSO deja de despertarse solo (sigue funcionando con la pantalla de espera). La guía lo indica.
- **Uso fuera de horario**: ~17 min del cupo compartido por ingreso. Aceptado.
- **Domingo**: el servicio duerme todo el día; quien entre espera ~1 min.
