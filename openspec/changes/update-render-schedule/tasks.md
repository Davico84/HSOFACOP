> Rama `change/update-render-schedule` desde `main`, PR a `main` (docs/commits.md §5b). Solo documentación (`skip_specs`): sin código, `Dockerfile` ni `render.yaml`. Commit `docs:`.

## 1. Documentación

- [ ] 1.1 `docs/deployment.md` §1: cupo de 750 h **compartido por workspace** con la tabla del presupuesto (31 días: ~349 h por app, ~698 h las dos, margen ~52 h), costo de un ingreso fuera de horario (~17 min), qué pasa si se agota y dónde ver el consumo en Render
- [ ] 1.2 `docs/deployment.md` §1: "Mantenerlo despierto: monitor externo (obligatorio)" → "Monitor con horario": cron-job.org, `GET /actuator/health/liveness`, zona America/Lima, `*/10 9-19 * * *` (9:00–19:50), servicio despierto hasta ~20:05, fuera de horario arranque en frío con la pantalla de espera; por qué cron-job.org (comprobar si UptimeRobot gratis permite horarios y dejarlo anotado)
- [ ] 1.3 `docs/deployment.md`: paso manual de migración (pausar UptimeRobot, crear el job, verificar al día siguiente), §5 paso 5 y fila nueva "Monitor con horario" en la matriz §6
- [ ] 1.4 `docs/backend.md` §11.1: el monitor pega a liveness en horario (el motivo de usar liveness no cambia)

## 2. Paso manual (responsable)

- [ ] 2.1 Pausar el monitor 24/7 de UptimeRobot
- [ ] 2.2 Crear el job en cron-job.org con el horario
- [ ] 2.3 Al día siguiente: historial del job con pings solo de 9:00 a 19:50 y servicio suspendido fuera de horario; marcar la fila de la matriz

## 3. Cierre

- [ ] 3.1 `openspec validate update-render-schedule --strict` en verde
- [ ] 3.2 Al archivar: `docs/vision.md` (✅ en la entrada de despliegue)
