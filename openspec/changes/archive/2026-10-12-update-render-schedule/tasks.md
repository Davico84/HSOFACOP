> Rama `change/update-render-schedule` desde `main`, PR a `main` (docs/commits.md §5b). Solo documentación (`skip_specs`): sin código, `Dockerfile` ni `render.yaml`. Commit `docs:`.

## 1. Documentación

- [x] 1.1 `docs/deployment.md` §1: cupo de 750 h **compartido por workspace** con Dentdesk y tabla del presupuesto (peor mes, 27 días hábiles: ~331 h por app, ~662 h las dos, margen ~88 h), costo de un ingreso fuera de horario (~17 min), qué pasa si se agota y dónde ver el consumo
- [x] 1.2 `docs/deployment.md` §1: "Mantenerlo despierto: monitor externo (obligatorio)" → horario lunes a sábado 9:00–21:00: cron-job.org (horas 9–20 cada 10 min, America/Lima, `Accept: application/json`, aviso tras 3 fallos) que mantiene pero **no despierta**; despertar con `wake-up.yml` del repo de Dentdesk a las 8:45; qué pasa si falla; UptimeRobot pausado
- [x] 1.3 `docs/deployment.md` §5 paso 5 y fila "Monitor con horario" en la matriz §6
- [x] 1.4 `docs/backend.md` §11.1: el monitor pega a liveness en horario

## 2. Paso manual (responsable)

- [x] 2.1 Pausar el monitor 24/7 de UptimeRobot
- [x] 2.2 Crear el job en cron-job.org con el horario
- [x] 2.3 Verificar el despertar y el mantenimiento en producción

## 3. Cierre

- [x] 3.1 `openspec validate update-render-schedule --strict` en verde
- [x] 3.2 Al archivar: `docs/vision.md` (✅)
