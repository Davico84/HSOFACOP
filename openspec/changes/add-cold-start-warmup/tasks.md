> Commits separados por scope (docs/commits.md): backend · frontend · docs. Antes de tocar el frontend, skill `frontend-guard`.

## 1. Backend

- [ ] 1.1 `application.yml`: `management.endpoint.health.probes.enabled: true` y `show-details: ${HEALTH_SHOW_DETAILS:always}`
- [ ] 1.2 `HealthPingIT`: liveness sin sesión → `200` `UP`; liveness sin `db`; con `HEALTH_SHOW_DETAILS=never`, `/actuator/health` sin `components`. `mvn verify` verde

## 2. Frontend

- [ ] 2.1 `modules/core/hooks/useSlowWait.ts` (genérico: `true` tras `ms` con `active`; vuelve a `false` al pasar a inactivo) con su test
- [ ] 2.2 `RootLayout`: splash con el mensaje de arranque en frío (`role="status"`, `aria-live="polite"`, spinner) cuando `useSlowWait(status idle/loading, 4000)`
- [ ] 2.3 Tests (uno por scenario, timers simulados): rápido sin mensaje, a los 4 s con mensaje, desaparece al responder. `pnpm validate` verde

## 3. Docs

- [ ] 3.1 `docs/backend.md` §11.1: probes, liveness sin BD y `HEALTH_SHOW_DETAILS`
- [ ] 3.2 `docs/deployment.md` (nuevo): ping externo a `/actuator/health/liveness` cada 10 min (UptimeRobot o cron-job.org), 750 h/mes, `HEALTH_SHOW_DETAILS=never`; enlazar en `CLAUDE.md`
- [ ] 3.3 Al archivar: `docs/vision.md` ✅
