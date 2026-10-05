function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * Rutas ("models.nance.date") donde `a` y `b` difieren. Recorre objetos; un array o un valor
 * simple cuenta como una hoja (se compara entero).
 */
export function diffPaths(a: unknown, b: unknown, prefix = ""): string[] {
  if (isPlainObject(a) && isPlainObject(b)) {
    const keys = new Set([...Object.keys(a), ...Object.keys(b)]);
    return [...keys].flatMap((key) => diffPaths(a[key], b[key], prefix ? `${prefix}.${key}` : key));
  }
  const same = Array.isArray(a) || Array.isArray(b) ? JSON.stringify(a) === JSON.stringify(b) : Object.is(a, b);
  return same ? [] : [prefix];
}

/** `a` y `b` son la misma ruta o una contiene a la otra. */
export function relatedPaths(a: string, b: string): boolean {
  return a === b || a.startsWith(`${b}.`) || b.startsWith(`${a}.`);
}

/** Valor en una ruta con puntos (sin crear nada en el camino). */
export function valueAt(source: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((node, key) => (isPlainObject(node) ? node[key] : undefined), source);
}
