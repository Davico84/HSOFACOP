/**
 * Notación FDI (paridad con `FdiTeeth` del backend): permanentes 11–48 (cuadrantes 1–4, piezas
 * 1–8) y temporales 51–85 (cuadrantes 5–8, piezas 1–5). Anteriores = incisivos y caninos (1–3).
 */
export function isValidFdi(code: number, anteriorOnly = false): boolean {
  if (!Number.isInteger(code)) return false;
  const quadrant = Math.floor(code / 10);
  const position = code % 10;
  const maxPosition = quadrant >= 1 && quadrant <= 4 ? 8 : quadrant >= 5 && quadrant <= 8 ? 5 : 0;
  if (position < 1 || position > maxPosition) return false;
  return !anteriorOnly || position <= 3;
}

/** Filas del odontograma tal como se ve al paciente: derecha del paciente a la izquierda. */
export const PERMANENT_ROWS: readonly (readonly number[])[] = [
  [18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28],
  [48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38],
];
export const DECIDUOUS_ROWS: readonly (readonly number[])[] = [
  [55, 54, 53, 52, 51, 61, 62, 63, 64, 65],
  [85, 84, 83, 82, 81, 71, 72, 73, 74, 75],
];

/** Piezas ordenadas para imprimir: "13, 26, 55". */
export function formatTeeth(teeth: readonly number[] | null | undefined): string {
  return [...(teeth ?? [])].sort((a, b) => a - b).join(", ");
}
