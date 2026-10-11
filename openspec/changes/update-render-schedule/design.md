## Context

- Render Free: el servicio se suspende tras **15 min sin tráfico entrante** y la siguiente petición lo despierta (~40 s–1 min de arranque con el AOT cache, `docs/deployment.md` §4). Cupo: **750 h de instancia al mes por workspace**, compartido por todos sus servicios gratuitos; al agotarse, Render suspende los servicios hasta el mes siguiente.
- Hoy: UptimeRobot llama a `/actuator/health/liveness` cada 10 min, siempre → ~744 h en un mes de 31 días.
- El frontend (Vercel) ya muestra la pantalla de arranque en frío mientras espera la primera respuesta (`add-cold-start-warmup`).
- La copia de seguridad diaria (03:00 Lima) se conecta a Neon, no a Render: no despierta el servicio.
- Decisión tomada por el usuario (no se discute aquí): las dos apps del workspace despiertas de **9:00 a 20:00** (America/Lima).

## Goals / Non-Goals

**Goals:** que el monitor siga el horario, que la guía explique el presupuesto compartido y cómo hacer el cambio a mano.

**Non-Goals:** código, `Dockerfile`, `render.yaml`, Dentdesk, automatizar la configuración del monitor.

## Decisions

### Monitor: cron-job.org con horario
- Job en cron-job.org:
  - URL `https://<servicio>.onrender.com/actuator/health/liveness`, método `GET`;
  - zona horaria del job **America/Lima** (Perú no tiene horario de verano: no hay corrimientos);
  - programación cada 10 min, horas 9–19 (crontab `*/10 9-19 * * *`): primer ping 9:00, último 19:50;
  - esperado `200` con `"status":"UP"`; notificación por correo si falla.
- Por qué cron-job.org y no UptimeRobot: cron-job.org programa por crontab con zona horaria, gratis. En UptimeRobot el horario se haría con *maintenance windows*, que hasta donde sabemos no están en el plan gratuito (verificarlo al aplicar; si estuvieran, igual se prefiere el crontab explícito).
- Por qué **liveness** (sin cambios): no consulta la base, así Neon puede dormir.
- El último ping (19:50) mantiene el servicio hasta ~20:05. El primero (9:00) lo despierta: quien entre justo a las 9:00 puede ver la pantalla de espera ~1 min.

### Presupuesto del workspace (mes de 31 días)
| Concepto | Horas |
|---|---|
| Por app: 9:00 → ~20:05, más el arranque ≈ 11 h 15 min/día × 31 | ≈ 349 h |
| Dos apps | ≈ 698 h |
| Cupo del workspace | 750 h |
| Margen para uso fuera de horario | ≈ 52 h |

- Cada ingreso fuera de horario cuesta ~17 min (≈ 1–2 min de arranque + 15 min hasta la suspensión), aunque dure segundos. El margen alcanza para ~180 ingresos fuera de horario al mes entre las dos apps.
- Cómo vigilarlo: Render → *Billing / Usage* muestra las horas consumidas del mes por workspace.
- Si se agota: Render suspende los servicios hasta el mes siguiente (ni la pantalla de espera los despierta). Es la razón del horario.

### Paso manual, documentado
1. UptimeRobot: **pausar** el monitor 24/7 (no borrarlo, por si se vuelve al esquema anterior).
2. cron-job.org: crear el job con los valores de arriba.
3. Comprobar al día siguiente en el historial del job: pings 9:00–19:50 en verde y nada fuera de ese rango; en Render, que el servicio se suspende pasadas las 20:05.

### Documentación
- `docs/deployment.md` §1: el párrafo del cupo pasa a "compartido entre los servicios del workspace" con la tabla; "Mantenerlo despierto: monitor externo (obligatorio)" pasa a "Monitor con horario", con la tabla de cron-job.org y la nota del primer ingreso fuera de horario.
- §2 (Neon): la frase "el monitor pega a liveness" sigue válida.
- §5 paso 5: cron-job.org con horario en lugar de "cada 10 min".
- §6 matriz: fila nueva "Monitor con horario" (pings solo en horario; suspendido fuera de él); la fila "Monitor y ADMIN" queda como registro histórico del primer despliegue.
- `docs/backend.md` §11.1: aclarar que el monitor pega en horario (la razón de usar liveness no cambia).

## Risks / Trade-offs

- **Uso fuera de horario**: cada ingreso cuesta ~17 min del cupo compartido y ~1 min de espera. Aceptado: los consultorios trabajan en horario.
- **Uso intenso fuera de horario** (p. ej. alguien trabaja varias noches): puede comerse el margen de las dos apps. La guía indica dónde mirar el consumo.
- **Si cron-job.org falla**: el servicio solo duerme y arranca con la pantalla de espera; no se pierde nada. Su correo de fallo lo avisa.
- **Primer ingreso a las 9:00 en punto**: puede tocar el arranque. Si molesta, adelantar el primer ping (fuera del alcance de esta decisión).
