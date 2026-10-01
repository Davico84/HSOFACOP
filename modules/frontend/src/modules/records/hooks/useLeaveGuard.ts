import { useEffect, useRef } from "react";
import { useBlocker } from "react-router-dom";

/**
 * Pide confirmación antes de abandonar una pantalla con cambios sin guardar: navegación dentro de
 * la app (otra ruta; cambiar solo `?paso=` no cuenta) y cerrar o recargar la pestaña
 * (`beforeunload`, el diálogo nativo del navegador). `allowNextNavigation()` deja pasar la
 * siguiente navegación (p. ej. tras crear la historia y redirigir a su URL).
 */
export function useLeaveGuard(dirty: boolean) {
  const bypass = useRef(false);

  const blocker = useBlocker(({ currentLocation, nextLocation }) => {
    if (bypass.current) {
      bypass.current = false;
      return false;
    }
    return dirty && currentLocation.pathname !== nextLocation.pathname;
  });

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      event.preventDefault();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  return {
    blocker,
    allowNextNavigation: () => {
      bypass.current = true;
    },
  };
}
