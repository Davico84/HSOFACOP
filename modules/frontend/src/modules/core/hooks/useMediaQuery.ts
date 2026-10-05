import { useCallback, useSyncExternalStore } from "react";

/**
 * `true` si la media query se cumple (p. ej. `"(min-width: 1024px)"`), y se actualiza al cambiar el
 * tamaño. Sin `matchMedia` (tests en jsdom) devuelve `fallback`.
 */
export function useMediaQuery(query: string, fallback = false): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      if (typeof window === "undefined" || !window.matchMedia) return () => undefined;
      const list = window.matchMedia(query);
      list.addEventListener("change", onChange);
      return () => list.removeEventListener("change", onChange);
    },
    [query],
  );
  const snapshot = () => (typeof window === "undefined" || !window.matchMedia ? fallback : window.matchMedia(query).matches);
  return useSyncExternalStore(subscribe, snapshot, () => fallback);
}
