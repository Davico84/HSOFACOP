const MONTHS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
const MONTHS_LONG = [
  "enero", "febrero", "marzo", "abril", "mayo", "junio",
  "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
];

/**
 * "2026-05" → "may". Se parte el texto: `new Date("2026-05")` es medianoche UTC y en Perú (UTC-5)
 * caería en abril.
 */
export function monthLabel(month: string): string {
  const index = Number(month.split("-")[1]) - 1;
  return MONTHS[index] ?? month;
}

/** "2026-05" → "mayo de 2026" (para lectores de pantalla). */
export function monthLongLabel(month: string): string {
  const [year, m] = month.split("-");
  const name = MONTHS_LONG[Number(m) - 1];
  return name ? `${name} de ${year}` : month;
}

/** 5.5 → "5,5" (coma decimal, como el resto de la app); nulo → "—". */
export function formatAverage(value: number | null | undefined): string {
  return value == null ? "—" : value.toFixed(1).replace(".", ",");
}

/** "1 historia" / "3 historias". */
export function historias(count: number): string {
  return `${count} ${count === 1 ? "historia" : "historias"}`;
}
