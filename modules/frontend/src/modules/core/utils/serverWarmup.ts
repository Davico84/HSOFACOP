/** Etapas de la espera al backend al cargar la app (pantalla de arranque en frío). */
export type WarmupStage = "loading" | "warming" | "stuck" | "offline";

/** Hasta aquí, "Cargando…" como siempre: una carga normal no muestra nada distinto. */
export const WARMING_AFTER_S = 4;
/** Desde aquí la ayuda pasa a "Ya casi está…". */
export const ALMOST_AFTER_S = 45;
/** Desde aquí se ofrece reintentar (el arranque en frío de Render ronda el minuto). */
export const STUCK_AFTER_S = 90;

/** Sin red manda sobre el tiempo: no se confunde una conexión caída con el servidor dormido. */
export function warmupStage(elapsedSeconds: number, online: boolean): WarmupStage {
  if (!online) return "offline";
  if (elapsedSeconds >= STUCK_AFTER_S) return "stuck";
  if (elapsedSeconds >= WARMING_AFTER_S) return "warming";
  return "loading";
}

/**
 * Progreso **estimado** (no medido): rápido al inicio, ~85 % al minuto y nunca llega al 100 %
 * por sí solo; la pantalla desaparece cuando el servidor responde.
 */
export function estimatedProgress(elapsedSeconds: number): number {
  return Math.round(92 * (1 - Math.exp(-elapsedSeconds / 22)));
}
