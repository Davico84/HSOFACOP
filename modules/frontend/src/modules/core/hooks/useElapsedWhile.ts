import { useEffect, useState } from "react";

/**
 * Segundos enteros transcurridos mientras `active` es `true`; vuelve a 0 al pasar a inactivo.
 * Se mide contra el reloj (no contando tics), así una pestaña en segundo plano, que espacia los
 * intervalos, no atrasa la cuenta. Limpia su intervalo al desmontar (StrictMode no deja timers).
 */
export function useElapsedWhile(active: boolean): number {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) return undefined;
    const startedAt = Date.now();
    const id = setInterval(() => setElapsed(Math.floor((Date.now() - startedAt) / 1000)), 1000);
    return () => {
      clearInterval(id);
      setElapsed(0);
    };
  }, [active]);

  return active ? elapsed : 0;
}
