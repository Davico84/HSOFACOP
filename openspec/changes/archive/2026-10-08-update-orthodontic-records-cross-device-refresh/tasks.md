> Rama `change/update-orthodontic-records-cross-device-refresh` desde `main`, PR a `main` (docs/commits.md §5b). Solo frontend: antes, skill `frontend-guard`. Commits por scope: frontend · docs.

## 1. Frontend

- [x] 1.1 `modules/core/hooks/useWindowReturn.ts` (genérico), con su test:
  - escucha `visibilitychange` (a visible), `focus` y `pageshow` con `persisted`;
  - ignora los eventos con la pestaña oculta;
  - un solo límite de `minIntervalMs` compartido por los tres;
  - limpia los listeners al desmontar.
- [x] 1.2 `StaleRecordBanner` con `reason` (`"save"` | `"remote"`) y sus dos textos (design)
- [x] 1.3 `RecordForm`: revisión encolada en `queue` con una sola consulta (`getRecord` + `setQueryData` en la key de `useRecord`) y firma `version`/`patientLockedAt`/`unlockRequest.requestedAt`/`lastUnlock.at`:
  - `autosave.cancel()` al iniciar;
  - barrera `staleRef` comprobada justo antes del PUT en cada autoguardado encolado;
  - `version.current` solo desde la cola (`acceptFresh`);
  - segunda comprobación de `isDirty`/`diffPaths` justo antes de remontar o de `form.reset` (con `keepDirtyValues`);
  - firma igual → nada;
  - solo cambia el bloqueo → el formulario recibe la historia nueva sin remontarse;
  - versión nueva:
    - sin diferencias reales → `version.current` y `form.reset` sin aviso;
    - con diferencias y sin cambios propios → recarga con aviso;
    - con diferencias y cambios propios → banner `remote` y autoguardado pausado;
  - errores:
    - red o 5xx → se ignora;
    - `404` → `onNotFound` y "Historia no encontrada", sin otra consulta;
    - `401` → interceptor.
- [x] 1.4 `RecordFormFeature`: remontaje con la historia ya en caché (sin segundo GET) y aviso `role="status"` ("Actualizada con cambios hechos en otro dispositivo") que sobrevive al remontaje y se borra con el primer cambio
- [x] 1.5 Tests (uno por scenario; MSW contando los GET; visibilidad, `focus` y `pageshow` simulados):
  - volver sin cambios propios;
  - autoguardado encolado durante la revisión con conflicto → no se envía el PUT;
  - escribir entre la consulta y el remontaje → no se pierde, banner `remote`;
  - cambios propios que chocan → banner `remote` y sin autoguardado;
  - cambios propios iguales a los del servidor → sin aviso, sin pendientes;
  - guardado al ocultar fallido y versión remota → banner y sin autoguardado;
  - impresión y desbloqueo remotos → paso 1 actualizado, lo escrito se conserva y sin banner;
  - sin cambios en el servidor;
  - guardado propio en curso;
  - una sola consulta:
    - test unitario de `useWindowReturn` con `visibilitychange`, `focus` y `pageshow` (`persisted` vía `Object.defineProperty`) dentro de 5 s;
    - test de integración contando los GET al alternar y al cerrar un diálogo Radix real;
    - ningún segundo GET al recargar ni en el `404`;
  - `404` → "Historia no encontrada";
  - `401` con refresh exitoso (reintenta) y fallido (login);
  - volver desde `/imprimir` muestra lo último;
  - historia nueva sin consulta.

  `pnpm validate` en verde.

## 2. Docs

- [x] 2.1 `docs/frontend.md` §4.1: `useWindowReturn`, la copia de trabajo (sin refetch automático) con revisión al volver, la firma que incluye el bloqueo y la comparación por valores
- [x] 2.2 Al archivar: `docs/vision.md` ✅
