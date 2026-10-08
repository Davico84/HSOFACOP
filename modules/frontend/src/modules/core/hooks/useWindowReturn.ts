import { useEffect, useRef } from "react";

interface WindowReturnOptions {
  /** Mínimo entre dos llamadas, compartido por todos los eventos (llegan juntos al volver). */
  minIntervalMs: number;
  /** Falso = no escucha. */
  enabled?: boolean;
}

/**
 * Llama a `onReturn` cuando el usuario vuelve a la página: la pestaña vuelve a estar visible, la
 * ventana recibe el foco o el navegador la restaura desde su caché (`pageshow` con `persisted`,
 * Safari/iOS). Con la pestaña oculta no llama, y como mucho una vez cada `minIntervalMs`.
 */
export function useWindowReturn(onReturn: () => void, { minIntervalMs, enabled = true }: WindowReturnOptions) {
  const latest = useRef(onReturn);
  useEffect(() => {
    latest.current = onReturn;
  });

  useEffect(() => {
    if (!enabled) return undefined;
    let last = Number.NEGATIVE_INFINITY;
    const fire = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      if (now - last < minIntervalMs) return;
      last = now;
      latest.current();
    };
    const onVisibility = () => fire();
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) fire();
    };
    document.addEventListener("visibilitychange", onVisibility);
    window.addEventListener("focus", fire);
    window.addEventListener("pageshow", onPageShow);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.removeEventListener("focus", fire);
      window.removeEventListener("pageshow", onPageShow);
    };
  }, [enabled, minIntervalMs]);
}
