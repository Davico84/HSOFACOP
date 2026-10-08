> Rama `change/update-orthodontic-records-cross-device-refresh` desde `main`, PR a `main` (docs/commits.md §5b). Solo frontend: antes, skill `frontend-guard`. Commits por scope: frontend · docs.

## 1. Frontend

- [ ] 1.1 `modules/core/hooks/useWindowReturn.ts` (genérico), con su test:
  - escucha `visibilitychange` (a visible), `focus` y `pageshow` con `persisted`;
  - ignora los eventos con la pestaña oculta;
  - un solo límite de `minIntervalMs` compartido por los tres;
  - limpia los listeners al desmontar.
- [ ] 1.2 `StaleRecordBanner` con `reason` (`"save"` | `"remote"`) y sus dos textos (design)
- [ ] 1.3 `RecordForm`: revisión encolada en `queue` con un solo `getRecord`, `setQueryData` y firma `version`/`patientLockedAt`/`unlockRequest.requestedAt`/`lastUnlock.at`:
  - firma igual → nada;
  - solo cambia el bloqueo → el formulario recibe la historia nueva sin remontarse;
  - versión nueva:
    - sin diferencias reales → `version.current` y `form.reset` sin aviso;
    - con diferencias y sin cambios propios → recarga con aviso;
    - con diferencias y cambios propios → banner `remote` y autoguardado pausado;
  - errores:
    - red o 5xx → se ignora;
    - `404` → `refetch` y "Historia no encontrada";
    - `401` → interceptor.
- [ ] 1.4 `RecordFormFeature`: remontaje con la historia ya en caché (sin segundo GET) y aviso `role="status"` ("Actualizada con cambios hechos en otro dispositivo") que sobrevive al remontaje y se borra con el primer cambio
- [ ] 1.5 Tests (uno por scenario; MSW contando los GET; visibilidad, `focus` y `pageshow` simulados):
  - volver sin cambios propios;
  - cambios propios que chocan → banner `remote` y sin autoguardado;
  - cambios propios iguales a los del servidor → sin aviso, sin pendientes;
  - guardado al ocultar fallido y versión remota → banner y sin autoguardado;
  - impresión y desbloqueo remotos → paso 1 actualizado, lo escrito se conserva y sin banner;
  - sin cambios en el servidor;
  - guardado propio en curso;
  - una sola consulta (foco + visibilidad + `pageshow`, alternar, cierre de un diálogo Radix) y ningún segundo GET al recargar;
  - `404` → "Historia no encontrada";
  - `401` con refresh exitoso (reintenta) y fallido (login);
  - volver desde `/imprimir` muestra lo último;
  - historia nueva sin consulta.

  `pnpm validate` en verde.

## 2. Docs

- [ ] 2.1 `docs/frontend.md` §4.1: `useWindowReturn`, la copia de trabajo (sin refetch automático) con revisión al volver, la firma que incluye el bloqueo y la comparación por valores
- [ ] 2.2 Al archivar: `docs/vision.md` ✅
