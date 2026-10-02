/** Cuántos datos tiene registrados un bloque del formulario (hojas no vacías, en cualquier nivel). */
export function countFilled(value: unknown): number {
  if (value === null || value === undefined || value === "") return 0;
  if (Array.isArray(value)) return value.length > 0 ? 1 : 0;
  if (typeof value === "object") return Object.values(value).reduce<number>((n, v) => n + countFilled(v), 0);
  return 1;
}

/** "Sin datos" · "1 dato" · "6 datos". */
export function filledLabel(count: number): string {
  if (count === 0) return "Sin datos";
  return count === 1 ? "1 dato" : `${count} datos`;
}
