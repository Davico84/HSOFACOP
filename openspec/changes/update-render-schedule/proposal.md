## Why

El backend corre en Render Free, con **750 h de instancia al mes por workspace**. Hoy un monitor externo lo mantiene despierto 24/7 (~730–744 h/mes), lo que agota el cupo de un solo servicio. Se va a desplegar una segunda app (Dentdesk, proyecto hermano) en el **mismo workspace**: las dos despiertas 24/7 no entran. Decisión tomada: las dos apps despiertas solo de **9:00 a 20:00, hora de Perú** (America/Lima); los consultorios no abren antes de las 9.

## What Changes

- **Monitor con horario** en lugar de 24/7: cron-job.org llama `GET /actuator/health/liveness` cada 10 min de **9:00 a 19:50** (America/Lima). El último ping deja el servicio despierto hasta ~20:05 (Render suspende tras 15 min sin tráfico).
- **Fuera de horario el servicio duerme**: el primer ingreso ve la pantalla de arranque en frío que ya existe (`add-cold-start-warmup`, ~1 min).
- **`docs/deployment.md`**: el monitor pasa de "obligatorio 24/7" al horario, con el **presupuesto compartido del workspace** (mes de 31 días: ~11 h 15 min/día por app ≈ 349 h; ~698 h entre las dos, de 750; margen ~52 h). Cada ingreso fuera de horario cuesta ~17 min (arranque + 15 min hasta la suspensión); si se agota el cupo, Render suspende los servicios hasta el mes siguiente.
- **Paso manual del responsable** (documentado, no automatizado): pausar el monitor 24/7 actual (UptimeRobot) y crear el job con horario en cron-job.org.
- **Sin cambios de comportamiento del sistema**: ningún requisito dice que el servicio esté despierto 24/7 ni que el monitor corra siempre. "Endpoint de ping para mantener el backend despierto" (`project-foundation`) solo exige que liveness responda sin tocar la base, y eso no cambia. Change solo de documentación (`skip_specs`).

### Non-goals

- Código de la app, `Dockerfile`, `render.yaml` (no configura el monitor).
- Cualquier cosa de Dentdesk (su monitor y su despliegue van en su propio repo).
- Cambiar el horario elegido o la copia de seguridad (corre a las 03:00 contra Neon, no contra Render).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
<!-- ninguna: ningún requisito cambia (skip_specs) -->

## Impact

- `docs/deployment.md`: §1 (cupo y monitor con horario), §5 (puesta en marcha), §6 (matriz de verificación).
- `docs/backend.md` §11.1: la mención al "monitor externo" sigue valiendo; solo se aclara que el ping corre en horario.
- Operación: el servicio no está disponible al instante fuera de 9:00–20:05 (arranque de ~1 min con la pantalla de espera).
