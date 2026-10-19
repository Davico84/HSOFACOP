/** Lo que escribió la persona, en mayúsculas y sin espacios ni guiones (igual que el servidor). */
export function cleanCohortCode(raw: string): string {
  return raw.replace(/[\s-]+/g, "").toUpperCase();
}

/** Código guardado (`K7QM4TXR`) en dos grupos de 4 para mostrarlo (`K7QM-4TXR`). */
export function formatCohortCode(code: string): string {
  const clean = cleanCohortCode(code);
  return clean.length === 8 ? `${clean.slice(0, 4)}-${clean.slice(4)}` : clean;
}
