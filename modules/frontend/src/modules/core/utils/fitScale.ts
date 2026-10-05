/** Escala que hace caber `natural` en `available` (nunca agranda). */
export function fitScale(available: number, natural: number): number {
  if (available <= 0 || natural <= 0) return 1;
  return Math.min(1, Math.round((available / natural) * 1000) / 1000);
}
