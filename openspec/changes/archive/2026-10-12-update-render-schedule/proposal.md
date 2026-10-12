## Why

El backend corre en Render Free, con **750 h de instancia al mes por workspace**. Hasta ahora un monitor externo (UptimeRobot) lo mantenía despierto 24/7 (~730–744 h/mes), lo que agota el cupo de un solo servicio. Dentdesk (proyecto hermano, repo `Davico84/Odontorisas`) se desplegó en el **mismo workspace**: las dos 24/7 no entran.

Decisión del usuario (2026-10-11, aplicada y verificada en producción el 2026-10-12 desde el repo de Dentdesk): las dos apps despiertas de **lunes a sábado, de 9:00 a 21:00, hora de Perú** (America/Lima). Este change deja documentado en HSO lo que ya está funcionando.

## What Changes

- **Monitor con horario** en lugar de 24/7: un job de cron-job.org llama `GET /actuator/health/liveness` cada 10 min, lunes a sábado, de 9:00 a 20:50 (America/Lima). Render suspende 15 min después del último tráfico: despierto hasta ~21:05.
- **Despertar diario**: cron-job.org **no despierta** un servicio dormido (Render le responde con una página propia sin arrancarlo; hallazgo del 2026-10-12), solo lo mantiene despierto. Lo despierta el workflow `wake-up.yml` del repo de Dentdesk (lunes a sábado, 8:45 Lima), que despierta Dentdesk **y HSO**.
- **Fuera de horario** (noches y domingos) el servicio duerme y el primer ingreso ve la pantalla de arranque en frío que ya existe (`add-cold-start-warmup`, ~64 s medido).
- **`docs/deployment.md`**: el monitor pasa de "obligatorio 24/7" al horario, con el **presupuesto compartido del workspace** (peor mes, 27 días hábiles: ~12 h 15 min/día por app ≈ 331 h; ~662 h entre las dos, de 750; margen ~88 h). Cada ingreso fuera de horario cuesta ~17 min; si se agota el cupo, Render suspende los dos servicios hasta el mes siguiente.
- **Paso manual del responsable** (hecho el 2026-10-11/12, se documenta): pausar UptimeRobot y crear el job en cron-job.org.
- **Sin cambios de comportamiento del sistema**: ningún requisito dice que el servicio esté despierto 24/7 ni que el monitor corra siempre. "Endpoint de ping para mantener el backend despierto" (`project-foundation`) solo exige que liveness responda sin tocar la base, y eso no cambia. Change solo de documentación (`skip_specs`).

### Non-goals

- Código de la app, `Dockerfile`, `render.yaml` (no configura el monitor).
- Un workflow de despertar propio en este repo: el de Dentdesk ya despierta las dos apps (duplicarlo gastaría minutos y complicaría el horario).
- Cambiar el horario elegido o la copia de seguridad (03:00, contra Neon, no despierta a Render).

## Capabilities

### New Capabilities
<!-- ninguna -->

### Modified Capabilities
<!-- ninguna: ningún requisito cambia (skip_specs) -->

## Impact

- `docs/deployment.md`: §1 (cupo compartido, monitor con horario, despertar diario), §5 (puesta en marcha), §6 (matriz).
- `docs/backend.md` §11.1: el ping corre en horario (el motivo de usar liveness no cambia).
- Operación: fuera de lunes a sábado 9:00–21:05 el servicio no está disponible al instante (arranque de ~1 min con la pantalla de espera). HSO depende del repo de Dentdesk para el despertar de las 8:45; si ese workflow falla, el primer ingreso igual lo despierta.
