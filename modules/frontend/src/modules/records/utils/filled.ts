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

const isBlank = (v: unknown) => v === null || v === undefined || v === "" || (Array.isArray(v) && v.length === 0);

/**
 * `true` si el bloque tiene al menos un dato registrado. Corta en la primera hoja con valor (no
 * cuenta todo el árbol). Las hojas iguales a las de `baseline` (valores de una historia nueva, p. ej.
 * "Hábitos de succión: No" por defecto) no cuentan como dato.
 */
export function hasAnyData(value: unknown, baseline?: unknown): boolean {
  if (isBlank(value)) return false;
  if (Array.isArray(value)) return JSON.stringify(value) !== JSON.stringify(baseline);
  if (typeof value === "object") {
    const base = baseline && typeof baseline === "object" ? (baseline as Record<string, unknown>) : {};
    return Object.entries(value as Record<string, unknown>).some(([k, v]) => hasAnyData(v, base[k]));
  }
  return value !== baseline;
}
